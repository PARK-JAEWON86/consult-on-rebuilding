import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
