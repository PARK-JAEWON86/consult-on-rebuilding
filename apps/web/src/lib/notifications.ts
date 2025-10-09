import { api } from './api';

export interface Notification {
  id: number;
  displayId: string;
  userId: number;
  type: 'CONSULTATION_UPCOMING' | 'CONSULTATION_COMPLETED' | 'CREDIT_LOW' | 'REVIEW_REQUEST' | 'SYSTEM';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl?: string;
  expiresAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: number;
  userId: number;
  upcomingReservations: boolean;
  creditLow: boolean;
  reviewRequests: boolean;
  consultationCompleted: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface SettingsResponse {
  success: boolean;
  data: NotificationSettings;
}

// 알림 목록 조회
export async function getNotifications(params?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const r = await api.get(`/notifications?${searchParams.toString()}`);
  return r.data as NotificationsResponse;
}

// 읽지 않은 알림 개수
export async function getUnreadCount() {
  const r = await api.get('/notifications/unread-count');
  return r.data as UnreadCountResponse;
}

// 알림 읽음 처리
export async function markAsRead(notificationId: number) {
  const r = await api.patch(`/notifications/${notificationId}/read`);
  return r.data as { success: boolean; message: string };
}

// 모든 알림 읽음 처리
export async function markAllAsRead() {
  const r = await api.post('/notifications/mark-all-read');
  return r.data as { success: boolean; message: string };
}

// 알림 삭제
export async function deleteNotification(notificationId: number) {
  const r = await api.delete(`/notifications/${notificationId}`);
  return r.data as { success: boolean; message: string };
}

// 알림 설정 조회
export async function getNotificationSettings() {
  const r = await api.get('/notifications/settings');
  return r.data as SettingsResponse;
}

// 알림 설정 업데이트
export async function updateNotificationSettings(settings: Partial<NotificationSettings>) {
  const r = await api.patch('/notifications/settings', settings);
  return r.data as SettingsResponse;
}
