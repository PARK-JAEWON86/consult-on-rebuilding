import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { ExpertsService } from './experts.service';

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
}
