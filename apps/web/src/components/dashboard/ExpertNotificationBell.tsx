'use client';

import { useState, useMemo } from 'react';
import { Bell, X, Calendar, Settings, AlertCircle, MessageCircle, Clock, RefreshCw, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// 전문가 모드에서만 표시할 알림 타입
const EXPERT_NOTIFICATION_TYPES: NotificationType[] = [
  'INQUIRY_RECEIVED',
  'RESERVATION_PENDING',
  'CONSULTATION_UPCOMING',
  'REVIEW_REQUEST',
  'SYSTEM',
  'SYSTEM_ADMIN'
];

export function ExpertNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  // 알림 목록 조회
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications', 'expert'],
    queryFn: () => getNotifications({ limit: 50 }),
    refetchInterval: 10000, // ⚡ 10초마다 (빠른 알림 표시)
    refetchOnWindowFocus: true, // 탭 전환 시 자동 새로고침
    refetchOnMount: true, // 컴포넌트 마운트 시 자동 새로고침
  });

  // 알림 설정 조회
  const { data: settingsData } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: getNotificationSettings,
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

  // 전문가 모드 알림 필터링
  const notifications = useMemo(() => {
    const allNotifications = notificationsData?.data || [];

    // 전문가 타입 알림만 필터링
    const filtered = allNotifications.filter(notification =>
      EXPERT_NOTIFICATION_TYPES.includes(notification.type)
    );

    // 디버깅 로그
    console.log('[ExpertNotificationBell] 전문가 알림 데이터:', {
      total: allNotifications.length,
      filtered: filtered.length,
      types: filtered.map(n => n.type)
    });

    return filtered;
  }, [notificationsData]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const settings = settingsData?.data;

  const handleMarkAsRead = (notificationId: number, actionUrl?: string) => {
    markAsReadMutation.mutate(notificationId);
    if (actionUrl) {
      window.location.href = actionUrl;
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

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'CONSULTATION_UPCOMING':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'REVIEW_REQUEST':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'INQUIRY_RECEIVED':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'RESERVATION_PENDING':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'SYSTEM_ADMIN':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-4 border-red-500';
      case 'MEDIUM':
        return 'border-l-4 border-yellow-500';
      case 'LOW':
        return 'border-l-4 border-blue-500';
    }
  };

  const getPriorityLabel = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return '긴급';
      case 'MEDIUM':
        return '중요';
      case 'LOW':
        return '일반';
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
      {/* 알림 벨 버튼 - 전문가 모드 스타일 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-colors text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        aria-label="알림"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
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
              <h3 className="text-lg font-semibold text-gray-900">전문가 알림</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => refetch()}
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
                    } ${getPriorityColor(notification.priority)}`}
                    onClick={() => handleMarkAsRead(notification.id, notification.actionUrl || undefined)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <span
                              className={`text-xs font-semibold ${
                                notification.priority === 'HIGH'
                                  ? 'text-red-600'
                                  : notification.priority === 'MEDIUM'
                                  ? 'text-yellow-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {getPriorityLabel(notification.priority)}
                            </span>
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
