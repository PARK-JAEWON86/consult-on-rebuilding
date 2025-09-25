import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Query
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  // 전문가 정산 전체 데이터 조회
  @Get('experts/:expertId')
  async getExpertSettlements(@Param('expertId', ParseIntPipe) expertId: number) {
    // 전문가 존재 여부 확인
    const expertExists = await this.settlementsService.checkExpertExists(expertId);
    if (!expertExists) {
      throw new NotFoundException(`전문가(ID: ${expertId})를 찾을 수 없습니다.`);
    }

    const data = await this.settlementsService.getExpertSettlements(expertId);
    return {
      success: true,
      data
    };
  }

  // 전문가 정산 요약 조회
  @Get('experts/:expertId/summary')
  async getExpertSettlementSummary(@Param('expertId', ParseIntPipe) expertId: number) {
    const expertExists = await this.settlementsService.checkExpertExists(expertId);
    if (!expertExists) {
      throw new NotFoundException(`전문가(ID: ${expertId})를 찾을 수 없습니다.`);
    }

    const data = await this.settlementsService.getSettlementSummary(expertId);
    return {
      success: true,
      data
    };
  }

  // 전문가 상담 내역 조회
  @Get('experts/:expertId/consultations')
  async getExpertConsultations(@Param('expertId', ParseIntPipe) expertId: number) {
    const expertExists = await this.settlementsService.checkExpertExists(expertId);
    if (!expertExists) {
      throw new NotFoundException(`전문가(ID: ${expertId})를 찾을 수 없습니다.`);
    }

    const data = await this.settlementsService.getExpertConsultations(expertId);
    return {
      success: true,
      data
    };
  }

  // 전문가 월별 통계 조회
  @Get('experts/:expertId/monthly-stats')
  async getExpertMonthlyStats(
    @Param('expertId', ParseIntPipe) expertId: number,
    @Query('year', ParseIntPipe) year?: number
  ) {
    const expertExists = await this.settlementsService.checkExpertExists(expertId);
    if (!expertExists) {
      throw new NotFoundException(`전문가(ID: ${expertId})를 찾을 수 없습니다.`);
    }

    const targetYear = year || new Date().getFullYear();
    const data = await this.settlementsService.getMonthlyStats(expertId, targetYear);
    return {
      success: true,
      data
    };
  }
}