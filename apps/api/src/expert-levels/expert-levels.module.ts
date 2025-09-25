import { Module } from '@nestjs/common';
import { ExpertLevelsController } from './expert-levels.controller';
import { ExpertLevelsService } from './expert-levels.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertLevelsController],
  providers: [ExpertLevelsService],
  exports: [ExpertLevelsService],
})
export class ExpertLevelsModule {}