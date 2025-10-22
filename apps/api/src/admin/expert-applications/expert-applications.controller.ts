import { Controller, Get, Put, Query, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtGuard as JwtAuthGuard } from '../../auth/jwt.guard'
import { AdminGuard } from '../guards/admin.guard'
import { AdminRoleGuard, AdminPermission } from '../guards/admin-role.guard'
import { RequirePermission } from '../decorators/admin-permission.decorator'
import { ExpertApplicationsService, ApplicationListQuery, ReviewApplicationDto } from './expert-applications.service'

@Controller('admin/applications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ExpertApplicationsController {
  constructor(
    private readonly service: ExpertApplicationsService
  ) {}

  @Get()
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async getApplications(@Query() query: ApplicationListQuery) {
    return this.service.getApplications(query)
  }

  @Get('statistics')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getStatistics() {
    return this.service.getStatistics()
  }

  @Get(':id')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async getApplicationDetail(@Param('id') id: string) {
    return this.service.getApplicationDetail(parseInt(id))
  }

  @Put(':id/approve')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async approveApplication(
    @Param('id') id: string,
    @Body() body: { reviewNotes?: string },
    @Req() req: any
  ) {
    const dto: ReviewApplicationDto = {
      status: 'APPROVED',
      reviewNotes: body.reviewNotes,
      reviewedBy: req.user.id,
    }
    return this.service.approveApplication(parseInt(id), dto)
  }

  @Put(':id/reject')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async rejectApplication(
    @Param('id') id: string,
    @Body() body: { reviewNotes: string },
    @Req() req: any
  ) {
    const dto: ReviewApplicationDto = {
      status: 'REJECTED',
      reviewNotes: body.reviewNotes,
      reviewedBy: req.user.id,
    }
    return this.service.rejectApplication(parseInt(id), dto)
  }

  @Put(':id/request-info')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async requestAdditionalInfo(
    @Param('id') id: string,
    @Body() body: { reviewNotes: string },
    @Req() req: any
  ) {
    return this.service.requestAdditionalInfo(parseInt(id), {
      reviewNotes: body.reviewNotes,
      reviewedBy: req.user.id,
    })
  }

  @Put(':id/stage')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_APPLICATIONS)
  async updateApplicationStage(
    @Param('id') id: string,
    @Body() body: { stage: string },
    @Req() req: any
  ) {
    return this.service.updateApplicationStage(
      parseInt(id),
      body.stage,
      req.user.id
    )
  }
}
