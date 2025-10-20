import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIUsageService } from '../ai-usage/ai-usage.service';
import { OpenAIService } from '../openai/openai.service';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  creditsUsed?: number;
}


@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiUsageService: AIUsageService,
    private openaiService: OpenAIService,
  ) {}

  async getChatSessions(userId: number, limit: number = 20, search?: string) {
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const sessions = await this.prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true }
        }
      },
    });

    return sessions.map((session: any) => ({
      id: session.id,
      title: session.title,
      lastMessage: session.messages[0]?.content || null,
      messageCount: session._count.messages,
      timestamp: session.updatedAt,
      updatedAt: session.updatedAt,
      creditsUsed: session.totalCredits,
      duration: this.calculateSessionDuration(session.createdAt, session.updatedAt),
      status: 'completed',
    }));
  }

  async getChatSession(userId: number, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      title: session.title,
      messages: session.messages.map((msg: any) => ({
        id: msg.id,
        type: msg.type as 'user' | 'ai' | 'system',
        content: msg.content,
        timestamp: msg.createdAt,
        tokenCount: msg.tokenCount,
        creditsUsed: msg.creditsUsed,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      totalTokens: session.totalTokens,
      totalCredits: session.totalCredits,
    };
  }

  async createChatSession(userId: number) {
    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        title: '새 대화',
        totalTokens: 0,
        totalCredits: 0,
      },
    });

    return {
      id: session.id,
      title: session.title,
      messages: [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      totalTokens: session.totalTokens,
      totalCredits: session.totalCredits,
    };
  }

  async sendMessage(userId: number, message: string, sessionId?: string) {
    console.log('[ChatService] sendMessage 호출됨:', { userId, message: message.substring(0, 50), sessionId });

    let session;

    // 세션이 없으면 새로 생성
    if (!sessionId) {
      console.log('[ChatService] 새 세션 생성 중...');
      session = await this.createChatSession(userId);
      sessionId = session.id;
      console.log('[ChatService] 새 세션 생성 완료:', sessionId);
    } else {
      console.log('[ChatService] 기존 세션 조회 중:', sessionId);
      session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // 최근 20개 메시지만 컨텍스트로 사용
          },
        },
      });

      if (!session) {
        throw new Error('세션을 찾을 수 없습니다.');
      }
      console.log('[ChatService] 기존 세션 조회 완료, 메시지 수:', session.messages?.length || 0);
    }

    // 사용자 메시지 저장
    console.log('[ChatService] 사용자 메시지 저장 중...', { sessionId, messageLength: message.length });
    let userMessage;
    try {
      userMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId,
          type: 'user',
          content: message,
          tokenCount: 0,
          creditsUsed: 0,
        },
      });
      console.log('[ChatService] 사용자 메시지 저장 완료:', userMessage.id);
    } catch (error) {
      console.error('[ChatService] 사용자 메시지 저장 실패:', error);
      throw error;
    }

    // 🔥 OpenAI API로 응답 생성
    console.log('[ChatService] OpenAI API 호출 준비 중...');
    const systemPrompt = this.openaiService.getSystemPrompt();
    const conversationHistory = this.buildConversationHistory(session.messages || []);
    conversationHistory.push({ type: 'user', content: message });

    let aiResponse: string;
    let tokenCount: number;

    try {
      const response = await this.openaiService.generateChatResponse(
        conversationHistory,
        systemPrompt
      );
      aiResponse = response.content;
      tokenCount = response.tokenCount;
    } catch (error) {
      // Fallback: 에러 발생 시 기본 응답
      console.error('OpenAI API Error:', error);
      aiResponse = '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      tokenCount = this.estimateTokenCount(aiResponse);
    }

    // AI 메시지 저장 (토큰만 기록)
    const aiMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        type: 'ai',
        content: aiResponse,
        tokenCount,
        creditsUsed: 0, // AI 채팅은 크레딧을 사용하지 않음
      },
    });

    // AI 사용량 기록 (토큰만 차감)
    await this.aiUsageService.addTurnUsage(userId, tokenCount, false);

    // 세션 업데이트 (제목, 토큰만 업데이트)
    const updatedSession = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: session.title === '새 대화' ? this.generateSessionTitle(message) : session.title,
        totalTokens: { increment: tokenCount },
        totalCredits: 0, // AI 채팅은 크레딧을 사용하지 않음
        updatedAt: new Date(),
      },
    });

    return {
      messageId: aiMessage.id,
      content: aiResponse,
      tokenCount,
      creditsUsed: 0, // AI 채팅은 크레딧을 사용하지 않음
      session: {
        id: updatedSession.id,
        title: updatedSession.title,
        totalTokens: updatedSession.totalTokens,
        totalCredits: updatedSession.totalCredits,
      },
    };
  }

  async deleteChatSession(userId: number, sessionId: string) {
    // 세션 소유권 확인
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    // 관련 메시지들과 함께 세션 삭제
    await this.prisma.chatMessage.deleteMany({
      where: { sessionId },
    });

    await this.prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * 대화 컨텍스트 구성
   */
  private buildConversationHistory(messages: any[]): Array<{ type: 'user' | 'ai'; content: string }> {
    return messages.map((msg) => ({
      type: msg.type === 'user' ? 'user' : 'ai',
      content: msg.content,
    }));
  }

  private estimateTokenCount(text: string): number {
    // 간단한 토큰 수 추정 (실제로는 tokenizer 사용)
    // 한국어 평균: 1 토큰 ≈ 2-3 글자
    return Math.ceil(text.length / 2.5);
  }

  private generateSessionTitle(firstMessage: string): string {
    // 첫 메시지를 바탕으로 세션 제목 생성
    const title = firstMessage.length > 30
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage;

    return title;
  }

  private calculateSessionDuration(createdAt: Date, updatedAt: Date): number {
    // 세션 지속 시간을 분 단위로 계산
    const diff = updatedAt.getTime() - createdAt.getTime();
    return Math.round(diff / (1000 * 60));
  }
}