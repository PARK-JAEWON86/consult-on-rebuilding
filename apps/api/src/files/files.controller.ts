import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { FilesService } from './files.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const GetUploadUrlSchema = z.object({
  fileName: z.string().min(1, '파일명은 필수입니다'),
  fileType: z.string().min(1, '파일 타입은 필수입니다'),
  fileSize: z.number().min(1, '파일 크기는 1바이트 이상이어야 합니다').max(5 * 1024 * 1024, '파일 크기는 5MB 이하여야 합니다'),
});

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtGuard)
  async getUploadUrl(
    @Body(new ZodValidationPipe(GetUploadUrlSchema)) dto: z.infer<typeof GetUploadUrlSchema>,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const result = await this.filesService.getUploadUrl(userId, dto);
    
    return { 
      success: true, 
      data: result
    };
  }
}
