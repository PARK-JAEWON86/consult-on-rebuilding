import { Module, OnModuleInit } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { PrismaModule } from '../prisma/prisma.module'
import { RedisModule } from '../redis/redis.module'
import { MailModule } from '../mail/mail.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { GoogleStrategy } from './google.strategy'
import { KakaoStrategy } from './kakao.strategy'

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    MailModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  providers: [AuthService, GoogleStrategy, KakaoStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    // Google OAuth 환경변수 검증
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      console.error('⚠️  Google OAuth configuration missing:')
      if (!googleClientId) console.error('  - GOOGLE_CLIENT_ID')
      if (!googleClientSecret) console.error('  - GOOGLE_CLIENT_SECRET')
      if (!googleCallbackUrl) console.error('  - GOOGLE_CALLBACK_URL')
      throw new Error('Google OAuth configuration is incomplete. Please check environment variables.')
    }

    // Kakao OAuth 환경변수 검증
    const kakaoClientId = process.env.KAKAO_CLIENT_ID
    const kakaoCallbackUrl = process.env.KAKAO_CALLBACK_URL

    if (!kakaoClientId || !kakaoCallbackUrl) {
      console.error('⚠️  Kakao OAuth configuration missing:')
      if (!kakaoClientId) console.error('  - KAKAO_CLIENT_ID')
      if (!kakaoCallbackUrl) console.error('  - KAKAO_CALLBACK_URL')
      throw new Error('Kakao OAuth configuration is incomplete. Please check environment variables.')
    }

    // JWT 환경변수 검증
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

    if (!jwtAccessSecret || !jwtRefreshSecret) {
      console.error('⚠️  JWT configuration missing:')
      if (!jwtAccessSecret) console.error('  - JWT_ACCESS_SECRET')
      if (!jwtRefreshSecret) console.error('  - JWT_REFRESH_SECRET')
      throw new Error('JWT configuration is incomplete. Please check environment variables.')
    }

    console.log('✅ OAuth configuration validated successfully')
  }
}
