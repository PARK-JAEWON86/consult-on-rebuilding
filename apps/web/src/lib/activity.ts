import type { Reservation } from './reservations';
import type { CreditTransaction } from './credits';

export interface ActivityItem {
  id: string;
  type: 'consultation_completed' | 'consultation_scheduled' | 'credit_purchased' | 'review_written' | 'reservation_cancelled';
  title: string;
  description: string;
  timestamp: string;
  expertName?: string;
  reservationId?: number;
  credits?: number;
  rating?: number;
}

/**
 * 예약 데이터를 활동 아이템으로 변환
 */
export function reservationsToActivities(reservations: Reservation[]): ActivityItem[] {
  return reservations.map((reservation) => {
    const isCompleted = reservation.status === 'COMPLETED';
    const isCancelled = reservation.status === 'CANCELLED';

    let type: ActivityItem['type'];
    let title: string;
    let description: string;

    if (isCompleted) {
      type = 'consultation_completed';
      title = '상담 완료';
      description = `${reservation.expertName}님과의 상담을 완료했습니다`;
    } else if (isCancelled) {
      type = 'reservation_cancelled';
      title = '예약 취소';
      description = `${reservation.expertName}님과의 상담이 취소되었습니다`;
    } else {
      type = 'consultation_scheduled';
      title = '상담 예약';
      description = `${reservation.expertName}님과의 상담이 예약되었습니다`;
    }

    return {
      id: `reservation-${reservation.id}`,
      type,
      title,
      description,
      timestamp: reservation.createdAt,
      expertName: reservation.expertName,
      reservationId: reservation.id,
    };
  });
}

/**
 * 활동을 시간순으로 정렬 (최신순)
 */
export function sortActivitiesByDate(activities: ActivityItem[]): ActivityItem[] {
  return activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 크레딧 거래를 활동 아이템으로 변환
 */
export function creditTransactionsToActivities(transactions: CreditTransaction[]): ActivityItem[] {
  return transactions.map((transaction) => {
    let title: string;
    let description: string;

    if (transaction.type === 'PURCHASE') {
      title = '크레딧 구매';
      description = `${transaction.amount.toLocaleString()} 크레딧을 구매했습니다`;
    } else if (transaction.type === 'REFUND') {
      title = '크레딧 환불';
      description = `${transaction.amount.toLocaleString()} 크레딧이 환불되었습니다`;
    } else {
      title = '크레딧 사용';
      description = transaction.description;
    }

    return {
      id: `credit-${transaction.id}`,
      type: 'credit_purchased',
      title,
      description,
      timestamp: transaction.createdAt,
      credits: transaction.amount,
      expertName: transaction.expertName,
    };
  });
}

/**
 * 여러 소스의 활동을 병합
 */
export function mergeActivities(...activityGroups: ActivityItem[][]): ActivityItem[] {
  const merged = activityGroups.flat();
  return sortActivitiesByDate(merged);
}
