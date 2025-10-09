import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { AuthService } from './auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile

      // 프로필 데이터 검증
      if (!id || !emails || !emails[0]?.value) {
        console.error('Google OAuth: Invalid profile data', { id, emails })
        return done(new Error('Invalid Google profile data'), false)
      }

      const user = {
        providerId: id,
        provider: 'google',
        email: emails[0].value,
        name: `${name.givenName || ''} ${name.familyName || ''}`.trim() || emails[0].value.split('@')[0],
        avatarUrl: photos?.[0]?.value,
      }

      const result = await this.authService.validateOAuthUser(user)
      done(null, result)
    } catch (error) {
      console.error('Google OAuth validation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'OAuth validation failed'
      done(new Error(errorMessage), false)
    }
  }
}
