import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpException,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateMatchingProfileDto } from './dto/update-matching-profile.dto';
import { JwtGuard } from '../auth/jwt.guard';
// Multer types are available globally via src/types/multer.d.ts

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list() {
    try {
      const data = await this.users.findAll();
      return { success: true, data };
    } catch (e) {
      throw new HttpException(
        { success: false, error: { code: 'E_DB_QUERY', message: 'Failed to fetch users' } },
        500,
      );
    }
  }

  // 매칭 프로필 조회
  @Get('matching-profile')
  @UseGuards(JwtGuard)
  async getMatchingProfile(@Req() req: any) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          { success: false, error: { code: 'E_UNAUTHORIZED', message: 'User not authenticated' } },
          401,
        );
      }

      const data = await this.users.getMatchingProfile(userId);
      return { success: true, data };
    } catch (e) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'E_DB_QUERY',
            message: e instanceof Error ? e.message : 'Failed to fetch matching profile'
          }
        },
        500,
      );
    }
  }

  // 매칭 프로필 업데이트
  @Put('matching-profile')
  @UseGuards(JwtGuard)
  async updateMatchingProfile(@Req() req: any, @Body() dto: UpdateMatchingProfileDto) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          { success: false, error: { code: 'E_UNAUTHORIZED', message: 'User not authenticated' } },
          401,
        );
      }

      const data = await this.users.updateMatchingProfile(userId, dto);
      return { success: true, data, message: '매칭 프로필이 업데이트되었습니다' };
    } catch (e) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'E_DB_UPDATE',
            message: e instanceof Error ? e.message : 'Failed to update matching profile'
          }
        },
        500,
      );
    }
  }

  // 프로필 완성 보상 지급
  @Post('claim-profile-reward')
  @UseGuards(JwtGuard)
  async claimProfileReward(@Req() req: any) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          { success: false, error: { code: 'E_UNAUTHORIZED', message: 'User not authenticated' } },
          401,
        );
      }

      const result = await this.users.claimProfileReward(userId);
      return { success: true, ...result };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to claim profile reward';
      const status = message.includes('이미 지급') || message.includes('완성되지') ? 400 : 500;

      throw new HttpException(
        {
          success: false,
          error: {
            code: status === 400 ? 'E_VALIDATION' : 'E_DB_UPDATE',
            message
          }
        },
        status,
      );
    }
  }

  // 프로필 사진 업로드 (AI 변환 옵션 포함)
  @Post('profile-photo')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfilePhoto(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('useAiTransform') useAiTransform?: string,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          { success: false, error: { code: 'E_UNAUTHORIZED', message: 'User not authenticated' } },
          401,
        );
      }

      // 문자열로 전달된 boolean 값 파싱
      const shouldTransform = useAiTransform === 'true';

      const data = await this.users.uploadProfilePhoto(userId, file, shouldTransform);
      return {
        success: true,
        data,
        message: shouldTransform
          ? 'AI 변환된 프로필 사진이 업로드되었습니다'
          : '프로필 사진이 업로드되었습니다',
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to upload profile photo';
      const status = message.includes('service') || message.includes('configured') ? 503 : 500;

      throw new HttpException(
        {
          success: false,
          error: {
            code: status === 503 ? 'E_SERVICE_ERROR' : 'E_UPLOAD_ERROR',
            message,
          },
        },
        status,
      );
    }
  }
}
