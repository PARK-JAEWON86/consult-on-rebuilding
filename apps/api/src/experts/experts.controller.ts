import { Controller, Get, Query, Param, NotFoundException, Post, Body, UseGuards, Request, Put } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateExpertApplicationDto, CreateExpertApplicationSchema } from './dto/expert-application.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('experts')
export class ExpertsController {
  constructor(private readonly svc: ExpertsService) {}

  @Get()
  async list(@Query() q: any) {
    const page = Math.max(1, parseInt(q.page ?? '1', 10));
    const size = Math.min(50, Math.max(1, parseInt(q.size ?? '20', 10)));

    const { items, total } = await this.svc.list({
      page,
      size,
      q: q.q?.toString(),
      category: q.category?.toString(),
      sort: q.sort?.toString(),
    });

    return {
      success: true,
      data: { items, page, size, total }
    };
  }

  @Get('categories/popular')
  async popularCategories(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(20, Math.max(1, parseInt(limit, 10))) : 10;
    const categories = await this.svc.getPopularCategories(limitNum);

    return {
      success: true,
      data: categories
    };
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  async stats(@Request() req: any) {
    const userId = req.user.id;
    const data = await this.svc.getExpertStats(userId);

    return { success: true, data };
  }

  @Get('schedule/today')
  @UseGuards(JwtGuard)
  async todaySchedule(@Request() req: any) {
    const userId = req.user.id;
    const data = await this.svc.getTodaySchedule(userId);

    return { success: true, data };
  }

  @Get('revenue/monthly')
  @UseGuards(JwtGuard)
  async monthlyRevenue(@Request() req: any) {
    const userId = req.user.id;
    const data = await this.svc.getMonthlyRevenue(userId);

    return { success: true, data };
  }

  @Get(':displayId/profile')
  async getProfile(@Param('displayId') displayId: string) {
    const data = await this.svc.getExpertProfile(displayId);

    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_EXPERT_PROFILE_NOT_FOUND',
          message: 'Expert profile not found'
        }
      });
    }

    return { success: true, data };
  }

  @Get(':displayId')
  async detail(@Param('displayId') displayId: string) {
    const data = await this.svc.findByDisplayId(displayId);

    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_EXPERT_NOT_FOUND',
          message: 'Expert not found'
        }
      });
    }

    return { success: true, data };
  }

  @Put(':displayId/profile')
  @UseGuards(JwtGuard)
  async updateProfile(
    @Param('displayId') displayId: string,
    @Body() profileData: any,
    @Request() req: any
  ) {
    const userId = req.user.id;

    // 권한 검증: 본인의 프로필만 수정 가능
    const expert = await this.svc.findByDisplayId(displayId);
    if (!expert || (expert as any).userId !== userId) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_UNAUTHORIZED',
          message: 'You can only update your own profile'
        }
      });
    }

    const data = await this.svc.updateExpertProfile(displayId, profileData);

    return {
      success: true,
      data,
      message: '프로필이 성공적으로 업데이트되었습니다.'
    };
  }

  @Post('apply')
  @UseGuards(JwtGuard)
  async apply(
    @Body(new ZodValidationPipe(CreateExpertApplicationSchema)) dto: CreateExpertApplicationDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const data = await this.svc.createApplication(userId, dto);

    return {
      success: true,
      data: {
        id: data.id,
        displayId: data.displayId,
        status: data.status,
        message: '전문가 신청이 접수되었습니다. 검수 후 결과를 이메일로 안내드립니다.'
      }
    };
  }
}
