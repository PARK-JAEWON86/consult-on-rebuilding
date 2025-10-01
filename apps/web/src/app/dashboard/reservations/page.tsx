'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { listReservationsByUser, Reservation } from '@/features/reservations/api';
import { ensureSession } from '@/lib/sessions';
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Phone,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function ReservationsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 예약 데이터 로드
  const { data: reservationsData, isLoading, error } = useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: () => listReservationsByUser(Number(user?.id) || 0),
    enabled: !!user?.id && isAuthenticated,
  });

  const reservations: Reservation[] = reservationsData?.data || [];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/reservations');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  // 상담 시작
  const handleStartConsultation = async (reservation: Reservation) => {
    try {
      // 세션 생성 또는 확인
      const sessionData = await ensureSession(reservation.id);
      
      // 상담 세션 페이지로 이동
      router.push(`/sessions/${sessionData.displayId}`);
    } catch (error) {
      console.error('상담 세션 시작 실패:', error);
      alert('상담을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  // 상태에 따른 아이콘과 색상
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: '대기중' };
      case 'CONFIRMED':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', text: '확정됨' };
      case 'CANCELED':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', text: '취소됨' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', text: '알 수 없음' };
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "내일";
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  // 상담 시간 계산
  const getDuration = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60));
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">내 예약</h1>
        <p className="text-gray-600">
          나의 상담 예약 내역을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <div className="space-y-6">

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">예약 정보를 불러오는 중...</p>
          </div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">예약 내역이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              아직 예약한 상담이 없습니다. 전문가를 찾아 상담을 예약해보세요.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/experts')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                전문가 찾기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 예약 목록 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">예약 목록</h2>
            {reservations.map((reservation) => {
              const statusInfo = getStatusInfo(reservation.status);
              const StatusIcon = statusInfo.icon;
              const duration = getDuration(reservation.startAt, reservation.endAt);
              
              return (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${
                    selectedReservation?.id === reservation.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            전문가 {reservation.expertId}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            전문가 {reservation.expertId} 상담
                          </h3>
                          <p className="text-xs text-gray-500">{duration}분 상담</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(reservation.startAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{formatTime(reservation.startAt)}</span>
                        </div>
                      </div>
                      
                      {reservation.note && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {reservation.note}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.text}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {reservation.cost} 크레딧
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 선택된 예약 상세 정보 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">예약 상세</h2>
            {selectedReservation ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      전문가 {selectedReservation.expertId} 상담
                    </h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <Video className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">화상 상담</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">
                        {getDuration(selectedReservation.startAt, selectedReservation.endAt)}분
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">상담 일시</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedReservation.startAt)} {formatTime(selectedReservation.startAt)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">상담료</label>
                      <p className="text-sm text-gray-900">{selectedReservation.cost} 크레딧</p>
                    </div>
                    
                    {selectedReservation.note && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">상담 내용</label>
                        <p className="text-sm text-gray-900">{selectedReservation.note}</p>
                      </div>
                    )}
                  </div>

                  {selectedReservation.status === 'CONFIRMED' && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleStartConsultation(selectedReservation)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        상담 시작하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">예약을 선택해주세요</h3>
                <p className="mt-1 text-sm text-gray-500">
                  왼쪽에서 예약을 선택하면 상세 정보를 확인할 수 있습니다
                </p>
              </div>
            )}
        </div>
      </div>
      )}
      </div>
    </div>
  );
}

