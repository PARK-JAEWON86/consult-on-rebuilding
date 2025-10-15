import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenAIService {
  private client: OpenAI;
  private readonly model: string;
  private readonly maxContextMessages: number = 20;

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');

    // 🔍 디버깅: API 키 확인
    console.log('[OpenAIService] Initializing...');
    console.log('[OpenAIService] API Key present:', !!apiKey);
    console.log('[OpenAIService] API Key prefix:', apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING');

    if (!apiKey) {
      console.error('[OpenAIService] ❌ CRITICAL: OPENAI_API_KEY is not configured!');
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.model = configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo');

    console.log('[OpenAIService] ✅ Initialized successfully with model:', this.model);
  }

  /**
   * GPT API를 사용하여 채팅 응답 생성
   */
  async generateChatResponse(
    messages: Array<{ type: 'user' | 'ai'; content: string }>,
    systemPrompt?: string
  ): Promise<{ content: string; tokenCount: number }> {
    try {
      // 메시지 포맷팅 (최근 N개만 포함)
      const formattedMessages = this.formatMessages(messages, systemPrompt);

      console.log('[OpenAIService] Calling OpenAI API...');
      console.log('[OpenAIService] Model:', this.model);
      console.log('[OpenAIService] Message count:', formattedMessages.length);

      // OpenAI API 호출
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log('[OpenAIService] ✅ API call successful');
      console.log('[OpenAIService] Tokens used:', completion.usage?.total_tokens);

      return {
        content: completion.choices[0].message.content || '',
        tokenCount: completion.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error('[OpenAIService] ❌ API call failed:', error);

      if (error instanceof OpenAI.APIError) {
        console.error('[OpenAIService] OpenAI API Error details:', {
          status: error.status,
          type: error.type,
          code: error.code,
          message: error.message
        });
        throw this.handleAPIError(error);
      }

      console.error('[OpenAIService] Unknown error:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 스트리밍 응답 생성 (UX 개선용)
   */
  async *generateStreamingResponse(
    messages: Array<{ type: 'user' | 'ai'; content: string }>,
    systemPrompt?: string
  ): AsyncGenerator<string, { totalTokens: number }, void> {
    const formattedMessages = this.formatMessages(messages, systemPrompt);

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let totalTokens = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
      // 마지막 청크에서 토큰 수 확인
      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens;
      }
    }

    return { totalTokens };
  }

  /**
   * 메시지를 OpenAI 형식으로 변환
   */
  private formatMessages(
    messages: Array<{ type: 'user' | 'ai'; content: string }>,
    systemPrompt?: string
  ): ChatMessage[] {
    const formatted: ChatMessage[] = [];

    // System message 추가
    if (systemPrompt) {
      formatted.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 최근 N개 메시지만 포함 (토큰 제한)
    const recentMessages = messages.slice(-this.maxContextMessages);

    // 메시지 변환
    for (const msg of recentMessages) {
      formatted.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    return formatted;
  }

  /**
   * API 에러 처리
   */
  private handleAPIError(error: any): Error {
    if (error.status === 429) {
      return new Error('AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.');
    }
    if (error.status === 401) {
      return new Error('AI 서비스 인증 오류가 발생했습니다.');
    }
    if (error.status === 500) {
      return new Error('AI 서비스에 오류가 발생했습니다.');
    }
    return new Error(`AI 서비스 오류: ${error.message}`);
  }

  /**
   * 콘텐츠 안전성 검사 (선택사항)
   */
  async moderateContent(text: string): Promise<boolean> {
    try {
      const moderation = await this.client.moderations.create({
        input: text,
      });
      return moderation.results[0].flagged;
    } catch (error) {
      console.error('Moderation error:', error);
      return false;
    }
  }

  /**
   * 시스템 프롬프트 정의 (상담사 역할)
   */
  getSystemPrompt(): string {
    return `당신은 전문적이고 공감 능력이 뛰어난 AI 상담사입니다.

역할:
- 사용자의 고민과 질문에 친절하고 전문적으로 답변합니다
- 공감적이고 따뜻한 태도로 대화합니다
- 구체적이고 실용적인 조언을 제공합니다

지침:
- 한국어로 자연스럽게 대화합니다
- 전문 용어는 쉽게 풀어서 설명합니다
- 필요시 단계별로 해결 방법을 안내합니다
- 민감한 주제는 신중하게 다룹니다
- 법적/의료적 조언이 필요한 경우 전문가 상담을 권유합니다

금지사항:
- 부적절하거나 유해한 내용 생성 금지
- 개인정보 요구 금지
- 의료/법률 진단 금지`;
  }
}
