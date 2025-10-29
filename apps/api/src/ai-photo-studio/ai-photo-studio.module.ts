import { Module } from '@nestjs/common';
import { AiPhotoStudioService } from './ai-photo-studio.service';

@Module({
  providers: [AiPhotoStudioService],
  exports: [AiPhotoStudioService],
})
export class AiPhotoStudioModule {}
