import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { AiPhotoStudioModule } from '../ai-photo-studio/ai-photo-studio.module';

@Module({
  imports: [AuthModule, CreditsModule, AiPhotoStudioModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
