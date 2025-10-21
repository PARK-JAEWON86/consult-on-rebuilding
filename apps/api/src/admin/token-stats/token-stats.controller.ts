import { Controller, Get, Param, ParseIntPipe, Delete, UseGuards } from '@nestjs/common';
import { TokenStatsService } from './token-stats.service';
import { JwtGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../guards/admin.guard';

/**
 * ✅ Phase 3: 관리자 토큰 통계 컨트롤러
 *
 * 엔드포인트:
 * - GET /admin/token-stats - 전체 통계
 * - GET /admin/token-stats/user/:userId - 사용자별 상세
 * - DELETE /admin/token-stats/cache - 캐시 초기화
 */
@Controller('admin/token-stats')
@UseGuards(JwtGuard, AdminGuard)
export class TokenStatsController {
  constructor(private readonly tokenStatsService: TokenStatsService) {}

  /**
   * 전체 토큰 사용 통계 조회
   */
  @Get()
  async getStatistics() {
    return this.tokenStatsService.getTokenUsageStatistics();
  }

  /**
   * 특정 사용자의 토큰 사용 상세 내역
   */
  @Get('user/:userId')
  async getUserDetails(@Param('userId', ParseIntPipe) userId: number) {
    return this.tokenStatsService.getUserTokenDetails(userId);
  }

  /**
   * 통계 캐시 수동 초기화
   */
  @Delete('cache')
  async clearCache() {
    await this.tokenStatsService.clearCache();
    return { message: '캐시가 초기화되었습니다.' };
  }
}
