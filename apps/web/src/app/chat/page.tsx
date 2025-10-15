'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAIUsage,
  addTurnUsage,
  formatTokens,
  estimateCreditsForTurn,
  AIUsageResponse,
  AVERAGE_TOKENS_PER_TURN
} from '@/lib/ai-usage';
import { api } from '@/lib/api';
import {
  Bot, User, Send, Plus, Brain, Zap, AlertCircle, Loader2,
  ThumbsUp, ThumbsDown, Copy, MoreVertical
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  liked?: boolean;
  disliked?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  totalTokens: number;
}

export default function ChatPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [preciseMode, setPreciseMode] = useState(false);
  const [showTokenUsage, setShowTokenUsage] = useState(false);

  // Chat sessions
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Sync chat sessions with sidebar (for displaying in the existing sidebar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store chat sessions in localStorage for sidebar to access
      localStorage.setItem('chat-sessions', JSON.stringify(chatSessions));

      // Dispatch custom event to notify sidebar of session changes
      const event = new CustomEvent('chatSessionsUpdated', {
        detail: { sessions: chatSessions, selectedId: selectedSessionId }
      });
      window.dispatchEvent(event);
    }
  }, [chatSessions, selectedSessionId]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI 사용량 데이터
  const { data: aiUsageData, refetch: refetchUsage } = useQuery<AIUsageResponse>({
    queryKey: ['aiUsage'],
    queryFn: getAIUsage,
    refetchInterval: 30000,
  });

  // 턴 사용량 기록 뮤테이션
  const recordUsageMutation = useMutation({
    mutationFn: ({ tokens, precise }: { tokens: number; precise: boolean }) =>
      addTurnUsage(tokens, precise),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiUsage'] });
    },
  });

  useEffect(() => {
    // 로딩 중이 아니고, 인증되지 않은 경우에만 리다이렉트
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/chat');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 페이지 로드 시 저장된 세션 복원
    const initializeSessions = () => {
      try {
        const savedSessions = localStorage.getItem('chat-sessions');
        const savedCurrentSessionId = localStorage.getItem('current-session-id');

        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          setChatSessions(sessions);

          if (savedCurrentSessionId && sessions.find((s: ChatSession) => s.id === savedCurrentSessionId)) {
            setCurrentSessionId(savedCurrentSessionId);
            setSelectedSessionId(savedCurrentSessionId);

            // 기존 세션의 메시지 복원
            const savedMessages = localStorage.getItem(`chat-messages-${savedCurrentSessionId}`);
            if (savedMessages) {
              setMessages(JSON.parse(savedMessages));
            }
          } else if (sessions.length > 0) {
            setCurrentSessionId(sessions[0].id);
            setSelectedSessionId(sessions[0].id);
          }
        }

        // 세션이 없으면 새로 생성
        if (!savedSessions || JSON.parse(savedSessions || '[]').length === 0) {
          createNewSession();
        }
      } catch (error) {
        console.error('세션 복원 실패:', error);
        createNewSession();
      }
    };

    const createNewSession = () => {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(newSessionId);
      setSelectedSessionId(newSessionId);

      const newSession: ChatSession = {
        id: newSessionId,
        title: '새 대화',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        totalTokens: 0
      };
      setChatSessions([newSession]);

      // 새 세션 정보 저장
      localStorage.setItem('chat-sessions', JSON.stringify([newSession]));
      localStorage.setItem('current-session-id', newSessionId);
    };

    if (!currentSessionId) {
      initializeSessions();
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 인증 상태 확인
    if (!isAuthenticated) {
      const authErrorMessage: ChatMessage = {
        id: `msg-${Date.now()}-auth-error`,
        role: 'assistant',
        content: '로그인이 필요한 서비스입니다. 로그인 후 이용해주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authErrorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 디버깅: API 호출 정보 출력
      console.log('[Chat] Sending message to API:', {
        endpoint: '/chat/message',
        sessionId: currentSessionId !== 'new' ? currentSessionId : undefined,
        messageLength: userMessage.content.length
      });

      // 백엔드 API 호출로 실제 GPT 응답 받기
      const data = await api.post('/chat/message', {
        message: userMessage.content,
        sessionId: currentSessionId !== 'new' ? currentSessionId : undefined
      });

      console.log('[Chat] API response received:', {
        success: data.success,
        hasData: !!data.data,
        tokenCount: data.data?.tokenCount
      });

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'API 응답 형식이 올바르지 않습니다.');
      }

      const assistantMessage: ChatMessage = {
        id: data.data.messageId,
        role: 'assistant',
        content: data.data.content,
        timestamp: new Date(),
        tokens: data.data.tokenCount
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // 메시지를 로컬 스토리지에 저장
      localStorage.setItem(`chat-messages-${currentSessionId}`, JSON.stringify(updatedMessages));

      // 토큰 사용량 기록
      if (data.data.tokenCount) {
        await recordUsageMutation.mutateAsync({
          tokens: data.data.tokenCount,
          precise: preciseMode
        });
      }

      // 세션 업데이트
      updateCurrentSession([userMessage, assistantMessage]);

    } catch (error: any) {
      // 상세 에러 로깅
      console.error('[Chat] Error details:', {
        message: error?.message,
        status: error?.status,
        context: error?.context,
        error: error
      });

      // 에러 타입에 따른 메시지 생성
      let errorContent = '죄송합니다. 현재 AI 서비스에 문제가 발생했습니다.';

      if (error?.status === 401) {
        errorContent = '인증이 만료되었습니다. 다시 로그인해주세요.';
      } else if (error?.status === 429) {
        errorContent = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.status >= 500) {
        errorContent = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.message) {
        // 개발 환경에서는 실제 에러 메시지도 표시
        if (process.env.NODE_ENV === 'development') {
          errorContent += `\n\n[개발 모드] ${error.message}`;
        }
      }

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const updateCurrentSession = (newMessages: ChatMessage[]) => {
    const updatedSessions = chatSessions.map(session =>
      session.id === currentSessionId
        ? {
            ...session,
            title: messages.length === 0 ? newMessages[0]?.content.slice(0, 30) + '...' : session.title,
            updatedAt: new Date(),
            messageCount: messages.length + newMessages.length,
            totalTokens: session.totalTokens + (newMessages.find(m => m.tokens)?.tokens || 0)
          }
        : session
    );

    setChatSessions(updatedSessions);

    // 업데이트된 세션 목록을 로컬 스토리지에 저장
    localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));
  };

  const startNewChat = () => {
    // 현재 세션의 메시지 저장
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`chat-messages-${currentSessionId}`, JSON.stringify(messages));
    }

    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newSessionId);
    setSelectedSessionId(newSessionId);
    setMessages([]);

    const newSession: ChatSession = {
      id: newSessionId,
      title: '새 대화',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      totalTokens: 0
    };

    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);

    // 세션 목록과 현재 세션 ID 저장
    localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('current-session-id', newSessionId);
  };

  const selectSession = (sessionId: string) => {
    // 현재 세션의 메시지 저장
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`chat-messages-${currentSessionId}`, JSON.stringify(messages));
    }

    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    localStorage.setItem('current-session-id', sessionId);

    // 선택된 세션의 메시지 로드
    try {
      const savedMessages = localStorage.getItem(`chat-messages-${sessionId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
      setMessages([]);
    }
  };

  // Listen for session events from sidebar
  useEffect(() => {
    const handleSessionSelection = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      selectSession(sessionId);
    };

    const handleSessionDelete = (event: CustomEvent) => {
      const { sessionId, sessions } = event.detail;
      setChatSessions(sessions);
      if (sessionId === currentSessionId) {
        // 현재 세션이 삭제되면 새 세션 시작
        startNewChat();
      }
    };

    const handleSessionsUpdate = (event: CustomEvent) => {
      const { sessions } = event.detail;
      setChatSessions(sessions);
    };

    window.addEventListener('chatSessionSelected', handleSessionSelection as EventListener);
    window.addEventListener('chatSessionDeleted', handleSessionDelete as EventListener);
    window.addEventListener('chatSessionsUpdated', handleSessionsUpdate as EventListener);

    return () => {
      window.removeEventListener('chatSessionSelected', handleSessionSelection as EventListener);
      window.removeEventListener('chatSessionDeleted', handleSessionDelete as EventListener);
      window.removeEventListener('chatSessionsUpdated', handleSessionsUpdate as EventListener);
    };
  }, [currentSessionId]);

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (sessionId === currentSessionId) {
      startNewChat();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const likeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, liked: !msg.liked, disliked: false }
        : msg
    ));
  };

  const dislikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, disliked: !msg.disliked, liked: false }
        : msg
    ));
  };

  const aiUsage = aiUsageData?.data;
  const remainingTokens = (aiUsage?.summary?.remainingFreeTokens || 0) + (aiUsage?.summary?.remainingPurchasedTokens || 0);
  const canAffordChat = remainingTokens > 500; // 최소 500토큰 필요

  // 로딩 중이면 로딩 화면 표시
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 인증되지 않은 경우 null 반환 (리다이렉트 진행 중)
  if (!isAuthenticated) {
    return null;
  }

  return (
      <div className="flex flex-col h-full bg-gray-50 pb-32">
      {/* 페이지 헤더 - 토큰 잔량과 새 대화 버튼 */}
      <div className="bg-gray-50 border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 토큰 잔량 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">토큰 잔량</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatTokens(remainingTokens)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              예상 {aiUsage?.summary?.totalEstimatedTurns || 0}턴 가능
            </div>
          </div>

          {/* 오른쪽: 새 대화 버튼과 설정 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreciseMode(!preciseMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                preciseMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              정밀 모드
            </button>
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 대화
            </button>
            <button
              onClick={() => setShowTokenUsage(!showTokenUsage)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!canAffordChat && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">토큰이 부족합니다. 충전을 권장합니다.</span>
            </div>
          </div>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 bg-gray-50" style={{ paddingTop: '14rem' }}>
            <div className="text-center max-w-2xl" style={{ marginTop: '-2rem' }}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                어떤 상담을 받아야 할지 모르시나요?
              </h2>
              <p className="text-gray-600 mb-8">
                AI 채팅 상담을 통해 먼저 문제를 정리해보세요. 전문가 매칭 전에 AI가 도움을 드릴게요.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setInputValue('법무사와 상담하고 싶은데 어떤 서비스를 받을 수 있나요?')}
                  className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">법무 상담</div>
                  <div className="text-xs text-gray-600 mt-1">법무사 서비스 문의</div>
                </button>
                <button
                  onClick={() => setInputValue('부동산 계약 관련해서 도움이 필요해요. 어디서부터 시작해야 할까요?')}
                  className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">부동산 상담</div>
                  <div className="text-xs text-gray-600 mt-1">계약 및 매매 도움</div>
                </button>
                <button
                  onClick={() => setInputValue('사업자 등록과 세무 관련해서 궁금한 점이 있어요')}
                  className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">세무 상담</div>
                  <div className="text-xs text-gray-600 mt-1">사업자 등록 및 세무</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-12 py-12 space-y-6 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </div>
                  {message.tokens && showTokenUsage && (
                    <div className="mt-3 pt-3 border-t border-gray-300 text-xs opacity-70">
                      {message.tokens} 토큰 사용
                    </div>
                  )}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="복사"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => likeMessage(message.id)}
                        className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${
                          message.liked ? 'text-green-600' : ''
                        }`}
                        title="좋아요"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => dislikeMessage(message.id)}
                        className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${
                          message.disliked ? 'text-red-600' : ''
                        }`}
                        title="싫어요"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-3xl bg-gray-100 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    <span className="text-gray-600">생각 중...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 - 윈도우 하단 고정 (사이드바 영역 제외) */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-gray-50 border-t border-gray-200 p-6 z-40">
        <div className="max-w-4xl mx-auto px-12">
          {!canAffordChat && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">토큰이 부족합니다</p>
                  <p className="text-sm text-red-600 mt-1">
                    AI 채팅을 계속하려면 토큰을 충전해 주세요.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/credits')}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                토큰 충전하기
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canAffordChat ? "메시지를 입력하세요..." : "토큰을 충전해 주세요"}
              disabled={!canAffordChat || isLoading}
              className="w-full px-6 py-4 pr-16 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-base leading-relaxed"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '200px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !canAffordChat || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <span>
              {preciseMode ? '정밀 모드 활성' : '일반 모드'} ·
              예상 {estimateCreditsForTurn(900, preciseMode)} 크레딧 소모
            </span>
            <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
          </div>
        </div>
      </div>
      </div>
  );
}