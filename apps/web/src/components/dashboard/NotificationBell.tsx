'use client';

import { useState, useMemo } from 'react';
import { Bell, X, Calendar, CreditCard, Star, CheckCircle, Settings, AlertCircle, MessageCircle, UserCheck, UserX, FileText, Megaphone, Clock, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
  getNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
  type NotificationSettings,
  type NotificationType,
} from '@/lib/notifications';

// 사용자 모드에서 표시할 알림 타입
const USER_NOTIFICATION_TYPES: NotificationType[] = [
  'INQUIRY_REPLY',              // 문의 답변
  'RESERVATION_APPROVED',       // 예약 승인
  'RESERVATION_REJECTED',       // 예약 거절
  'CONSULTATION_REQUEST',       // 상담 요청
  'CONSULTATION_ACCEPTED',      // 상담 수락
  'CONSULTATION_REJECTED',      // 상담 거절
  'CONSULTATION_UPCOMING',      // 다가오는 상담
  'CONSULTATION_COMPLETED',     // 상담 완료
  'PAYMENT_COMPLETED',          // 결제 완료
  'PAYMENT_FAILED',             // 결제 실패
  'CREDIT_PURCHASE_COMPLETED',  // 크레딧 구매 완료
  'CREDIT_LOW',                 // 크레딧 부족
  'REVIEW_REQUEST',             // 리뷰 요청
  'EXPERT_APPLICATION_UPDATE',  // 전문가 지원 상태
  'SYSTEM',                     // 시스템 알림
  'SYSTEM_ADMIN'                // 관리자 알림
];

