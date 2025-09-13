import { Controller, Get, Query, Param, NotFoundException, Post, Body, UseGuards, Request } from '@nestjs/common';
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
    const size = Math.min(50, Math.max(1, parseInt(q.size ?? '10', 10)));
    
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
