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
      data: { email, passwordHash, name },
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

    const verifyUrlBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${verifyUrlBase}/verify-email?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2>Consult On 이메일 인증</h2>
        <p>아래 버튼을 눌러 이메일 인증을 완료해 주세요. 유효시간은 1시간입니다.</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px">이메일 인증하기</a></p>
        <p>또는 다음 링크를 복사해 브라우저에 붙여넣기:<br>${link}</p>
        <p style="color:#6b7280;font-size:12px">본 메일은 발신전용입니다.</p>
      </div>
    `;

    await this.mail.sendMail(email, 'Consult On 이메일 인증', html);

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
      where: { id: userId }
    })

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_USER_NOT_FOUND', message: 'User not found' }
      })
    }

    return { id: user.id, email: user.email, name: user.name }
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
}