// 전문가 모드에서 표시할 알림 타입
const EXPERT_NOTIFICATION_TYPES: NotificationType[] = [
  'INQUIRY_RECEIVED',           // 문의 접수
  'RESERVATION_PENDING',        // 예약 대기
  'CONSULTATION_REQUEST',       // 상담 요청
  'CONSULTATION_ACCEPTED',      // 상담 수락
  'CONSULTATION_REJECTED',      // 상담 거절
  'CONSULTATION_UPCOMING',      // 다가오는 상담
  'CONSULTATION_COMPLETED',     // 상담 완료
  'PAYMENT_COMPLETED',          // 결제 완료
  'CREDIT_LOW',                 // 크레딧 부족
  'REVIEW_REQUEST',             // 리뷰 요청
  'SYSTEM',                     // 시스템 알림
  'SYSTEM_ADMIN'                // 관리자 알림
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();
  const { viewMode, isExpertMode } = useViewMode();

  // 알림 목록 조회 - viewMode를 캐시 키에 포함
  const { data: notificationsData, refetch, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', viewMode],
    queryFn: () => getNotifications({ limit: 50 }),
    refetchInterval: 10000, // ⚡ 10초마다 (빠른 알림 표시)
    refetchOnWindowFocus: true, // 탭 전환 시 자동 새로고침
    refetchOnMount: true, // 컴포넌트 마운트 시 자동 새로고침
    staleTime: 0, // 항상 최신 데이터 요청
    gcTime: 0, // 캐시 즉시 제거
  });

  // 🔍 디버깅: useQuery 상태 확인
  console.log('[NotificationBell] useQuery 상태:', {
    isLoading,
    isError,
    error: error?.message,
    hasData: !!notificationsData,
    isArray: Array.isArray(notificationsData),
    hasDataProperty: notificationsData && 'data' in notificationsData,
    hasSuccessProperty: notificationsData && 'success' in notificationsData,
    dataType: notificationsData ? typeof notificationsData : 'undefined',
    viewMode,
    isExpertMode
  });

  // 🔍 실제 데이터 구조 상세 로깅
  if (notificationsData) {
    console.log('[NotificationBell] 실제 데이터:', {
      fullObject: notificationsData,
      dotData: (notificationsData as any)?.data,
      dotDataLength: Array.isArray((notificationsData as any)?.data)
        ? (notificationsData as any).data.length
        : 'not array'
    });
  }

  // 알림 설정 조회
  const { data: settingsData, isLoading: isSettingsLoading, isError: isSettingsError, error: settingsError } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: getNotificationSettings,
  });

  // 🔍 설정 데이터 디버깅
  console.log('[NotificationBell] 설정 데이터:', {
    settingsData,
    hasData: !!settingsData,
    dotData: settingsData?.data,
    type: typeof settingsData,
    isSettingsLoading,
    isSettingsError,
    settingsError: settingsError?.message
  });

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 모든 알림 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 알림 삭제
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 알림 설정 업데이트
  const updateSettingsMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
    },
  });

  // 모드별 알림 필터링
  const notifications = useMemo(() => {
    // 🔧 수정: notificationsData가 배열일 수도 있고 객체일 수도 있음
    let allNotifications: Notification[] = [];

    if (Array.isArray(notificationsData)) {
      // 배열로 직접 온 경우
      allNotifications = notificationsData;
    } else if (notificationsData?.data) {
      // 객체에서 .data 추출
      allNotifications = notificationsData.data;
    }

    // 모드에 따라 다른 타입 필터 적용
    const allowedTypes = isExpertMode ? EXPERT_NOTIFICATION_TYPES : USER_NOTIFICATION_TYPES;

    const filtered = allNotifications.filter(notification =>
      allowedTypes.includes(notification.type)
    );

    // 디버깅 로그
    console.log('[NotificationBell] 알림 데이터:', {
      mode: isExpertMode ? '전문가' : '사용자',
      dataType: Array.isArray(notificationsData) ? 'array' : 'object',
      total: allNotifications.length,
      filtered: filtered.length,
      types: filtered.map(n => n.type),
      unreadCount: filtered.filter(n => !n.isRead).length,
      actionUrls: filtered.map(n => ({ id: n.id, type: n.type, actionUrl: n.actionUrl }))
    });

    return filtered;
  }, [notificationsData, isExpertMode]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 🔧 설정 데이터 파싱 (알림 데이터와 동일한 패턴)
  const settings = settingsData?.data || settingsData;

  console.log('[NotificationBell] 파싱된 설정:', {
    settings,
    showSettings,
    hasSettings: !!settings
  });

  const handleMarkAsRead = (notificationId: number, actionUrl?: string) => {
    console.log('[NotificationBell] 알림 클릭:', { notificationId, actionUrl });
    markAsReadMutation.mutate(notificationId);
    if (actionUrl) {
      console.log('[NotificationBell] 페이지 이동:', actionUrl);
      window.location.href = actionUrl;
    } else {
      console.warn('[NotificationBell] actionUrl이 없습니다');
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getIcon = (type: Notification['type'], priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    // 우선순위에 따른 컬러 결정
    const priorityColor =
      priority === 'HIGH' ? 'text-red-600' :
      priority === 'MEDIUM' ? 'text-yellow-600' :
      'text-blue-600';

    switch (type) {
      case 'CONSULTATION_REQUEST':
      case 'CONSULTATION_ACCEPTED':
      case 'CONSULTATION_REJECTED':
      case 'CONSULTATION_UPCOMING':
      case 'CONSULTATION_COMPLETED':
        return <Calendar className={`w-4 h-4 ${priorityColor}`} />;
      case 'PAYMENT_COMPLETED':
      case 'PAYMENT_FAILED':
      case 'CREDIT_PURCHASE_COMPLETED':
      case 'CREDIT_LOW':
        return <CreditCard className={`w-4 h-4 ${priorityColor}`} />;
      case 'REVIEW_REQUEST':
        return <Star className={`w-4 h-4 ${priorityColor}`} />;
      case 'INQUIRY_RECEIVED':
      case 'INQUIRY_REPLY':
        return <MessageCircle className={`w-4 h-4 ${priorityColor}`} />;
      case 'RESERVATION_PENDING':
        return <Clock className={`w-4 h-4 ${priorityColor}`} />;
      case 'RESERVATION_APPROVED':
        return <UserCheck className={`w-4 h-4 ${priorityColor}`} />;
      case 'RESERVATION_REJECTED':
        return <UserX className={`w-4 h-4 ${priorityColor}`} />;
      case 'EXPERT_APPLICATION_UPDATE':
        return <FileText className={`w-4 h-4 ${priorityColor}`} />;
      case 'SYSTEM_ADMIN':
        return <Megaphone className={`w-4 h-4 ${priorityColor}`} />;
      case 'SYSTEM':
        return <AlertCircle className={`w-4 h-4 ${priorityColor}`} />;
      default:
        return <Bell className={`w-4 h-4 ${priorityColor}`} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="relative">
      {/* 알림 벨 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isExpertMode
            ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        aria-label="알림"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 w-5 h-5 text-white text-xs font-semibold rounded-full flex items-center justify-center ${
            isExpertMode ? 'bg-blue-500' : 'bg-red-500'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 패널 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 알림 드롭다운 */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">알림</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('[NotificationBell] 강제 새로고침 시작');
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    refetch();
                  }}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  aria-label="새로고침"
                  title="알림 새로고침"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  aria-label="설정"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 설정 패널 */}
            {showSettings && settings && (
              <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  알림 설정
                </h4>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">다가오는 예약</span>
                  <input
                    type="checkbox"
                    checked={settings.upcomingReservations}
                    onChange={(e) =>
                      handleSettingChange('upcomingReservations', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">크레딧 부족</span>
                  <input
                    type="checkbox"
                    checked={settings.creditLow}
                    onChange={(e) =>
                      handleSettingChange('creditLow', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">리뷰 요청</span>
                  <input
                    type="checkbox"
                    checked={settings.reviewRequests}
                    onChange={(e) =>
                      handleSettingChange('reviewRequests', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">상담 완료</span>
                  <input
                    type="checkbox"
                    checked={settings.consultationCompleted}
                    onChange={(e) =>
                      handleSettingChange('consultationCompleted', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">시스템 알림</span>
                  <input
                    type="checkbox"
                    checked={settings.systemNotifications}
                    onChange={(e) =>
                      handleSettingChange('systemNotifications', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">이메일 알림</span>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleSettingChange('emailNotifications', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            )}

            {/* 알림 목록 */}
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id, notification.actionUrl || undefined)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="삭제"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
