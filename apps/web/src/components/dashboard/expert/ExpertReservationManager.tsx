'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ApproveModal, RejectModal, DeleteModal } from './ReservationActionModals';
import ViewModeSwitcher, { ViewMode } from '@/components/reservation/ViewModeSwitcher';
import SearchBar from '@/components/reservation/SearchBar';
import AdvancedFilter from '@/components/reservation/AdvancedFilter';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Loader2,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Trash2,
  User
} from 'lucide-react';

interface Reservation {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'REJECTED' | 'COMPLETED' | 'NO_SHOW';
  cost: number;
  note?: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  expertName?: string;
}

interface ExpertReservationManagerProps {
  expertId: number;
}

export default function ExpertReservationManager({ expertId }: ExpertReservationManagerProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // UI 상태
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 예약 액션 상태
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setViewMode('card');
            break;
          case '2':
            e.preventDefault();
            setViewMode('table');
            break;
          case '3':
            e.preventDefault();
            setViewMode('split');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 예약 목록 조회
  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['expert-reservations', expertId],
    queryFn: async () => {
      const response = await api.get('/reservations', {
        params: { expertId }
      });
      return response;
    },
    enabled: !!expertId
  });

  // 예약 승인 뮤테이션
  const { mutate: approveReservation, isPending: isApproving } = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await api.post(
        `/reservations/${displayId}/approve`,
        { expertId }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('예약을 승인했습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expert-reservations', expertId] });
      setApproveModalOpen(false);
      setSelectedReservation(null);
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
        `/reservations/${displayId}/reject`,
        { expertId, reason }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('예약을 거절했습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expert-reservations', expertId] });
      setRejectModalOpen(false);
      setSelectedReservation(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || '거절에 실패했습니다.';
      showToast(message, 'error');
    }
  });

  // 예약 삭제 뮤테이션 (취소된 예약만)
  const { mutate: deleteReservation, isPending: isDeleting } = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await api.delete(`/reservations/${displayId}`, {
        data: { expertId: expertId }
      });
      return response.data;
    },
    onSuccess: () => {
      showToast('예약이 삭제되었습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expert-reservations', expertId] });
      setDeleteModalOpen(false);
      setSelectedReservation(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || '삭제에 실패했습니다.';
      showToast(message, 'error');
    }
  });

  const reservations: Reservation[] = reservationsData?.data || [];

  // 필터링 및 검색
  const filteredReservations = reservations
    .filter(r => {
      // 상태 필터
      if (statusFilter === 'ALL') {
        return r.status !== 'CANCELED';
      }
      if (r.status !== statusFilter) return false;

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !r.user.name.toLowerCase().includes(query) &&
          !r.displayId.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 날짜 범위 필터
      if (advancedFilters.dateRange?.start && advancedFilters.dateRange?.end) {
        const startAt = new Date(r.startAt);
        const filterStart = new Date(advancedFilters.dateRange.start);
        const filterEnd = new Date(advancedFilters.dateRange.end);
        if (startAt < filterStart || startAt > filterEnd) return false;
      }

      // 가격 범위 필터
      if (advancedFilters.priceRange?.min && r.cost < advancedFilters.priceRange.min) return false;
      if (advancedFilters.priceRange?.max && r.cost > advancedFilters.priceRange.max) return false;

      // 사용자 이름 필터
      if (advancedFilters.expertName) {
        if (!r.user.name.toLowerCase().includes(advancedFilters.expertName.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
          break;
        case 'price':
          comparison = a.cost - b.cost;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 상태별 카운트
  const statusCounts = {
    pending: reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    canceled: reservations.filter(r => r.status === 'CANCELED').length,
    rejected: reservations.filter(r => r.status === 'REJECTED').length
  };

  const handleApproveClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setApproveModalOpen(true);
  };

  const handleRejectClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setRejectModalOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedReservation) {
      approveReservation(selectedReservation.displayId);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    if (selectedReservation) {
      rejectReservation({ displayId: selectedReservation.displayId, reason });
    }
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedReservation) {
      deleteReservation(selectedReservation.displayId);
    }
  };

  const handleSort = (field: 'date' | 'price' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
      case 'REJECTED':
        return <Badge variant="red">거절됨</Badge>;
      case 'COMPLETED':
        return <Badge variant="blue">완료됨</Badge>;
      case 'NO_SHOW':
        return <Badge variant="gray">미출석</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">예약 목록 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
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
        <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* 통계 카드 - 클릭 가능 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'PENDING'
              ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400'
              : 'bg-yellow-50 border-yellow-200'
          }`}
          onClick={() => setStatusFilter('PENDING')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">승인 대기</p>
              <p className="text-3xl font-bold text-yellow-900">{statusCounts.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'CONFIRMED'
              ? 'bg-green-100 border-green-400 ring-2 ring-green-400'
              : 'bg-green-50 border-green-200'
          }`}
          onClick={() => setStatusFilter('CONFIRMED')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">확정된 예약</p>
              <p className="text-3xl font-bold text-green-900">{statusCounts.confirmed}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'CANCELED'
              ? 'bg-gray-200 border-gray-400 ring-2 ring-gray-400'
              : 'bg-gray-50 border-gray-200'
          }`}
          onClick={() => setStatusFilter('CANCELED')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">취소된 예약</p>
              <p className="text-3xl font-bold text-gray-900">{statusCounts.canceled}</p>
            </div>
            <XCircle className="h-10 w-10 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="클라이언트 이름 또는 예약 ID로 검색..."
          />
        </div>
        <AdvancedFilter
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
        />
      </div>

      {/* 뷰 모드별 렌더링 */}
      {viewMode === 'card' && (
        <div className="space-y-3">
          {filteredReservations.length === 0 ? (
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
            filteredReservations.map((reservation) => {
              const { date, time } = formatDateTime(reservation.startAt);
              const endTime = formatDateTime(reservation.endAt).time;
              const duration = Math.round(
                (new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / (1000 * 60)
              );

              return (
                <Card key={reservation.displayId} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* 사용자 아바타 */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {reservation.user.name?.charAt(0) || 'U'}
                    </div>

                    {/* 예약 정보 */}
                    <div className="flex-1 space-y-3">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{reservation.user.name}</h3>
                          <p className="text-sm text-gray-500">{reservation.user.email}</p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>

                      {/* 일정 및 비용 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">날짜</p>
                            <p className="text-gray-700 font-medium">{date}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">시간</p>
                            <p className="text-gray-700 font-medium">
                              {time} ~ {endTime} ({duration}분)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">비용</p>
                            <p className="text-gray-700 font-medium">{reservation.cost.toLocaleString()} 크레딧</p>
                          </div>
                        </div>
                      </div>

                      {/* 요청사항 */}
                      {reservation.note && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start">
                            <MessageCircle className="h-4 w-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">요청사항</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.note}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      {reservation.status === 'PENDING' && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() => handleApproveClick(reservation)}
                            disabled={isApproving || isRejecting}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectClick(reservation)}
                            disabled={isApproving || isRejecting}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            거절
                          </Button>
                        </div>
                      )}

                      {/* 삭제 버튼 - 취소된 예약만 */}
                      {reservation.status === 'CANCELED' && (
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteClick(reservation)}
                          disabled={isDeleting}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
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
      )}

      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      날짜
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    클라이언트
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      상태
                      {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      비용
                      {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      예약 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => {
                    const { date, time } = formatDateTime(reservation.startAt);
                    const endTime = formatDateTime(reservation.endAt).time;

                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(reservation.id)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {time}-{endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reservation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {reservation.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveClick(reservation);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectClick(reservation);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  거절
                                </button>
                              </>
                            )}
                            {reservation.status === 'CANCELED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(reservation);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-12 gap-4 h-[600px]">
          {/* 왼쪽: 목록 (40%) */}
          <Card className="col-span-5 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {filteredReservations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  예약 내역이 없습니다
                </div>
              ) : (
                filteredReservations.map((reservation) => {
                  const { date, time } = formatDateTime(reservation.startAt);
                  const isSelected = selectedId === reservation.id;

                  return (
                    <div
                      key={reservation.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(reservation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                              {reservation.user.name?.charAt(0) || 'U'}
                            </div>
                            <p className="font-medium text-gray-900 truncate">{reservation.user.name}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric'
                            })} {time}
                          </p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* 오른쪽: 상세 정보 (60%) */}
          <Card className="col-span-7 p-6 overflow-y-auto">
            {selectedId ? (
              (() => {
                const reservation = filteredReservations.find(r => r.id === selectedId);
                if (!reservation) {
                  return <div className="text-center text-gray-500">예약을 찾을 수 없습니다</div>;
                }

                const { date, time } = formatDateTime(reservation.startAt);
                const endTime = formatDateTime(reservation.endAt).time;
                const duration = Math.round(
                  (new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / (1000 * 60)
                );

                return (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">예약 상세 정보</h3>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="h-px bg-gray-200"></div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">클라이언트</label>
                        <div className="mt-1 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            {reservation.user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-base text-gray-900">{reservation.user.name}</p>
                            <p className="text-sm text-gray-500">{reservation.user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">날짜</label>
                        <p className="mt-1 text-base text-gray-900">{date}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">시간</label>
                        <p className="mt-1 text-base text-gray-900">
                          {time} - {endTime}
                        </p>
                        <p className="text-sm text-gray-500">소요 시간: {duration}분</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">비용</label>
                        <p className="mt-1 text-base text-gray-900">{reservation.cost.toLocaleString()} 크레딧</p>
                      </div>

                      {reservation.note && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">요청사항</label>
                          <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.note}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">예약 ID</label>
                        <p className="mt-1 text-sm text-gray-600">#{reservation.displayId}</p>
                      </div>
                    </div>

                    {reservation.status === 'PENDING' && (
                      <div className="pt-4 border-t border-gray-200 space-y-2">
                        <Button
                          onClick={() => handleApproveClick(reservation)}
                          disabled={isApproving || isRejecting}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectClick(reservation)}
                          disabled={isApproving || isRejecting}
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          거절
                        </Button>
                      </div>
                    )}

                    {reservation.status === 'CANCELED' && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteClick(reservation)}
                          disabled={isDeleting}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3" />
                  <p>왼쪽 목록에서 예약을 선택하세요</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 승인 모달 */}
      {selectedReservation && (
        <ApproveModal
          isOpen={approveModalOpen}
          onClose={() => {
            setApproveModalOpen(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleApproveConfirm}
          reservation={{
            displayId: selectedReservation.displayId,
            userName: selectedReservation.user.name,
            startAt: selectedReservation.startAt,
            endAt: selectedReservation.endAt,
            cost: selectedReservation.cost
          }}
          isLoading={isApproving}
        />
      )}

      {/* 거절 모달 */}
      {selectedReservation && (
        <RejectModal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleRejectConfirm}
          reservation={{
            displayId: selectedReservation.displayId,
            userName: selectedReservation.user.name,
            startAt: selectedReservation.startAt,
            endAt: selectedReservation.endAt
          }}
          isLoading={isRejecting}
        />
      )}

      {/* 삭제 모달 */}
      {selectedReservation && (
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleDeleteConfirm}
          reservation={{
            displayId: selectedReservation.displayId,
            userName: selectedReservation.user.name,
            startAt: selectedReservation.startAt,
            endAt: selectedReservation.endAt
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
