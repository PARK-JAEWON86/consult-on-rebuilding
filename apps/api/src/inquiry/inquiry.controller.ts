import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto, CreateReplyDto, QueryInquiryDto } from './dto';

@Controller('inquiries')
@UseGuards(JwtGuard)
export class InquiryController {
  constructor(private inquiryService: InquiryService) {}

  // ==========================================
  // 클라이언트용 엔드포인트
  // ==========================================

  @Post('client')
  async createInquiry(@Req() req: any, @Body() dto: CreateInquiryDto) {
    const result = await this.inquiryService.createInquiry(req.user.id, dto);
    return { success: true, data: result };
  }

  @Get('client')
  async getClientInquiries(@Req() req: any, @Query() query: QueryInquiryDto) {
    const result = await this.inquiryService.getClientInquiries(req.user.id, query);
    return { success: true, data: result };
  }

  @Get('client/:id')
  async getClientInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.getClientInquiry(req.user.id, id);
    return { success: true, data: result };
  }

  @Delete('client/:id')
  async deleteClientInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.deleteClientInquiry(req.user.id, id);
    return { success: true, ...result };
  }

  // ==========================================
  // 전문가용 엔드포인트
  // ==========================================

  @Get('expert')
  async getExpertInquiries(@Req() req: any, @Query() query: QueryInquiryDto) {
    const result = await this.inquiryService.getExpertInquiries(req.user.id, query);
    return { success: true, data: result };
  }

  @Get('expert/stats')
  async getExpertInquiryStats(@Req() req: any) {
    const result = await this.inquiryService.getExpertInquiryStats(req.user.id);
    return { success: true, data: result };
  }

  @Get('expert/:id')
  async getExpertInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.getExpertInquiry(req.user.id, id);
    return { success: true, data: result };
  }

  @Patch('expert/:id/read')
  async markInquiryAsRead(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.markAsRead(req.user.id, id);
    return { success: true, data: result };
  }

  @Post('expert/:id/reply')
  async replyToInquiry(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReplyDto
  ) {
    const result = await this.inquiryService.createReply(req.user.id, id, dto);
    return { success: true, data: result };
  }

  @Delete('expert/:id')
  async deleteExpertInquiry(@Req() req: any, @Param('id') id: string) {
    const result = await this.inquiryService.deleteExpertInquiry(req.user.id, id);
    return { success: true, ...result };
  }
}
