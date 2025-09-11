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
}
