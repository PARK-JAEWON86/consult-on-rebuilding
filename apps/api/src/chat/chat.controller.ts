import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getChatSessions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    try {
      const userId = req.user.id;
      const sessions = await this.chatService.getChatSessions(
        userId,
        parseInt(limit || '20') || 20,
        search
      );

      return {
        success: true,
        data: sessions,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHAT_SESSIONS_ERROR',
          message: '채팅 세션을 불러오는 중 오류가 발생했습니다.',
          details: error?.message || 'Unknown error',
        },
      };
    }
  }

  @Get('sessions/:sessionId')
  async getChatSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.id;
      const session = await this.chatService.getChatSession(userId, sessionId);

      if (!session) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: '채팅 세션을 찾을 수 없습니다.',
          },
        };
      }

      return {
        success: true,
        data: session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHAT_SESSION_ERROR',
          message: '채팅 세션을 불러오는 중 오류가 발생했습니다.',
          details: error?.message || 'Unknown error',
        },
      };
    }
  }

  @Post('sessions')
  async createChatSession(@Request() req: any) {
    try {
      const userId = req.user.id;
      const session = await this.chatService.createChatSession(userId);

      return {
        success: true,
        data: session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_SESSION_ERROR',
          message: '새 채팅 세션을 생성하는 중 오류가 발생했습니다.',
          details: error?.message || 'Unknown error',
        },
      };
    }
  }

  @Post('message')
  async sendMessage(
    @Request() req: any,
    @Body() body: { sessionId?: string; message: string }
  ) {
    try {
      const userId = req.user.id;
      const { sessionId, message } = body;

      if (!message || message.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: '메시지 내용이 필요합니다.',
          },
        };
      }

      const result = await this.chatService.sendMessage(userId, message, sessionId);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_MESSAGE_ERROR',
          message: '메시지 전송 중 오류가 발생했습니다.',
          details: error?.message || 'Unknown error',
        },
      };
    }
  }

  @Post('sessions/:sessionId/delete')
  async deleteChatSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.id;
      await this.chatService.deleteChatSession(userId, sessionId);

      return {
        success: true,
        data: { message: '채팅 세션이 삭제되었습니다.' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_SESSION_ERROR',
          message: '채팅 세션 삭제 중 오류가 발생했습니다.',
          details: error?.message || 'Unknown error',
        },
      };
    }
  }
}