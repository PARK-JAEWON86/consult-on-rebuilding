'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Filter,
  Loader2,
  CreditCard
} from 'lucide-react';

interface Reservation {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  cost: number;
  note?: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ExpertReservationManagerProps {
  expertId: number;
}

export default function ExpertReservationManager({ expertId }: ExpertReservationManagerProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELED'>('ALL');

  // 예약 목록 조회
  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['expert-reservations', expertId],
    queryFn: async () => {
      const response = await api.get('http://localhost:4000/v1/reservations', {
        params: { expertId }
      });
      return response.data;
    },
    enabled: !!expertId
  });

  // 예약 승인 뮤테이션
  const { mutate: approveReservation, isPending: isApproving } = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await api.post(
        `http://localhost:4000/v1/reservations/${displayId}/approve`,
        { expertId }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('예약을 승인했습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expert-reservations', expertId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || '승인에 실패했습니다.';
      showToast(message, 'error');
    }
  });

  // 예약 거절 뮤테이션
  const { mutate: rejectReservation, isPending: isRejecting } = useMutation({
    mutationFn: async ({ displayId, reason }: { displayId: string; reason?: string }) => {
      const response = await api.post(
        `http://localhost:4000/v1/reservations/${displayId}/reject`,
        { expertId, reason }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('예약을 거절했습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expert-reservations', expertId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || '거절에 실패했습니다.';
      showToast(message, 'error');
    }
  });

  const reservations: Reservation[] = reservationsData?.data || [];

  // 필터링된 예약
  const filteredReservations = reservations.filter(res => {
    if (statusFilter === 'ALL') return true;
    return res.status === statusFilter;
  });

  // 상태별 카운트
  const statusCounts = {
    pending: reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    canceled: reservations.filter(r => r.status === 'CANCELED').length
  };

  const handleApprove = (displayId: string) => {
    if (confirm('이 예약을 승인하시겠습니까?')) {
      approveReservation(displayId);
    }
  };

  const handleReject = (displayId: string) => {
    const reason = prompt('거절 사유를 입력하세요 (선택):');
    if (reason !== null) {
      rejectReservation({ displayId, reason: reason.trim() || undefined });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="yellow">승인 대기</Badge>;
      case 'CONFIRMED':
        return <Badge variant="green">확정</Badge>;
      case 'CANCELED':
        return <Badge variant="gray">취소됨</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 및 필터 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-900">예약 요청 관리</h1>
            </div>
            <p className="text-blue-700 mt-1">
              클라이언트의 예약 요청을 확인하고 승인 또는 거절할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체 ({reservations.length})</option>
              <option value="PENDING">승인 대기 ({statusCounts.pending})</option>
              <option value="CONFIRMED">확정 ({statusCounts.confirmed})</option>
              <option value="CANCELED">취소됨 ({statusCounts.canceled})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">승인 대기</p>
              <p className="text-3xl font-bold text-yellow-900">{statusCounts.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">확정된 예약</p>
              <p className="text-3xl font-bold text-green-900">{statusCounts.confirmed}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">취소된 예약</p>
              <p className="text-3xl font-bold text-gray-900">{statusCounts.canceled}</p>
            </div>
            <XCircle className="h-10 w-10 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* 예약 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">예약 목록 로딩 중...</span>
        </div>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">예약이 없습니다</p>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter === 'ALL' ? '아직 받은 예약이 없습니다.' : `${statusFilter} 상태의 예약이 없습니다.`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const { date, time } = formatDateTime(reservation.startAt);
            const endTime = formatDateTime(reservation.endAt).time;
            const duration = Math.round(
              (new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / (1000 * 60)
            );

            return (
              <Card key={reservation.displayId}>
                <div className="flex items-start justify-between">
                  {/* 예약 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {/* 사용자 아바타 */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {reservation.user.name?.charAt(0) || 'U'}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{reservation.user.name}</h3>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <p className="text-sm text-gray-600">{reservation.user.email}</p>
                      </div>
                    </div>

                    {/* 예약 상세 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-15 mt-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{date}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">
                          {time} ~ {endTime} ({duration}분)
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{reservation.cost.toLocaleString()} 크레딧</span>
                      </div>
                    </div>

                    {/* 요청사항 */}
                    {reservation.note && (
                      <div className="mt-4 pl-15">
                        <div className="flex items-start">
                          <MessageCircle className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">요청사항</p>
                            <p className="text-sm text-gray-600 mt-1">{reservation.note}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {reservation.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(reservation.displayId)}
                        disabled={isApproving || isRejecting}
                        className="whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(reservation.displayId)}
                        disabled={isApproving || isRejecting}
                        className="whitespace-nowrap"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        거절
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
