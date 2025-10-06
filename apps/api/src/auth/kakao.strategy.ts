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
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, _json } = profile

    const user = {
      providerId: id,
      provider: 'kakao',
      email: _json.kakao_account?.email || `kakao_${id}@kakao.user`,
      name: _json.kakao_account?.profile?.nickname || username || 'Kakao User',
      avatarUrl: _json.kakao_account?.profile?.profile_image_url,
    }

    try {
      const result = await this.authService.validateOAuthUser(user)
      done(null, result)
    } catch (error) {
      done(error, false)
    }
  }
}
