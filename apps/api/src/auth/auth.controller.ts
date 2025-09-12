import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { RegisterSchema, LoginSchema, RegisterDto, LoginDto } from './dto'
import { JwtGuard } from './jwt.guard'
import { GoogleGuard } from './google.guard'
import { User } from './user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOpts(maxAgeSec: number) {
    const isProduction = process.env.NODE_ENV === 'production'
    return {
      httpOnly: true,
      secure: isProduction, // 프로덕션에서는 true, 개발에서는 false
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 프로덕션에서는 none, 개발에서는 lax
      path: '/',
      maxAge: maxAgeSec * 1000,
    }
  }

  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    const user = await this.auth.register(dto)
    return { success: true, data: { user } }
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const secrets = {
      access: process.env.JWT_ACCESS_SECRET!,
      refresh: process.env.JWT_REFRESH_SECRET!,
    }
    const ttls = {
      access: Number(process.env.JWT_ACCESS_TTL_SEC),
      refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
    }

    const { user, access, refresh } = await this.auth.login(dto, secrets, ttls)

    res.cookie('access_token', access, this.cookieOpts(ttls.access))
    res.cookie('refresh_token', refresh, this.cookieOpts(ttls.refresh))

    return { success: true, data: { user, accessToken: access } }
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refresh_token
    
    if (!refreshToken) {
      return {
        success: false,
        error: { code: 'E_AUTH_NO_REFRESH', message: 'No refresh token' },
      }
    }

    const secrets = {
      access: process.env.JWT_ACCESS_SECRET!,
      refresh: process.env.JWT_REFRESH_SECRET!,
    }
    const ttls = {
      access: Number(process.env.JWT_ACCESS_TTL_SEC),
      refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
    }

    try {
      const newTokens = await this.auth.refreshTokens(refreshToken, secrets, ttls)

      res.cookie('access_token', newTokens.access, this.cookieOpts(ttls.access))
      res.cookie('refresh_token', newTokens.refresh, this.cookieOpts(ttls.refresh))

      return { success: true, data: { user: newTokens.user } }
    } catch (error) {
      return {
        success: false,
        error: { code: 'E_AUTH_INVALID_REFRESH', message: 'Invalid refresh token' },
      }
    }
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refresh_token
    if (refreshToken) {
      await this.auth.logout(refreshToken, process.env.JWT_REFRESH_SECRET!)
    }
    
    res.cookie('access_token', '', this.cookieOpts(0))
    res.cookie('refresh_token', '', this.cookieOpts(0))
    return { success: true, data: { ok: true } }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@User() user: { id: number; email: string }) {
    const userData = await this.auth.getUserById(user.id)
    return { success: true, data: { user: userData } }
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {
    // Passport가 자동으로 Google OAuth 페이지로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res({ passthrough: true }) res: Response
  ) {
    const secrets = {
      access: process.env.JWT_ACCESS_SECRET!,
      refresh: process.env.JWT_REFRESH_SECRET!,
    }
    const ttls = {
      access: Number(process.env.JWT_ACCESS_TTL_SEC),
      refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
    }

    // OAuth 사용자 정보로 JWT 토큰 생성
    const user = req.user
    const access = this.auth.signAccess(user, secrets.access, ttls.access)
    const refresh = this.auth.signRefresh(user, secrets.refresh, ttls.refresh)

    // Store refresh token jti in Redis whitelist
    const refreshPayload = JSON.parse(Buffer.from(refresh.split('.')[1], 'base64').toString())
    await this.auth.storeRefreshToken(refreshPayload.jti, user.id, ttls.refresh)

    res.cookie('access_token', access, this.cookieOpts(ttls.access))
    res.cookie('refresh_token', refresh, this.cookieOpts(ttls.refresh))

    // 프론트엔드로 리다이렉트 (성공)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}?auth=success`)
  }

  @Post('send-verification')
  async sendVerificationEmail(@Body() body: { email: string }) {
    // 개발 환경에서는 실제 이메일을 보내지 않고 콘솔에 출력
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log(`[이메일 인증] ${body.email}로 인증 코드를 전송했습니다: ${verificationCode}`)
    
    return {
      success: true,
      data: {
        email: body.email,
        verificationCode,
        message: '인증 이메일이 전송되었습니다.'
      }
    }
  }
}
