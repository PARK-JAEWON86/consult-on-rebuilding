import { Controller, Get, Put, Query, Param, Body, UseGuards } from '@nestjs/common'
import { JwtGuard as JwtAuthGuard } from '../../auth/jwt.guard'
import { AdminGuard } from '../guards/admin.guard'
import { AdminRoleGuard, AdminPermission } from '../guards/admin-role.guard'
import { RequirePermission } from '../decorators/admin-permission.decorator'
import { UsersService, UserListQuery } from './users.service'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_USERS)
  async getUsers(@Query() query: UserListQuery) {
    return this.service.getUsers(query)
  }

  @Get('statistics')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getUserStatistics() {
    return this.service.getUserStatistics()
  }

  @Get(':id')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_USERS)
  async getUserDetail(@Param('id') id: string) {
    return this.service.getUserDetail(parseInt(id))
  }

  @Put(':id/roles')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_USERS)
  async updateUserRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] }
  ) {
    return this.service.updateUserRoles(parseInt(id), body.roles)
  }

  @Put('experts/:id/toggle-status')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_EXPERTS)
  async toggleExpertStatus(@Param('id') id: string) {
    return this.service.toggleExpertStatus(parseInt(id))
  }
}
