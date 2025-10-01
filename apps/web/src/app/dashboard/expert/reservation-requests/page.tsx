'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface ReservationRequest {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  note?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name?: string;
    email: string;
    avatarUrl?: string;
  };
  client?: {
    id: number;
    name?: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ReservationStats {
  pending: number;
  confirmed: number;
  canceled: number;
  totalRevenue: number;
}

export default function ReservationRequestsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReservationRequest['status']>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user || !user.roles?.includes('EXPERT')) return;

      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(filter !== 'all' && { status: filter }),
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
        const [reservationsResponse, statsResponse] = await Promise.all([
          fetch(`${apiUrl}/reservation-requests?${queryParams}`, {
            credentials: 'include', // 쿠키를 포함하여 전송
          }),
          fetch(`${apiUrl}/reservation-requests/stats`, {
            credentials: 'include', // 쿠키를 포함하여 전송
          }),
        ]);

        if (!reservationsResponse.ok || !statsResponse.ok) {
          console.error('API Response Status:', {
            reservations: reservationsResponse.status,
            stats: statsResponse.status
          });

          const errorText1 = await reservationsResponse.text();
          const errorText2 = await statsResponse.text();

          console.error('API Error Details:', {
            reservationsError: errorText1,
            statsError: errorText2
          });

          throw new Error(`API 요청 실패 - Reservations: ${reservationsResponse.status}, Stats: ${statsResponse.status}`);
        }

        const reservationsData = await reservationsResponse.json();
        const statsData = await statsResponse.json();

        setRequests(reservationsData.data || []);
        setStats(statsData);
      } catch (error) {
        console.error('예약 요청 로드 실패:', error);
        console.error('Error details:', {
          message: (error as Error).message,
          user: user,
          userRoles: user?.roles
        });
        alert(`데이터를 가져오는데 실패했습니다: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadRequests();
    }
  }, [user, filter, page]);

  const handleApproveRequest = async (requestDisplayId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiUrl}/reservation-requests/${requestDisplayId}/status`, {
        method: 'PUT',
        credentials: 'include', // 쿠키를 포함하여 전송
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
        }),
      });

      if (!response.ok) {
        throw new Error('예약 승인에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setRequests(prev =>
        prev.map(req =>
          req.displayId === requestDisplayId ? { ...req, status: 'CONFIRMED' } : req
        )
      );

      // 통계 다시 로드
      if (stats) {
        setStats({
          ...stats,
          pending: stats.pending - 1,
          confirmed: stats.confirmed + 1,
        });
      }

      alert('예약 요청이 승인되었습니다.');
    } catch (error) {
      console.error('예약 승인 실패:', error);
      alert('예약 승인에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (requestDisplayId: string) => {
    const reason = prompt('거절 사유를 입력해주세요 (선택사항):');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiUrl}/reservation-requests/${requestDisplayId}/status`, {
        method: 'PUT',
        credentials: 'include', // 쿠키를 포함하여 전송
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELED',
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('예약 거절에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setRequests(prev =>
        prev.map(req =>
          req.displayId === requestDisplayId ? { ...req, status: 'CANCELED', note: reason || req.note } : req
        )
      );

      // 통계 다시 로드
      if (stats) {
        setStats({
          ...stats,
          pending: stats.pending - 1,
          canceled: stats.canceled + 1,
        });
      }

      alert('예약 요청이 거절되었습니다.');
    } catch (error) {
      console.error('예약 거절 실패:', error);
      alert('예약 거절에 실패했습니다.');
    }
  };

  const filteredRequests = useMemo<ReservationRequest[]>(() => {
    if (!requests || !Array.isArray(requests)) return [];
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  }, [requests, filter]);

  const getStatusBadge = (status: ReservationRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">대기중</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">승인됨</span>;
      case 'CANCELED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">취소됨</span>;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getDuration = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // minutes
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">예약 요청 관리</h1>
          <p className="text-blue-700 mt-1">
            고객들의 상담 예약 요청을 확인하고 승인하세요
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | ReservationRequest['status'])}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="PENDING">대기중</option>
            <option value="CONFIRMED">승인됨</option>
            <option value="CANCELED">취소됨</option>
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">대기 중인 요청</p>
              <p className="text-2xl font-bold text-yellow-900">
                {stats?.pending || 0}건
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">승인된 요청</p>
              <p className="text-2xl font-bold text-green-900">
                {stats?.confirmed || 0}건
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">총 수익</p>
              <p className="text-2xl font-bold text-blue-900">
                ₩{stats?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 요청 목록 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">예약 요청 목록</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {filter === 'all' ? '예약 요청이 없습니다.' : `${filter === 'PENDING' ? '대기중인' : filter === 'CONFIRMED' ? '승인된' : '취소된'} 요청이 없습니다.`}
            </div>
          ) : (
            filteredRequests.map((request) => {
              const clientName = request.user?.name || request.client?.name || '고객';
              const clientEmail = request.user?.email || request.client?.email || '';
              const startDateTime = formatDateTime(request.startAt);
              const endDateTime = formatDateTime(request.endAt);
              const duration = getDuration(request.startAt, request.endAt);

              return (
                <div key={request.displayId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{clientName}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">₩{request.cost.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{duration}분</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">예약 ID: <span className="font-medium">{request.displayId}</span></p>
                          <p className="text-sm text-gray-600">이메일: <span className="font-medium">{clientEmail}</span></p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">예약 날짜: <span className="font-medium">{startDateTime.date}</span></p>
                          <p className="text-sm text-gray-600">예약 시간: <span className="font-medium">{startDateTime.time} - {endDateTime.time}</span></p>
                          <p className="text-sm text-gray-600">신청일: <span className="font-medium">{new Date(request.createdAt).toLocaleDateString('ko-KR')}</span></p>
                        </div>
                      </div>
                      {request.note && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">메모:</p>
                          <p className="text-sm bg-gray-50 p-3 rounded-md">{request.note}</p>
                        </div>
                      )}
                      {request.status === 'PENDING' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveRequest(request.displayId)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.displayId)}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}