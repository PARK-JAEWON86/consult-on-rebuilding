import { Controller, Get, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common'
import { JwtGuard as JwtAuthGuard } from '../../auth/jwt.guard'
import { AdminGuard } from '../guards/admin.guard'
import { AdminRoleGuard, AdminPermission } from '../guards/admin-role.guard'
import { RequirePermission } from '../decorators/admin-permission.decorator'
import { ContentService, PostListQuery } from './content.service'

@Controller('admin/content')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('posts')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async getPosts(@Query() query: PostListQuery) {
    return this.service.getPosts(query)
  }

  @Get('posts/statistics')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.VIEW_ANALYTICS)
  async getContentStatistics() {
    return this.service.getContentStatistics()
  }

  @Get('posts/:id')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async getPostDetail(@Param('id') id: string) {
    return this.service.getPostDetail(parseInt(id))
  }

  @Put('posts/:id/status')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async updatePostStatus(
    @Param('id') id: string,
    @Body() body: { status: 'published' | 'hidden' | 'deleted' }
  ) {
    return this.service.updatePostStatus(parseInt(id), body.status)
  }

  @Delete('posts/:id')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async deletePost(@Param('id') id: string) {
    return this.service.deletePost(parseInt(id))
  }

  @Get('comments')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async getComments(@Query() query: { page?: number; limit?: number; status?: string }) {
    return this.service.getComments(query)
  }

  @Put('comments/:id/status')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async updateCommentStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'hidden' | 'deleted' }
  ) {
    return this.service.updateCommentStatus(parseInt(id), body.status)
  }

  @Delete('comments/:id')
  @UseGuards(AdminRoleGuard)
  @RequirePermission(AdminPermission.MANAGE_CONTENT)
  async deleteComment(@Param('id') id: string) {
    return this.service.deleteComment(parseInt(id))
  }
}
