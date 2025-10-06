import { Module } from '@nestjs/common'
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
export class AuthModule {}
