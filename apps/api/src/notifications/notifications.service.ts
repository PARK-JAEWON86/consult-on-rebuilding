import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface UpdateNotificationSettingsDto {
  upcomingReservations?: boolean;
  creditLow?: boolean;
  reviewRequests?: boolean;
  consultationCompleted?: boolean;
  systemNotifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // 알림 생성
  async createNotification(dto: CreateNotificationDto) {
    const displayId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.prisma.notification.create({
      data: {
        displayId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {},
        priority: dto.priority || 'MEDIUM',
        actionUrl: dto.actionUrl,
        expiresAt: dto.expiresAt,
      },
    });
  }

  // 사용자의 알림 목록 조회
  async getUserNotifications(userId: number, options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [
          { isRead: 'asc' }, // 읽지 않은 것 먼저
          { priority: 'desc' }, // 우선순위 높은 것
          { createdAt: 'desc' }, // 최신순
        ],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      unreadCount: await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      }),
    };
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // 알림 삭제
  async deleteNotification(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // 사용자 알림 설정 조회
  async getUserSettings(userId: number) {
    // ✅ userId 검증 - undefined나 null 방어
    if (!userId || typeof userId !== 'number') {
      throw new Error(`Invalid userId: ${userId}. Cannot retrieve notification settings.`);
    }

    let settings = await this.prisma.userNotificationSetting.findUnique({
      where: { userId },
    });

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await this.prisma.userNotificationSetting.create({
        data: { userId },
      });
    }

    return settings;
  }

  // 사용자 알림 설정 업데이트
  async updateUserSettings(userId: number, dto: UpdateNotificationSettingsDto) {
    return this.prisma.userNotificationSetting.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }

  // 다가오는 예약 알림 생성 (크론잡에서 호출)
  async createUpcomingReservationNotifications() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 24시간 이내 시작되는 예약 조회
    const upcomingReservations = await this.prisma.reservation.findMany({
      where: {
        startAt: {
          gte: now,
          lte: in24Hours,
        },
        status: 'CONFIRMED',
      },
      include: {
        user: true,
        expert: true,
      },
    });

    const notifications = [];

    for (const reservation of upcomingReservations) {
      // 사용자 설정 확인
      const settings = await this.getUserSettings(reservation.userId);
      if (!settings.upcomingReservations) continue;

      // 이미 알림이 생성되었는지 확인
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: reservation.userId,
          type: 'CONSULTATION_UPCOMING',
          data: {
            path: '$.reservationId',
            equals: reservation.id,
          },
        },
      });

      if (existing) continue;

      const hoursDiff = Math.floor(
        (reservation.startAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      const priority: NotificationPriority =
        hoursDiff < 2 ? 'HIGH' :
        hoursDiff < 12 ? 'MEDIUM' : 'LOW';

      const notification = await this.createNotification({
        userId: reservation.userId,
        type: 'CONSULTATION_UPCOMING',
        title: '다가오는 상담',
        message: `${reservation.expert.name}님과의 상담이 ${hoursDiff}시간 후 시작됩니다`,
        data: { reservationId: reservation.id },
        priority,
        actionUrl: `/dashboard/consultations/${reservation.id}`,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  // 크레딧 부족 알림 생성
  async createLowCreditNotification(userId: number, balance: number) {
    const settings = await this.getUserSettings(userId);
    if (!settings.creditLow) return null;

    // 이미 알림이 있는지 확인 (24시간 이내)
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: 'CREDIT_LOW',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) return null;

    return this.createNotification({
      userId,
      type: 'CREDIT_LOW',
      title: '크레딧 잔액 부족',
      message: `현재 잔액: ${balance.toLocaleString()}원. 충전이 필요합니다.`,
      priority: balance < 100 ? 'HIGH' : 'MEDIUM',
      actionUrl: '/dashboard/credits',
    });
  }

  // 리뷰 요청 알림 생성
  async createReviewRequestNotifications() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 완료된 예약 중 리뷰가 없는 것 조회
    const completedReservations = await this.prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        endAt: {
          gte: twentyFourHoursAgo,
          lte: twoHoursAgo,
        },
      },
      include: {
        user: true,
        expert: true,
      },
    });

    const notifications = [];

    for (const reservation of completedReservations) {
      // 리뷰 존재 여부 확인
      const review = await this.prisma.review.findUnique({
        where: { reservationId: reservation.id },
      });

      if (review) continue;

      // 사용자 설정 확인
      const settings = await this.getUserSettings(reservation.userId);
      if (!settings.reviewRequests) continue;

      // 이미 알림이 있는지 확인
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: reservation.userId,
          type: 'REVIEW_REQUEST',
          data: {
            path: '$.reservationId',
            equals: reservation.id,
          },
        },
      });

      if (existing) continue;

      const notification = await this.createNotification({
        userId: reservation.userId,
        type: 'REVIEW_REQUEST',
        title: '리뷰를 남겨주세요',
        message: `${reservation.expert.name}님과의 상담은 어떠셨나요?`,
        data: { reservationId: reservation.id },
        priority: 'LOW',
        actionUrl: `/dashboard/consultations/${reservation.id}/review`,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  // ==========================================
  // 문의 관련 알림
  // ==========================================

  /**
   * 전문가: 새 문의 접수 알림
   */
  async createInquiryReceivedNotification(
    expertUserId: number,
    inquiryId: string,
    clientName: string,
    subject: string
  ) {
    const settings = await this.getUserSettings(expertUserId);
    if (!settings.systemNotifications) return null;

    return this.createNotification({
      userId: expertUserId,
      type: 'INQUIRY_RECEIVED',
      title: '새로운 문의가 도착했습니다',
      message: `${clientName}님이 "${subject}" 주제로 문의를 남겼습니다`,
      data: { inquiryId },
      priority: 'MEDIUM',
      actionUrl: `/dashboard/expert/inquiries/${inquiryId}`,
    });
  }

  /**
   * 사용자: 문의 답변 알림
   */
  async createInquiryReplyNotification(
    clientUserId: number,
    inquiryId: string,
    expertName: string,
    subject: string
  ) {
    const settings = await this.getUserSettings(clientUserId);
    if (!settings.systemNotifications) return null;

    return this.createNotification({
      userId: clientUserId,
      type: 'INQUIRY_REPLY',
      title: '문의에 대한 답변이 도착했습니다',
      message: `${expertName}님이 "${subject}" 문의에 답변했습니다`,
      data: { inquiryId },
      priority: 'HIGH',
      actionUrl: `/dashboard/inquiries/${inquiryId}`,
    });
  }

  // ==========================================
  // 예약 관련 알림
  // ==========================================

  /**
   * 전문가: 새 예약 대기 알림
   */
  async createReservationPendingNotification(
    expertUserId: number,
    reservationId: string,
    clientName: string,
    startAt: Date
  ) {
    const settings = await this.getUserSettings(expertUserId);
    if (!settings.upcomingReservations) return null;

    return this.createNotification({
      userId: expertUserId,
      type: 'RESERVATION_PENDING',
      title: '새로운 예약 요청',
      message: `${clientName}님의 예약 요청이 있습니다 (${startAt.toLocaleString('ko-KR')})`,
      data: { reservationId },
      priority: 'HIGH',
      actionUrl: `/dashboard/expert/reservations`,
    });
  }

  /**
   * 사용자: 예약 승인 알림
   */
  async createReservationApprovedNotification(
    clientUserId: number,
    reservationId: string,
    expertName: string,
    startAt: Date
  ) {
    const settings = await this.getUserSettings(clientUserId);
    if (!settings.upcomingReservations) return null;

    return this.createNotification({
      userId: clientUserId,
      type: 'RESERVATION_APPROVED',
      title: '예약이 승인되었습니다',
      message: `${expertName}님이 예약을 승인했습니다 (${startAt.toLocaleString('ko-KR')})`,
      data: { reservationId },
      priority: 'HIGH',
      actionUrl: `/dashboard/consultations/${reservationId}`,
    });
  }

  /**
   * 사용자: 예약 거절 알림
   */
  async createReservationRejectedNotification(
    clientUserId: number,
    reservationId: string,
    expertName: string,
    reason?: string
  ) {
    const settings = await this.getUserSettings(clientUserId);
    if (!settings.upcomingReservations) return null;

    return this.createNotification({
      userId: clientUserId,
      type: 'RESERVATION_REJECTED',
      title: '예약이 거절되었습니다',
      message: `${expertName}님이 예약을 거절했습니다${reason ? `: ${reason}` : ''}`,
      data: { reservationId },
      priority: 'HIGH',
      actionUrl: `/dashboard/consultations`,
    });
  }

  // ==========================================
  // 전문가 지원 관련 알림
  // ==========================================

  /**
   * 사용자: 전문가 지원 상태 변경 알림
   */
  async createExpertApplicationUpdateNotification(
    userId: number,
    status: string,
    message: string
  ) {
    return this.createNotification({
      userId,
      type: 'EXPERT_APPLICATION_UPDATE',
      title: '전문가 지원 상태 업데이트',
      message,
      data: { status },
      priority: status === 'APPROVED' ? 'HIGH' : 'MEDIUM',
      actionUrl: status === 'APPROVED'
        ? '/dashboard/expert'
        : status === 'ADDITIONAL_INFO_REQUESTED'
        ? '/experts/become'
        : '/experts/application-status',
    });
  }

  // ==========================================
  // 관리자 시스템 알림
  // ==========================================

  /**
   * 관리자: 모든 사용자에게 시스템 공지
   */
  async createSystemAdminNotification(
    title: string,
    message: string,
    targetUserIds?: number[],
    priority: NotificationPriority = 'MEDIUM',
    actionUrl?: string
  ) {
    const userIds = targetUserIds || await this.getAllUserIds();

    const notifications = userIds.map(userId =>
      this.createNotification({
        userId,
        type: 'SYSTEM_ADMIN',
        title,
        message,
        priority,
        actionUrl,
      })
    );

    return Promise.all(notifications);
  }

  private async getAllUserIds(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      select: { id: true }
    });
    return users.map(u => u.id);
  }
}
