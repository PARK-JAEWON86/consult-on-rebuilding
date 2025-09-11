'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listReservationsByUser, cancelReservation, Reservation } from '@/features/reservations/api';
import { navigateToSession } from '@/features/sessions/linkToSession';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function MyReservationsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // 임시 userId (실제로는 인증 상태에서 가져와야 함)
  const userId = 1;

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ['reservations', userId],
    queryFn: () => listReservationsByUser(userId),
  });

  const cancelReservationMutation = useMutation({
    mutationFn: cancelReservation,
    onMutate: async (displayId) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey: ['reservations', userId] });
      const previousReservations = queryClient.getQueryData(['reservations', userId]);
      
      queryClient.setQueryData(['reservations', userId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((reservation: Reservation) =>
            reservation.displayId === displayId
              ? { ...reservation, status: 'CANCELED' as const }
              : reservation
          ),
        };
      });
      
      return { previousReservations };
    },
    onError: (error, displayId, context) => {
      // 에러 시 이전 상태로 복원
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations', userId], context.previousReservations);
      }
      showToast('error', '예약 취소에 실패했습니다. 다시 시도해주세요.');
    },
    onSuccess: () => {
      showToast('success', '예약이 취소되었습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', userId] });
    },
  });

  const handleCancelReservation = (displayId: string) => {
    if (window.confirm('정말로 예약을 취소하시겠습니까?')) {
      cancelReservationMutation.mutate(displayId);
    }
  };

  const handleJoinSession = async (reservationId: number) => {
    try {
      await navigateToSession(router, reservationId);
    } catch (error) {
      showToast('error', '세션 입장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'CANCELED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '확정';
      case 'PENDING':
        return '대기중';
      case 'CANCELED':
        return '취소됨';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <main className="max-w-screen-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">내 예약</h1>
          <p className="text-gray-600">예약한 상담 일정을 확인하고 관리하세요</p>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1">
                      <Skeleton height={20} className="mb-2" />
                      <Skeleton height={16} />
                    </div>
                  </div>
                  <Skeleton height={16} className="mb-2" />
                  <Skeleton width={80} height={20} />
                </div>
                <Skeleton width={80} height={36} />
              </div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-screen-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">내 예약</h1>
          <p className="text-gray-600">예약한 상담 일정을 확인하고 관리하세요</p>
        </div>

        <Card className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">예약 정보를 불러올 수 없습니다</p>
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </Card>
      </main>
    );
  }

  const reservationList = reservations?.data || [];

  return (
    <main className="max-w-screen-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">내 예약</h1>
        <p className="text-gray-600">예약한 상담 일정을 확인하고 관리하세요</p>
      </div>

      {reservationList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-1a4 4 0 014-4h4a4 4 0 014 4v1a4 4 0 11-8 0z" />
            </svg>
            <p className="font-medium">아직 예약한 상담이 없습니다</p>
            <p className="text-sm">전문가를 찾아 상담을 예약해보세요</p>
          </div>
          <Button variant="ghost" onClick={() => window.location.href = '/experts'}>
            전문가 찾기
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservationList.map((reservation: Reservation) => (
            <Card key={reservation.displayId} hover>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        전문가 ID: {reservation.expertId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        예약 ID: {reservation.displayId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-1a4 4 0 014-4h4a4 4 0 014 4v1a4 4 0 11-8 0z" />
                      </svg>
                      <span>
                        {formatDateTime(reservation.startAt)} ~ {formatDateTime(reservation.endAt)}
                      </span>
                    </div>
                    
                    {reservation.note && (
                      <div className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span>{reservation.note}</span>
                      </div>
                    )}
                  </div>

                  <Badge variant={getStatusBadgeVariant(reservation.status)}>
                    {getStatusText(reservation.status)}
                  </Badge>
                </div>

                {reservation.status !== 'CANCELED' && (
                  <div className="ml-4 flex gap-2">
                    {reservation.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleJoinSession(reservation.id)}
                      >
                        입장
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelReservation(reservation.displayId)}
                      loading={cancelReservationMutation.isPending}
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}