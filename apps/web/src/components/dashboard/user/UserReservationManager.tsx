'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthProvider';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Calendar, Clock, User, X, AlertCircle, CheckCircle } from 'lucide-react';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';

interface Reservation {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  duration: number;
  cost: number;
  status: ReservationStatus;
  notes?: string;
  canceledAt?: string;
  createdAt: string;
  expert: {
    id: number;
    name: string;
    displayId: string;
  };
}

const statusConfig = {
  PENDING: { label: '승인 대기', color: 'yellow' as const, icon: Clock },
  CONFIRMED: { label: '예약 확정', color: 'green' as const, icon: CheckCircle },
  CANCELED: { label: '취소됨', color: 'red' as const, icon: X },
  COMPLETED: { label: '완료', color: 'blue' as const, icon: CheckCircle }
};

export default function UserReservationManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // 예약 목록 조회
  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['user-reservations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await api.get(`http://localhost:4000/v1/reservations?userId=${user.id}`);
      return response.data.data || [];
    },
    enabled: !!user?.id
  });

  // 취소 mutation
  const cancelMutation = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await api.delete(`http://localhost:4000/v1/reservations/${displayId}`, {
        data: { userId: user?.id }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });

      const refundInfo = data.data?.refundInfo;
      if (refundInfo) {
        showToast(
          `예약이 취소되었습니다. ${refundInfo.refundAmount.toLocaleString()} 크레딧이 환불되었습니다 (${refundInfo.refundRate}%)`,
          'success'
        );
      } else {
        showToast('예약이 취소되었습니다', 'success');
      }
      setCancelingId(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '예약 취소에 실패했습니다';
      showToast(message, 'error');
      setCancelingId(null);
    }
  });

  const handleCancel = (displayId: string) => {
    if (window.confirm('정말 예약을 취소하시겠습니까?\n\n취소 정책:\n- 24시간 전: 100% 환불\n- 24시간 이내: 50% 환불\n- 예약 시작 후: 취소 불가')) {
      setCancelingId(displayId);
      cancelMutation.mutate(displayId);
    }
  };

  const reservations: Reservation[] = reservationsData || [];

  const filteredReservations = statusFilter === 'ALL'
    ? reservations
    : reservations.filter(r => r.status === statusFilter);

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    canceled: reservations.filter(r => r.status === 'CANCELED').length
  };

  const getRefundInfo = (reservation: Reservation) => {
    if (reservation.status !== 'PENDING' && reservation.status !== 'CONFIRMED') {
      return null;
    }

    const now = new Date();
    const startAt = new Date(reservation.startAt);
    const hoursUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 0) {
      return { canCancel: false, message: '예약 시작 후에는 취소할 수 없습니다', refundRate: 0 };
    } else if (hoursUntilStart < 24) {
      return {
        canCancel: true,
        message: '50% 환불',
        refundRate: 50,
        refundAmount: Math.floor(reservation.cost * 0.5)
      };
    } else {
      return {
        canCancel: true,
        message: '100% 환불',
        refundRate: 100,
        refundAmount: reservation.cost
      };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 예약 관리</h2>
        <p className="text-sm text-gray-600 mt-1">전문가 상담 예약 현황을 확인하고 관리할 수 있습니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 예약</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">예약 확정</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">취소됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
            </div>
            <X className="h-8 w-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('ALL')}
          className="text-sm"
        >
          전체 ({stats.total})
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('PENDING')}
          className="text-sm"
        >
          승인 대기 ({stats.pending})
        </Button>
        <Button
          variant={statusFilter === 'CONFIRMED' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('CONFIRMED')}
          className="text-sm"
        >
          예약 확정 ({stats.confirmed})
        </Button>
        <Button
          variant={statusFilter === 'CANCELED' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('CANCELED')}
          className="text-sm"
        >
          취소됨 ({stats.canceled})
        </Button>
      </div>

      {/* 예약 목록 */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {statusFilter === 'ALL'
                ? '예약 내역이 없습니다'
                : `${statusConfig[statusFilter as ReservationStatus].label} 예약이 없습니다`}
            </p>
          </Card>
        ) : (
          filteredReservations.map((reservation) => {
            const config = statusConfig[reservation.status];
            const StatusIcon = config.icon;
            const refundInfo = getRefundInfo(reservation);

            return (
              <Card key={reservation.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* 예약 정보 */}
                  <div className="flex-1 space-y-3">
                    {/* 전문가 정보 */}
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{reservation.expert.name}</p>
                        <p className="text-sm text-gray-500">@{reservation.expert.displayId}</p>
                      </div>
                    </div>

                    {/* 일정 정보 */}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(reservation.endAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} ({reservation.duration}분)
                        </p>
                      </div>
                    </div>

                    {/* 비용 */}
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <span className="text-gray-600">비용: </span>
                        <span className="font-medium text-gray-900">{reservation.cost.toLocaleString()} 크레딧</span>
                      </div>
                    </div>

                    {/* 메모 */}
                    {reservation.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{reservation.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* 상태 및 액션 */}
                  <div className="flex flex-col items-end space-y-3 min-w-[160px]">
                    {/* 상태 배지 */}
                    <Badge color={config.color} className="flex items-center space-x-1">
                      <StatusIcon className="h-4 w-4" />
                      <span>{config.label}</span>
                    </Badge>

                    {/* 환불 정보 */}
                    {refundInfo && refundInfo.canCancel && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">취소 시</p>
                        <p className="text-sm font-medium text-gray-900">
                          {refundInfo.refundAmount?.toLocaleString()} 크레딧 환불
                        </p>
                        <p className="text-xs text-gray-500">({refundInfo.message})</p>
                      </div>
                    )}

                    {/* 취소 버튼 */}
                    {refundInfo && refundInfo.canCancel && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(reservation.displayId)}
                        disabled={cancelingId === reservation.displayId}
                        className="w-full text-sm"
                      >
                        {cancelingId === reservation.displayId ? '취소 중...' : '예약 취소'}
                      </Button>
                    )}

                    {/* 취소 불가 안내 */}
                    {refundInfo && !refundInfo.canCancel && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p className="text-xs text-red-800 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {refundInfo.message}
                        </p>
                      </div>
                    )}

                    {/* 예약 ID */}
                    <p className="text-xs text-gray-400">#{reservation.displayId}</p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
