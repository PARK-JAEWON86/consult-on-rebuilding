import { Module } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';
import { AuthModule } from '../auth/auth.module';
import { ExpertLevelsModule } from '../expert-levels/expert-levels.module';

@Module({
  imports: [AuthModule, ExpertLevelsModule],
  providers: [ExpertsService],
  controllers: [ExpertsController],
})
export class ExpertsModule {}
