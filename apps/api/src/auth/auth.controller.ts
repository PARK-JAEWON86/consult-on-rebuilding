import { Controller, Post, Body, Res, Req } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { RegisterSchema, LoginSchema, RegisterDto, LoginDto } from './dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOpts(maxAgeSec: number) {
    return {
      httpOnly: true,
      secure: false, // 로컬 개발 환경
      sameSite: 'lax' as const,
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

    return { success: true, data: { user } }
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
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('access_token', '', this.cookieOpts(0))
    res.cookie('refresh_token', '', this.cookieOpts(0))
    return { success: true, data: { ok: true } }
  }
}
