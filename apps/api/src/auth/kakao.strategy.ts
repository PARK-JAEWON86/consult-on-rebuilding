import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-kakao'
import { AuthService } from './auth.service'

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      callbackURL: process.env.KAKAO_CALLBACK_URL!,
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const { id, username, _json } = profile

      // 프로필 데이터 검증
      if (!id) {
        console.error('Kakao OAuth: Invalid profile data', { id })
        return done(new Error('Invalid Kakao profile data'), false)
      }

      const user = {
        providerId: id,
        provider: 'kakao',
        email: _json.kakao_account?.email || `kakao_${id}@kakao.user`,
        name: _json.kakao_account?.profile?.nickname || username || 'Kakao User',
        avatarUrl: _json.kakao_account?.profile?.profile_image_url,
      }

      const result = await this.authService.validateOAuthUser(user)
      done(null, result)
    } catch (error) {
      console.error('Kakao OAuth validation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'OAuth validation failed'
      done(new Error(errorMessage), false)
    }
  }
}
