import { Module } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';

@Module({
  providers: [ExpertsService],
  controllers: [ExpertsController],
})
export class ExpertsModule {}
