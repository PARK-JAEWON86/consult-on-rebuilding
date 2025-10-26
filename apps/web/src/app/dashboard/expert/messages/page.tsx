'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getExpertInquiries,
  markInquiryAsRead,
  replyToInquiry,
  deleteExpertInquiry,
  type Inquiry
} from '@/lib/inquiries';
import { Mail, Search, CheckCircle, Circle, Reply, Trash2 } from 'lucide-react';

export default function ExpertMessagesPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Inquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');

  // 문의 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['expert-inquiries', filterStatus, searchQuery],
    queryFn: () => getExpertInquiries({
      status: filterStatus,
      search: searchQuery || undefined,
      limit: 50
    }),
    enabled: !!isAuthenticated
  });

  // 읽음 표시 mutation
  const markAsReadMutation = useMutation({
    mutationFn: markInquiryAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-inquiries'] });
    }
  });

  // 답변 작성 mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      replyToInquiry(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-inquiries'] });
      setReplyText('');
      setSelectedMessage(null);
    }
  });

  // 문의 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExpertInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-inquiries'] });
      setSelectedMessage(null);
    }
  });

  const messages = data?.inquiries || [];
  const filteredMessages = messages.filter((msg) => {
    // 필터 적용
    if (filterStatus === 'unread' && msg.isRead) return false;
    if (filterStatus === 'replied' && !msg.reply) return false;

    // 검색어 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        msg.clientName?.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleSelectMessage = (message: Inquiry) => {
    setSelectedMessage(message);
    setReplyText('');

    // 읽지 않은 메시지면 읽음 표시
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      await replyMutation.mutateAsync({
        id: selectedMessage.id,
        content: replyText
      });
      alert('답장이 전송되었습니다.');
    } catch (error: any) {
      console.error('답장 전송 실패:', error);
      const errorMessage = error?.response?.data?.error?.message || '답장 전송에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    deleteMutation.mutate(messageId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}분 전`;
    }
    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    }
    if (diffDays < 7) {
      return `${diffDays}일 전`;
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      schedule: '상담 일정',
      time: '상담 시간',
      price: '상담 비용',
      method: '상담 방식',
      other: '기타 문의',
    };
    return labels[category] || category;
  };

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-10">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-blue-900">메시지 관리</h1>
                {unreadCount > 0 && (
                  <span className="text-sm font-normal bg-red-500 text-white px-2 py-1 rounded-full">
                    {unreadCount}개 읽지 않음
                  </span>
                )}
              </div>
              <p className="text-blue-700 mt-1">
                클라이언트로부터 받은 문의 메시지를 관리하고 답장할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="메시지 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({messages.length})
              </button>
              <button
                onClick={() => setFilterStatus('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                읽지 않음 ({unreadCount})
              </button>
              <button
                onClick={() => setFilterStatus('replied')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'replied'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답장 완료 ({messages.filter((m) => m.reply).length})
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메시지 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700">
                  메시지 목록 ({filteredMessages.length})
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">로딩 중...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">메시지가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {filteredMessages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                      } ${!message.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* 읽음 상태 */}
                        {!message.isRead ? (
                          <Circle className="h-2 w-2 text-blue-600 fill-current flex-shrink-0" />
                        ) : message.reply ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-2 w-2 text-gray-300 flex-shrink-0" />
                        )}

                        {/* 이름 */}
                        <span className={`text-xs font-medium min-w-[60px] ${
                          !message.isRead ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {message.clientName}
                        </span>

                        {/* 문의 내용 */}
                        <span className={`text-xs flex-1 truncate ${
                          !message.isRead ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {message.subject}
                        </span>

                        {/* 문의 유형 */}
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                          {getCategoryLabel(message.category)}
                        </span>

                        {/* 시간 */}
                        <span className="text-xs text-gray-400 flex-shrink-0 min-w-[50px] text-right">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 메시지 상세 및 답장 */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* 메시지 헤더 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedMessage.subject}
                        </h2>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {getCategoryLabel(selectedMessage.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          보낸 사람: <strong>{selectedMessage.clientName}</strong>
                        </span>
                        <span>{selectedMessage.clientEmail}</span>
                        <span>{formatDate(selectedMessage.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="메시지 삭제"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {selectedMessage.reply && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span>답장 완료</span>
                    </div>
                  )}
                </div>

                {/* 클라이언트 문의 내용 */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">클라이언트 문의</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>

                {/* 이미 답변한 경우 답변 내용 표시 */}
                {selectedMessage.reply ? (
                  <div className="p-6 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-700">
                        내 답변
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedMessage.reply.repliedAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.reply.content}
                    </p>
                  </div>
                ) : (
                  /* 답장 영역 */
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Reply className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">답장 작성</h3>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답장 내용을 입력하세요..."
                      className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                    />

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => setReplyText('')}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {replyMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            전송 중...
                          </>
                        ) : (
                          <>
                            <Reply className="h-4 w-4" />
                            답장 보내기
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center p-12">
                <div className="text-center">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    메시지를 선택하여 내용을 확인하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
