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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService, UpdateNotificationSettingsDto } from './notifications.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // 알림 목록 조회
  @Get()
  async getNotifications(
    @Req() req: Request & { user: any },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.userId;

    const result = await this.notificationsService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: result.notifications,
      meta: {
        total: result.total,
        unreadCount: result.unreadCount,
      },
    };
  }

  // 읽지 않은 알림 개수
  @Get('unread-count')
  async getUnreadCount(@Req() req: Request & { user: any }) {
    const userId = req.user.userId;
    const result = await this.notificationsService.getUserNotifications(userId, {
      unreadOnly: true,
      limit: 1,
    });

    return {
      success: true,
      data: {
        count: result.unreadCount,
      },
    };
  }

  // 알림 읽음 처리
  @Patch(':id/read')
  async markAsRead(@Req() req: Request & { user: any }, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.notificationsService.markAsRead(parseInt(id, 10), userId);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  // 모든 알림 읽음 처리
  @Post('mark-all-read')
  async markAllAsRead(@Req() req: Request & { user: any }) {
    const userId = req.user.userId;
    await this.notificationsService.markAllAsRead(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  // 알림 삭제
  @Delete(':id')
  async deleteNotification(@Req() req: Request & { user: any }, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.notificationsService.deleteNotification(parseInt(id, 10), userId);

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  // 알림 설정 조회
  @Get('settings')
  async getSettings(@Req() req: Request & { user: any }) {
    const userId = req.user?.userId;

    if (!userId) {
      return {
        success: false,
        error: {
          code: 'E_USER_NOT_AUTHENTICATED',
          message: '인증된 사용자만 알림 설정을 조회할 수 있습니다.',
        },
      };
    }

    const settings = await this.notificationsService.getUserSettings(userId);

    return {
      success: true,
      data: settings,
    };
  }

  // 알림 설정 업데이트
  @Patch('settings')
  async updateSettings(
    @Req() req: Request & { user: any },
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    const userId = req.user.userId;
    const settings = await this.notificationsService.updateUserSettings(userId, dto);

    return {
      success: true,
      data: settings,
    };
  }
}
