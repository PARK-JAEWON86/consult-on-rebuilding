import { Module } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';
import { ExpertStatsService } from './expert-stats.service';
import { AuthModule } from '../auth/auth.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, ExpertLevelsModule],
  providers: [ExpertsService, ExpertStatsService],
  controllers: [ExpertsController],
  exports: [ExpertsService, ExpertStatsService],
})
export class ExpertsModule {}
