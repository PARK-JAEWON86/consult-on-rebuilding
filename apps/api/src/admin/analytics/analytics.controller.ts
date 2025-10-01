import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../auth/jwt.guard'
import { AdminGuard } from '../guards/admin.guard'
import { AdminRoleGuard, AdminPermission } from '../guards/admin-role.guard'
import { RequirePermission } from '../decorators/admin-permission.decorator'
import { AnalyticsService } from './analytics.service'

@Controller('admin/analytics')
@UseGuards(JwtGuard, AdminGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getDashboardSummary(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.service.getDashboardSummary(period || 'day')
  }

  @Get('dashboard-enhanced')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getEnhancedDashboard(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.service.getEnhancedDashboard(period || 'day')
  }

  @Get('metrics')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getDailyMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return this.service.getDailyMetrics(start, end)
  }

  @Get('expert-funnel')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getExpertFunnel() {
    return this.service.getExpertFunnel()
  }
}
