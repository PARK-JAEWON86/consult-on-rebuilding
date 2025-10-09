import { Controller, Post, Body, Res, Req, Get, UseGuards, Query, UsePipes } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { registerDto, loginDto, verifyEmailDto, resendDto } from './dto/auth.dto'
import type { LoginDto } from './dto/auth.dto'
import { sendPhoneVerificationDto, verifyPhoneCodeDto } from './dto/phone-verification.dto'
import type { SendPhoneVerificationDto, VerifyPhoneCodeDto } from './dto/phone-verification.dto'
import { JwtGuard } from './jwt.guard'
import { GoogleGuard } from './google.guard'
import { KakaoGuard } from './kakao.guard'
import { User } from './user.decorator'
import { fail, ok } from '../common/http'
import * as argon2 from 'argon2'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOpts(maxAgeSec: number) {
    const isProduction = process.env.NODE_ENV === 'production'
    return {
      httpOnly: true,
      secure: isProduction, // 프로덕션에서는 true, 개발에서는 false
      sameSite: 'lax' as const, // CSRF 보호를 위해 'lax' 사용 (OAuth 콜백과 호환)
      path: '/',
      maxAge: maxAgeSec * 1000,
    }
  }

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerDto))
  async register(@Body() body: any) {
    const { email, password, name } = body;
    const passwordHash = await argon2.hash(password, { memoryCost: 2 ** 12 });
    // email unique 충돌 처리
    try {
      const r = await this.auth.register({ email, passwordHash, name });
      return ok({ userId: r.userId });
    } catch (e: any) {
      if (e?.code === 'P2002') return fail('CONFLICT', '이미 사용 중인 이메일입니다.');
      return fail('INTERNAL', '회원가입 처리 중 오류가 발생했습니다.');
    }
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginDto)) dto: LoginDto,
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
    try {
      const user = req.user
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

      // OAuth 실패 시 처리
      if (!user) {
        console.error('Google OAuth callback: No user data received')
        return res.redirect(`${frontendUrl}/auth/login?error=oauth-failed`)
      }

      // 신규 사용자 또는 온보딩 미완료 사용자
      if (user.isNewUser || !user.onboardingCompleted) {
        // 임시 토큰 생성
        const tempToken = await this.auth.generateOAuthTempToken({
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'google',
          isNewUser: user.isNewUser,
        })

        // 온보딩 페이지로 리다이렉트
        res.redirect(`${frontendUrl}/auth/onboarding?token=${tempToken}`)
        return
      }

      // 기존 사용자 - 바로 로그인
      const secrets = {
        access: process.env.JWT_ACCESS_SECRET!,
        refresh: process.env.JWT_REFRESH_SECRET!,
      }
      const ttls = {
        access: Number(process.env.JWT_ACCESS_TTL_SEC),
        refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
      }

      const access = this.auth.signAccess(user, secrets.access, ttls.access)
      const refresh = this.auth.signRefresh(user, secrets.refresh, ttls.refresh)

      // Store refresh token jti in Redis whitelist
      const refreshPayload = JSON.parse(Buffer.from(refresh.split('.')[1], 'base64').toString())
      await this.auth.storeRefreshToken(refreshPayload.jti, user.id, ttls.refresh)

      res.cookie('access_token', access, this.cookieOpts(ttls.access))
      res.cookie('refresh_token', refresh, this.cookieOpts(ttls.refresh))

      // 홈으로 리다이렉트
      res.redirect(`${frontendUrl}?auth=success`)
    } catch (error) {
      console.error('Google OAuth callback error:', error)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      res.redirect(`${frontendUrl}/auth/login?error=google-login-failed`)
    }
  }

  @Get('kakao')
  @UseGuards(KakaoGuard)
  async kakaoAuth() {
    // Passport가 자동으로 Kakao OAuth 페이지로 리다이렉트
  }

  @Get('kakao/callback')
  @UseGuards(KakaoGuard)
  async kakaoCallback(
    @Req() req: Request & { user: any },
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const user = req.user
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

      // OAuth 실패 시 처리
      if (!user) {
        console.error('Kakao OAuth callback: No user data received')
        return res.redirect(`${frontendUrl}/auth/login?error=oauth-failed`)
      }

      // 신규 사용자 또는 온보딩 미완료 사용자
      if (user.isNewUser || !user.onboardingCompleted) {
        // 임시 토큰 생성
        const tempToken = await this.auth.generateOAuthTempToken({
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'kakao',
          isNewUser: user.isNewUser,
        })

        // 온보딩 페이지로 리다이렉트
        res.redirect(`${frontendUrl}/auth/onboarding?token=${tempToken}`)
        return
      }

      // 기존 사용자 - 바로 로그인
      const secrets = {
        access: process.env.JWT_ACCESS_SECRET!,
        refresh: process.env.JWT_REFRESH_SECRET!,
      }
      const ttls = {
        access: Number(process.env.JWT_ACCESS_TTL_SEC),
        refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
      }

      const access = this.auth.signAccess(user, secrets.access, ttls.access)
      const refresh = this.auth.signRefresh(user, secrets.refresh, ttls.refresh)

      // Store refresh token jti in Redis whitelist
      const refreshPayload = JSON.parse(Buffer.from(refresh.split('.')[1], 'base64').toString())
      await this.auth.storeRefreshToken(refreshPayload.jti, user.id, ttls.refresh)

      res.cookie('access_token', access, this.cookieOpts(ttls.access))
      res.cookie('refresh_token', refresh, this.cookieOpts(ttls.refresh))

      // 홈으로 리다이렉트
      res.redirect(`${frontendUrl}?auth=success`)
    } catch (error) {
      console.error('Kakao OAuth callback error:', error)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      res.redirect(`${frontendUrl}/auth/login?error=kakao-login-failed`)
    }
  }

  @Post('verify-email')
  @UsePipes(new ZodValidationPipe(verifyEmailDto))
  async verifyEmail(@Body() body: any) {
    const { token } = body;
    const r = await this.auth.verifyEmailByToken(token);
    if (!r.ok) return fail(r.code!, r.message!);
    return ok({ verified: true });
  }

  @Post('resend-verification')
  @UsePipes(new ZodValidationPipe(resendDto))
  async resend(@Body() body: any) {
    const { email } = body;
    const r = await this.auth.resendVerification(email);
    if (!r.ok) return fail(r.code!, r.message!);
    return ok({ sent: true });
  }

  // ==================== Phone Verification ====================

  @Post('send-phone-verification')
  @UsePipes(new ZodValidationPipe(sendPhoneVerificationDto))
  async sendPhoneVerification(
    @Body() dto: SendPhoneVerificationDto,
    @Req() req: Request & { user?: any }
  ) {
    const userId = req.user?.id; // Optional: 로그인된 사용자
    const result = await this.auth.sendPhoneVerification(dto.phoneNumber, userId);

    if (!result.ok) {
      return fail(result.code!, result.message!);
    }

    return ok({
      sent: true,
      expiresAt: result.expiresAt
    });
  }

  @Post('verify-phone-code')
  @UsePipes(new ZodValidationPipe(verifyPhoneCodeDto))
  async verifyPhoneCode(
    @Body() dto: VerifyPhoneCodeDto,
    @Req() req: Request & { user?: any }
  ) {
    const userId = req.user?.id; // Optional: 로그인된 사용자
    const result = await this.auth.verifyPhoneCode(dto.phoneNumber, dto.code, userId);

    if (!result.ok) {
      return fail(result.code!, result.message!);
    }

    return ok({
      verified: true,
      token: result.token
    });
  }

  @Get('check-phone-verification')
  async checkPhoneVerification(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber || !/^01[0-9]{8,9}$/.test(phoneNumber)) {
      return fail('INVALID_PHONE', '올바른 휴대폰 번호를 입력해주세요');
    }

    const verified = await this.auth.checkPhoneVerification(phoneNumber);
    return ok({ verified });
  }

  // ==================== OAuth Onboarding ====================

  @Get('verify-temp-token')
  async verifyTempToken(@Query('token') token: string) {
    if (!token) {
      return fail('INVALID_TOKEN', '토큰이 제공되지 않았습니다.');
    }

    const result = await this.auth.verifyOAuthTempToken(token);
    if (!result.valid) {
      return fail('INVALID_TOKEN', result.error || '유효하지 않은 토큰입니다.');
    }

    return ok({ user: result.user });
  }

  @Post('complete-onboarding')
  async completeOnboarding(
    @Body() body: { tempToken: string; agreedToTerms: boolean },
    @Res({ passthrough: true }) res: Response
  ) {
    const { tempToken, agreedToTerms } = body;

    if (!tempToken) {
      return fail('INVALID_TOKEN', '토큰이 제공되지 않았습니다.');
    }

    if (!agreedToTerms) {
      return fail('TERMS_NOT_AGREED', '약관에 동의해야 합니다.');
    }

    try {
      const user = await this.auth.completeOAuthOnboarding(tempToken, agreedToTerms);

      // 정식 JWT 토큰 발급
      const secrets = {
        access: process.env.JWT_ACCESS_SECRET!,
        refresh: process.env.JWT_REFRESH_SECRET!,
      };
      const ttls = {
        access: Number(process.env.JWT_ACCESS_TTL_SEC),
        refresh: Number(process.env.JWT_REFRESH_TTL_SEC),
      };

      const access = this.auth.signAccess(user, secrets.access, ttls.access);
      const refresh = this.auth.signRefresh(user, secrets.refresh, ttls.refresh);

      // Store refresh token jti in Redis whitelist
      const refreshPayload = JSON.parse(Buffer.from(refresh.split('.')[1], 'base64').toString());
      await this.auth.storeRefreshToken(refreshPayload.jti, user.id, ttls.refresh);

      res.cookie('access_token', access, this.cookieOpts(ttls.access));
      res.cookie('refresh_token', refresh, this.cookieOpts(ttls.refresh));

      return ok({ user, accessToken: access });
    } catch (error: any) {
      return fail(error.response?.error?.code || 'INTERNAL', error.response?.error?.message || '온보딩 완료 중 오류가 발생했습니다.');
    }
  }
}
