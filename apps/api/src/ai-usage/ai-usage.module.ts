import { Module } from '@nestjs/common';
import { AIUsageController } from './ai-usage.controller';
import { AIUsageService } from './ai-usage.service';
import { TokenNotificationScheduler } from './token-notification.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CreditsModule, AuthModule],
  controllers: [AIUsageController],
  providers: [AIUsageService, TokenNotificationScheduler],
  exports: [AIUsageService],
})
export class AIUsageModule {}