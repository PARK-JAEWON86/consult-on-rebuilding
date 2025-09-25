import { Module } from '@nestjs/common';
import { AIUsageController } from './ai-usage.controller';
import { AIUsageService } from './ai-usage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [PrismaModule, CreditsModule],
  controllers: [AIUsageController],
  providers: [AIUsageService],
  exports: [AIUsageService],
})
export class AIUsageModule {}