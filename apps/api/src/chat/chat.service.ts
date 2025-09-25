import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIUsageService } from '../ai-usage/ai-usage.service';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  creditsUsed?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  totalTokens: number;
  totalCredits: number;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiUsageService: AIUsageService
  ) {}

  async getChatSessions(userId: number, limit: number = 20, search?: string) {
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const sessions = await (this.prisma as any).chatSession.findMany({
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
    const session = await (this.prisma as any).chatSession.findFirst({
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
    const session = await (this.prisma as any).chatSession.create({
      data: {
        userId,
        title: '새로운 상담',
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
    let session;

    // 세션이 없으면 새로 생성
    if (!sessionId) {
      session = await this.createChatSession(userId);
      sessionId = session.id;
    } else {
      session = await (this.prisma as any).chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new Error('세션을 찾을 수 없습니다.');
      }
    }

    // 사용자 메시지 저장
    const userMessage = await (this.prisma as any).chatMessage.create({
      data: {
        sessionId,
        type: 'user',
        content: message,
        tokenCount: 0,
        creditsUsed: 0,
      },
    });

    // AI 응답 생성 (여기서는 간단한 응답으로 시뮬레이션)
    const aiResponse = await this.generateAIResponse(message);
    const tokenCount = this.estimateTokenCount(aiResponse);
    const creditsUsed = this.calculateCreditsUsed(tokenCount);

    // AI 메시지 저장
    const aiMessage = await (this.prisma as any).chatMessage.create({
      data: {
        sessionId,
        type: 'ai',
        content: aiResponse,
        tokenCount,
        creditsUsed,
      },
    });

    // AI 사용량 기록
    await this.aiUsageService.addTurnUsage(userId, tokenCount, false);

    // 세션 업데이트 (제목, 토큰/크레딧 합계)
    const updatedSession = await (this.prisma as any).chatSession.update({
      where: { id: sessionId },
      data: {
        title: session.title === '새로운 상담' ? this.generateSessionTitle(message) : session.title,
        totalTokens: { increment: tokenCount },
        totalCredits: { increment: creditsUsed },
        updatedAt: new Date(),
      },
    });

    return {
      messageId: aiMessage.id,
      content: aiResponse,
      tokenCount,
      creditsUsed,
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
    const session = await (this.prisma as any).chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    // 관련 메시지들과 함께 세션 삭제
    await (this.prisma as any).chatMessage.deleteMany({
      where: { sessionId },
    });

    await (this.prisma as any).chatSession.delete({
      where: { id: sessionId },
    });
  }

  private async generateAIResponse(userMessage: string): Promise<string> {
    // 실제로는 여기에 OpenAI API 호출이나 다른 AI 서비스 호출이 들어갑니다
    // 현재는 간단한 시뮬레이션 응답을 제공합니다

    const responses = [
      '안녕하세요! 좋은 질문이네요. 이 문제에 대해 다양한 관점에서 생각해볼 수 있습니다.',
      '그런 상황이라면 정말 어려우셨을 것 같아요. 먼저 현재 상황을 정확히 파악해보는 것이 중요합니다.',
      '이해합니다. 이런 고민을 하고 계시는군요. 단계별로 접근해보면 좋을 것 같습니다.',
      '좋은 접근 방법이네요. 이 경우에는 몇 가지 옵션을 고려해볼 수 있습니다.',
      '말씀해주신 내용을 보니 신중하게 생각하고 계시는 것 같습니다. 제가 도움드릴 수 있는 방법을 알려드릴게요.',
    ];

    // 키워드 기반 응답
    if (userMessage.includes('스트레스')) {
      return '스트레스 관리는 현대인에게 매우 중요한 주제입니다. 규칙적인 운동, 충분한 수면, 명상이나 호흡법 등이 도움이 될 수 있습니다. 또한 스트레스의 원인을 파악하고 이를 해결하기 위한 구체적인 계획을 세우는 것도 중요합니다.';
    }

    if (userMessage.includes('투자')) {
      return '투자는 신중한 접근이 필요한 영역입니다. 먼저 자신의 투자 목표와 위험 감수 능력을 명확히 하고, 분산 투자의 원칙을 따르는 것이 좋습니다. 또한 투자하기 전에 충분한 공부와 정보 수집이 필요합니다.';
    }

    if (userMessage.includes('건강')) {
      return '건강 관리는 생활 습관의 개선에서 시작됩니다. 균형 잡힌 식단, 규칙적인 운동, 충분한 수면, 스트레스 관리가 기본입니다. 또한 정기적인 건강 검진을 통해 조기에 문제를 발견하고 대처하는 것이 중요합니다.';
    }

    // 기본 응답
    return responses[Math.floor(Math.random() * responses.length)] + ' 더 구체적인 상황이나 고민이 있으시면 자세히 말씀해 주세요.';
  }

  private estimateTokenCount(text: string): number {
    // 간단한 토큰 수 추정 (실제로는 tokenizer 사용)
    // 한국어 평균: 1 토큰 ≈ 2-3 글자
    return Math.ceil(text.length / 2.5);
  }

  private calculateCreditsUsed(tokenCount: number): number {
    // 토큰 수에 따른 크레딧 계산
    // 기본 3크레딧 + 토큰 수에 따른 추가 크레딧
    let credits = 3;

    if (tokenCount > 400) credits += 1.5;
    if (tokenCount > 800) credits += 3;
    if (tokenCount > 1200) credits += 6;

    return Math.round(credits * 10) / 10; // 소수점 첫째자리까지
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