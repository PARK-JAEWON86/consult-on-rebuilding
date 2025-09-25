import { Controller, Get, Query } from '@nestjs/common';
import { ExpertStatsService } from './expert-stats.service';

@Controller('expert-stats')
export class ExpertStatsController {
  constructor(private readonly expertStatsService: ExpertStatsService) {}

  @Get()
  async getExpertStats(
    @Query('expertId') expertId?: string,
    @Query('rankingType') rankingType?: string,
    @Query('specialty') specialty?: string
  ) {
    const numericExpertId = expertId ? parseInt(expertId) : undefined;

    if (rankingType) {
      return await this.expertStatsService.getRankings(rankingType, specialty);
    }

    return await this.expertStatsService.getExpertStats(numericExpertId);
  }

  @Get('levels')
  async getExpertLevels() {
    return await this.expertStatsService.getExpertLevels();
  }

  @Get('rankings')
  async getRankings(
    @Query('type') rankingType: string = 'overall',
    @Query('specialty') specialty?: string
  ) {
    return await this.expertStatsService.getRankings(rankingType, specialty);
  }
}