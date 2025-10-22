import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { MailService } from '../mail/mail.service'
import { CreditsService } from '../credits/credits.service'
import * as argon2 from 'argon2'
import { signAccess, signRefresh } from './jwt.util'
import { randomUrlToken, sha256Hex, randomVerificationCode } from '../common/crypto.util'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly creditsService: CreditsService
  ) {}

  private expireMinutes() {
    return Number(process.env.AUTH_CODE_EXPIRE_MIN || 5);
  }
  
  private resendCooldownSec() { 
    return Number(process.env.AUTH_RESEND_COOLDOWN_SEC || 60); 
  }

  async register({ email, passwordHash, name }: { email: string; passwordHash: string; name: string }) {
    // 1) 사용자 생성 (email unique)
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name, roles: JSON.stringify(['USER']) },
    });

    // 2) 인증 레코드 발급 + 이메일 발송
    try {
      await this.issueAndSendEmailVerification(user.id, user.email);
    } catch (error) {
      console.error('이메일 발송 실패:', error instanceof Error ? error.message : String(error));
      // 이메일 발송 실패 시에도 사용자 생성은 성공으로 처리
      // 하지만 로그는 남겨서 문제를 추적할 수 있도록 함
    }

    return { userId: user.id };
  }

  async issueAndSendEmailVerification(userId: number, email: string) {
    // 6자리 숫자 인증 코드 생성
    const token = randomVerificationCode(6);
    const codeHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + this.expireMinutes() * 60 * 1000);

    // 디버깅: 인증 코드 로그 출력
    console.log('='.repeat(50));
    console.log(`📧 이메일 인증 코드 발급`);
    console.log(`   이메일: ${email}`);
    console.log(`   인증 코드: ${token}`);
    console.log(`   코드 해시: ${codeHash}`);
    console.log(`   만료 시간: ${expiresAt.toISOString()}`);
    console.log('='.repeat(50));

    const ev = await this.prisma.emailVerification.create({
      data: { userId, codeHash, expiresAt },
    });

    // 사용자 정보 가져오기
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    // 이메일 인증 코드 발송
    await this.mail.sendVerificationEmail(email, token, user?.name || undefined);

    return { id: ev.id };
  }

  async verifyEmailByToken(token: string) {
    const codeHash = sha256Hex(token);
    const now = new Date();

    // 디버깅: 검증 시도 로그
    console.log('='.repeat(50));
    console.log(`🔍 이메일 인증 코드 검증 시도`);
    console.log(`   입력된 코드: ${token}`);
    console.log(`   계산된 해시: ${codeHash}`);
    console.log(`   현재 시간: ${now.toISOString()}`);

    const ev = await this.prisma.emailVerification.findFirst({
      where: { codeHash, consumedAt: null, expiresAt: { gt: now } },
      include: { user: true },
    });

    console.log(`   검증 결과: ${ev ? '✅ 성공' : '❌ 실패'}`);
    if (ev) {
      console.log(`   사용자: ${ev.user.email} (ID: ${ev.user.id})`);
      console.log(`   만료 시간: ${ev.expiresAt.toISOString()}`);
    }
    console.log('='.repeat(50));

    if (!ev) return { ok: false, code: 'INVALID_OR_EXPIRED', message: '유효하지 않거나 만료된 링크입니다.' };

    // 소비 처리 + 사용자 검증 완료
    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: ev.id },
        data: { consumedAt: now },
      }),
      this.prisma.user.update({
        where: { id: ev.userId },
        data: { emailVerifiedAt: now },
      }),
    ]);

    return { ok: true, userId: ev.userId };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true }; // 존재 노출 방지

    // 최근 발송 시각 체크(쿨다운)
    const recent = await this.prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const cooldown = this.resendCooldownSec() * 1000;
    if (recent && Date.now() - recent.createdAt.getTime() < cooldown) {
      return { ok: false, code: 'TOO_FREQUENT', message: `잠시 후 다시 시도해 주세요.` };
    }

    await this.issueAndSendEmailVerification(user.id, user.email);
    return { ok: true };
  }

  async login(
    dto: { email: string; password: string },
    secrets: { access: string; refresh: string },
    ttls: { access: number; refresh: number }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    })

    if (!user || !(await argon2.verify((user as any).passwordHash, dto.password))) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_INVALID', message: 'Invalid credentials' }
      })
    }

    // 이메일 인증 확인 (로컬 회원가입 사용자만)
    if (user.provider === 'local' && !user.emailVerifiedAt) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'E_EMAIL_NOT_VERIFIED',
          message: 'Email not verified. Please check your email for verification code.'
        }
      })
    }

    const access = signAccess(this.jwt, user as any, secrets.access, ttls.access)
    const refresh = signRefresh(this.jwt, user as any, secrets.refresh, ttls.refresh)

    // Store refresh token jti in Redis whitelist
    const refreshPayload = this.jwt.decode(refresh) as any
    await this.redis.setRefreshToken(refreshPayload.jti, user.id, ttls.refresh)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      access,
      refresh
    }
  }

  verifyToken(token: string, secret: string) {
    try {
      return this.jwt.verify(token, { secret })
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_INVALID_TOKEN', message: 'Invalid token' }
      })
    }
  }

  async refreshTokens(
    refreshToken: string,
    secrets: { access: string; refresh: string },
    ttls: { access: number; refresh: number }
  ) {
    const payload = this.verifyToken(refreshToken, secrets.refresh)
    
    // Check if refresh token jti exists in Redis whitelist
    const storedUserId = await this.redis.getRefreshToken(payload.jti)
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_INVALID_REFRESH', message: 'Invalid refresh token' }
      })
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    })

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_USER_NOT_FOUND', message: 'User not found' }
      })
    }

    // Remove old refresh token from whitelist
    await this.redis.deleteRefreshToken(payload.jti)

    // Generate new tokens
    const access = signAccess(this.jwt, user as any, secrets.access, ttls.access)
    const refresh = signRefresh(this.jwt, user as any, secrets.refresh, ttls.refresh)

    // Store new refresh token jti in Redis whitelist
    const newRefreshPayload = this.jwt.decode(refresh) as any
    await this.redis.setRefreshToken(newRefreshPayload.jti, user.id, ttls.refresh)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      access,
      refresh
    }
  }

  async logout(refreshToken: string, refreshSecret: string) {
    try {
      const payload = this.verifyToken(refreshToken, refreshSecret)
      await this.redis.deleteRefreshToken(payload.jti)
    } catch (error) {
      // Even if token is invalid, we still want to clear cookies
      // so we don't throw here
    }
  }

  async getUserById(userId: number) {
    try {
      console.log('[getUserById] Starting user fetch:', { userId })

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          expert: {
            select: {
              id: true,
              displayId: true,
              hourlyRate: true,
              name: true,
              title: true,
              specialty: true,
              bio: true,
              avatarUrl: true,
              ratingAvg: true,
              reviewCount: true,
              isActive: true,
              level: true,
              responseTime: true
            }
          }
        }
      })

      if (!user) {
        console.error('[getUserById] User not found:', { userId })
        throw new UnauthorizedException({
          success: false,
          error: { code: 'E_AUTH_USER_NOT_FOUND', message: 'User not found' }
        })
      }

      console.log('[getUserById] User found:', { userId, email: user.email, hasExpert: !!user.expert })

      // 전문가 지원 상태 확인 (에러 발생 시에도 사용자 정보는 반환)
      let expertApplication = null
      try {
        expertApplication = await this.prisma.expertApplication.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })

        console.log('[getUserById] ExpertApplication lookup success:', {
          userId,
          found: !!expertApplication,
          status: expertApplication?.status,
          hasKeywords: !!expertApplication?.keywords,
          hasConsultationTypes: !!expertApplication?.consultationTypes
        })
      } catch (error: any) {
        // ExpertApplication 조회 실패해도 사용자 기본 정보는 반환
        console.error('[getUserById] ExpertApplication lookup failed (continuing with user data):', {
          userId,
          errorMessage: error?.message,
          errorCode: error?.code,
          isPrismaError: error?.code?.startsWith('P'),
          isMySQLError: error?.meta?.code
        })

        // expertApplication은 null로 유지
        // 아래 로직은 expertApplication이 null이어도 정상 작동:
        // - Line 316-317: expertApplicationStatus, expertApplicationId는 null
        // - Line 326: expertApplicationData는 생성 안 됨 (조건문 false)
      }

    // roles가 JSON 문자열인 경우 파싱
    let roles = user.roles
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles)
      } catch (error) {
        console.error('Failed to parse user roles:', error)
        roles = ['USER'] // 기본값
      }
    }

    // 크레딧 잔액 계산
    const credits = await this.creditsService.getBalance(userId)

    const result: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt,
      credits,
      expertApplicationStatus: expertApplication?.status || null,
      expertApplicationStage: expertApplication?.currentStage || null,
      expertApplicationId: expertApplication?.id || null
    }

    // Expert 정보가 있는 경우 추가
    if (user.expert) {
      result.expert = user.expert
    }

    // ExpertApplication 상세 정보 추가 (PENDING 또는 ADDITIONAL_INFO_REQUESTED 상태인 경우)
    if (expertApplication && (expertApplication.status === 'PENDING' || expertApplication.status === 'ADDITIONAL_INFO_REQUESTED')) {
      // JSON 필드 파싱 헬퍼 (배열용)
      const parseJsonField = (field: any): any => {
        if (!field) return [];
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (e) {
            console.warn('Failed to parse JSON field:', field);
            return [];
          }
        }
        return Array.isArray(field) ? field : [];
      };

      // JSON 객체 파싱 헬퍼 (객체용)
      const parseJsonObject = (field: any): any => {
        if (!field) return undefined;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (e) {
            console.warn('Failed to parse JSON object:', field);
            return undefined;
          }
        }
        return typeof field === 'object' ? field : undefined;
      };

      result.expertApplicationData = {
        id: expertApplication.id,
        displayId: expertApplication.displayId,
        category: expertApplication.specialty.split(' - ')[0] || expertApplication.specialty,
        specialty: expertApplication.specialty,
        submittedAt: expertApplication.createdAt,
        currentStage: expertApplication.currentStage || 'SUBMITTED',
        name: expertApplication.name,
        email: expertApplication.email,
        phoneNumber: expertApplication.phoneNumber,
        jobTitle: expertApplication.jobTitle,
        experienceYears: expertApplication.experienceYears,
        languages: parseJsonField(expertApplication.languages),
        bio: expertApplication.bio,
        keywords: parseJsonField(expertApplication.keywords),
        consultationTypes: parseJsonField(expertApplication.consultationTypes),
        certifications: parseJsonField(expertApplication.certifications),
        education: parseJsonField(expertApplication.education),
        workExperience: parseJsonField(expertApplication.workExperience),
        profileImage: expertApplication.profileImage,
        mbti: expertApplication.mbti,
        consultationStyle: expertApplication.consultationStyle,
        availability: parseJsonObject(expertApplication.availability),
        socialLinks: parseJsonObject(expertApplication.socialLinks),
        portfolioImages: parseJsonField(expertApplication.portfolioImages),
        emailNotification: expertApplication.emailNotification,
        smsNotification: expertApplication.smsNotification,
        reviewNotes: expertApplication.reviewNotes || null
      }
    }

      console.log('[getUserById] Successfully prepared user data:', {
        userId,
        hasExpertApplicationData: !!result.expertApplicationData
      })

      return result
    } catch (error: any) {
      console.error('[getUserById] Error:', {
        userId,
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        isPrismaError: error?.code?.startsWith('P'),
        isUnauthorized: error instanceof UnauthorizedException
      })

      // UnauthorizedException은 그대로 throw (이미 적절한 에러 형식)
      if (error instanceof UnauthorizedException) {
        throw error
      }

      // Prisma 에러 처리
      if (error?.code?.startsWith('P')) {
        console.error('[getUserById] Prisma database error:', {
          code: error.code,
          meta: error.meta,
          userId
        })
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'E_AUTH_DB_ERROR',
            message: 'Database error while fetching user information'
          }
        })
      }

      // 기타 예상치 못한 에러
      console.error('[getUserById] Unexpected error:', error)
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'E_AUTH_FETCH_FAILED',
          message: 'Failed to fetch user information'
        }
      })
    }
  }

  async validateOAuthUser(profile: {
    providerId: string
    provider: string
    email: string
    name: string
    avatarUrl?: string
  }) {
    // 먼저 provider + providerId로 기존 사용자 찾기
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    })

    if (user) {
      // 기존 OAuth 사용자 - 프로필 정보 업데이트
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isNewUser: false,
        onboardingCompleted: !!user.onboardingCompletedAt
      }
    }

    // 이메일로 기존 계정 확인 (로컬 계정이 있는 경우)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    })

    if (existingUser && existingUser.provider === 'local') {
      // 로컬 계정에 OAuth 정보 연동
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          provider: profile.provider,
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl || existingUser.avatarUrl,
        },
      })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isNewUser: false,
        onboardingCompleted: !!user.onboardingCompletedAt
      }
    }

    // 새 OAuth 사용자 생성 (onboardingCompletedAt은 null로 시작)
    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        provider: profile.provider,
        providerId: profile.providerId,
        avatarUrl: profile.avatarUrl,
        passwordHash: null, // OAuth 사용자는 비밀번호 없음
        roles: JSON.stringify(['USER']), // 기본 USER 역할 부여
        onboardingCompletedAt: null, // 온보딩 미완료 상태로 시작
      } as any,
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isNewUser: true,
      onboardingCompleted: false
    }
  }

  signAccess(user: { id: number; email: string }, secret: string, ttlSec: number) {
    return signAccess(this.jwt, user, secret, ttlSec)
  }

  signRefresh(user: { id: number; email: string }, secret: string, ttlSec: number) {
    return signRefresh(this.jwt, user, secret, ttlSec)
  }

  async storeRefreshToken(jti: string, userId: number, ttlSec: number) {
    await this.redis.setRefreshToken(jti, userId, ttlSec)
  }

  // OAuth 온보딩용 임시 토큰 생성
  async generateOAuthTempToken(user: {
    id: number
    email: string
    name: string
    provider: string
    isNewUser: boolean
  }) {
    const jti = randomUrlToken(32)
    const tempToken = this.jwt.sign(
      {
        type: 'oauth_pending',
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        isNewUser: user.isNewUser,
        jti,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET!,
        expiresIn: '5m', // 5분 TTL
      }
    )

    // Redis에 임시 토큰 정보 저장
    await this.redis.setex(
      `oauth_pending:${jti}`,
      300, // 5분
      JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        isNewUser: user.isNewUser,
      })
    )

    return tempToken
  }

  // OAuth 임시 토큰 검증
  async verifyOAuthTempToken(token: string) {
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET! }) as any

      if (payload.type !== 'oauth_pending') {
        return { valid: false, error: 'Invalid token type' }
      }

      // Redis에서 토큰 정보 확인
      const data = await this.redis.get(`oauth_pending:${payload.jti}`)
      if (!data) {
        return { valid: false, error: 'Token expired or already used' }
      }

      return {
        valid: true,
        user: JSON.parse(data),
        jti: payload.jti,
      }
    } catch (error) {
      return { valid: false, error: 'Invalid or expired token' }
    }
  }

  // OAuth 온보딩 완료 처리
  async completeOAuthOnboarding(tempToken: string, agreedToTerms: boolean) {
    const verification = await this.verifyOAuthTempToken(tempToken)

    if (!verification.valid) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_INVALID_TEMP_TOKEN', message: verification.error }
      })
    }

    if (!agreedToTerms) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_TERMS_NOT_AGREED', message: 'Terms must be agreed to complete onboarding' }
      })
    }

    const { user, jti } = verification

    // 온보딩 완료 처리
    const updatedUser = await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        onboardingCompletedAt: new Date(),
        emailVerifiedAt: new Date(), // OAuth 사용자는 이메일 자동 인증
      },
    })

    // Redis에서 임시 토큰 삭제 (1회용)
    await this.redis.del(`oauth_pending:${jti}`)

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    }
  }

  // ==================== Phone Verification ====================

  /**
   * 휴대폰 인증번호 발송
   * @param phoneNumber - 휴대폰 번호 (예: 01012345678)
   * @param userId - Optional: 로그인된 사용자 ID (전문가 등록 시)
   */
  async sendPhoneVerification(phoneNumber: string, userId?: number) {
    // 최근 발송 확인 (3분 쿨다운)
    const recentVerification = await this.prisma.phoneVerification.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    const cooldownSec = 180; // 3분
    if (recentVerification && Date.now() - recentVerification.createdAt.getTime() < cooldownSec * 1000) {
      const remainingTime = Math.ceil((cooldownSec * 1000 - (Date.now() - recentVerification.createdAt.getTime())) / 1000);
      return {
        ok: false,
        code: 'TOO_FREQUENT',
        message: `${remainingTime}초 후에 다시 시도해주세요.`,
      };
    }

    // 6자리 랜덤 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 후 만료

    // DB에 저장
    await this.prisma.phoneVerification.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
        userId: userId || null,
      },
    });

    // TODO: SMS 발송 구현 (NCP SENS, Twilio 등)
    // 현재는 개발 모드로 콘솔에 출력
    console.log(`[SMS] ${phoneNumber}로 인증번호 발송: ${code}`);

    return {
      ok: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * 휴대폰 인증번호 확인
   * @param phoneNumber - 휴대폰 번호
   * @param code - 6자리 인증번호
   * @param userId - Optional: 로그인된 사용자 ID
   */
  async verifyPhoneCode(phoneNumber: string, code: string, userId?: number) {
    const now = new Date();

    // 최근 유효한 인증번호 찾기
    const verification = await this.prisma.phoneVerification.findFirst({
      where: {
        phoneNumber,
        expiresAt: { gt: now },
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return {
        ok: false,
        code: 'INVALID_OR_EXPIRED',
        message: '유효하지 않거나 만료된 인증번호입니다.',
      };
    }

    // 시도 횟수 체크 (최대 5회)
    if (verification.attempts >= 5) {
      return {
        ok: false,
        code: 'TOO_MANY_ATTEMPTS',
        message: '인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.',
      };
    }

    // 코드 확인
    if (verification.code !== code) {
      // 시도 횟수 증가
      await this.prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { attempts: verification.attempts + 1 },
      });

      return {
        ok: false,
        code: 'INVALID_CODE',
        message: '인증번호가 일치하지 않습니다.',
      };
    }

    // 인증 성공 처리
    await this.prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: now },
    });

    // 사용자 정보 업데이트 (로그인된 경우)
    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: now,
        },
      });
    }

    return {
      ok: true,
      verified: true,
      token: verification.id.toString(), // 나중에 참조용
    };
  }

  /**
   * 휴대폰 인증 상태 확인
   */
  async checkPhoneVerification(phoneNumber: string): Promise<boolean> {
    const verification = await this.prisma.phoneVerification.findFirst({
      where: {
        phoneNumber,
        verifiedAt: { not: null },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    return !!verification;
  }
}
