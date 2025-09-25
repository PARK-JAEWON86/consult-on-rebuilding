import { Module } from '@nestjs/common';
import { ExpertStatsController } from './expert-stats.controller';
import { ExpertStatsService } from './expert-stats.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';

@Module({
  imports: [PrismaModule, ExpertLevelsModule],
  controllers: [ExpertStatsController],
  providers: [ExpertStatsService],
  exports: [ExpertStatsService],
})
export class ExpertStatsModule {}