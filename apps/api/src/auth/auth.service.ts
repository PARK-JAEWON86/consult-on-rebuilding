import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { MailService } from '../mail/mail.service'
import * as argon2 from 'argon2'
import { signAccess, signRefresh } from './jwt.util'
import { randomUrlToken, sha256Hex } from '../common/crypto.util'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly mail: MailService
  ) {}

  private expireMinutes() { 
    return Number(process.env.AUTH_CODE_EXPIRE_MIN || 60); 
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
    // 기존 미소모 레코드 무효화까지는 하지 않고 새 토큰 발급 (최신 것만 유효로 볼지 정책 선택)
    const token = randomUrlToken(24);
    const codeHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + this.expireMinutes() * 60 * 1000);

    const ev = await this.prisma.emailVerification.create({
      data: { userId, codeHash, expiresAt },
    });

    // 사용자 정보 가져오기
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    // 새로운 이메일 인증 메서드 사용
    await this.mail.sendVerificationEmail(email, token, user?.name || undefined);

    return { id: ev.id };
  }

  async verifyEmailByToken(token: string) {
    const codeHash = sha256Hex(token);
    const now = new Date();

    const ev = await this.prisma.emailVerification.findFirst({
      where: { codeHash, consumedAt: null, expiresAt: { gt: now } },
      include: { user: true },
    });
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

    // 전문가 지원 상태 확인
    const expertApplication = await this.prisma.expertApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_USER_NOT_FOUND', message: 'User not found' }
      })
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

    const result: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt,
      expertApplicationStatus: expertApplication?.status || null,
      expertApplicationId: expertApplication?.id || null
    }

    // Expert 정보가 있는 경우 추가
    if (user.expert) {
      result.expert = user.expert
    }

    // ExpertApplication 상세 정보 추가 (PENDING 상태인 경우)
    if (expertApplication && expertApplication.status === 'PENDING') {
      // JSON 필드 파싱 헬퍼
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

      result.expertApplicationData = {
        id: expertApplication.id,
        category: expertApplication.specialty.split(' - ')[0] || expertApplication.specialty,
        specialty: expertApplication.specialty,
        submittedAt: expertApplication.createdAt,
        currentStage: expertApplication.currentStage || 'SUBMITTED',
        bio: expertApplication.bio,
        keywords: parseJsonField(expertApplication.keywords),
        consultationTypes: parseJsonField(expertApplication.consultationTypes)
      }
    }

    return result
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
      return { id: user.id, email: user.email, name: user.name }
    }

    // 이메일로 기존 계정 확인 (로컬 계정이 있는 경우)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    })

    if (existingUser && existingUser.provider === 'local') {
      throw new ConflictException({
        success: false,
        error: { 
          code: 'E_AUTH_EMAIL_EXISTS', 
          message: 'Email already registered with local account. Please login with email/password.' 
        }
      })
    }

    // 새 OAuth 사용자 생성
    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        provider: profile.provider,
        providerId: profile.providerId,
        avatarUrl: profile.avatarUrl,
        passwordHash: null, // OAuth 사용자는 비밀번호 없음
      } as any,
    })

    return { id: user.id, email: user.email, name: user.name }
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
