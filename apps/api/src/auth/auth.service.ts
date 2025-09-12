import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import * as argon2 from 'argon2'
import { signAccess, signRefresh } from './jwt.util'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService
  ) {}

  async register(dto: { email: string; password: string; name?: string }) {
    const exists = await this.prisma.user.findUnique({ 
      where: { email: dto.email } 
    })
    
    if (exists) {
      throw new ConflictException({
        success: false,
        error: { code: 'E_AUTH_DUP', message: 'Email already registered' }
      })
    }

    const hash = await argon2.hash(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name ?? null,
        passwordHash: hash
      } as any
    })

    return { id: user.id, email: user.email, name: user.name }
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
