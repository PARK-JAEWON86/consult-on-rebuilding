'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthProvider';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Calendar, Clock, User, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import CancelReservationModal from './CancelReservationModal';
import ViewModeSwitcher, { ViewMode } from '@/components/reservation/ViewModeSwitcher';
import SearchBar from '@/components/reservation/SearchBar';
import AdvancedFilter from '@/components/reservation/AdvancedFilter';

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

const statusConfig = {
  PENDING: { label: '승인 대기', variant: 'yellow' as const, icon: Clock },
  CONFIRMED: { label: '예약 확정', variant: 'green' as const, icon: CheckCircle },
  CANCELED: { label: '취소됨', variant: 'red' as const, icon: X },
  COMPLETED: { label: '완료', variant: 'blue' as const, icon: CheckCircle }
};

export default function UserReservationManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // UI 상태
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 취소 관련 상태
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
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
    queryKey: ['user-reservations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await api.get(`/reservations?userId=${user.id}`);
      return response.data || [];
    },
    enabled: !!user?.id
  });

  // 취소 mutation
  const cancelMutation = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await api.delete(`/reservations/${displayId}`, {
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
      setCancelModalOpen(false);
      setSelectedReservation(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '예약 취소에 실패했습니다';
      showToast(message, 'error');
      setCancelingId(null);
    }
  });

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedReservation) {
      setCancelingId(selectedReservation.displayId);
      cancelMutation.mutate(selectedReservation.displayId);
    }
  };

  const reservations: Reservation[] = reservationsData || [];

  // 필터링 및 검색
  const filteredReservations = reservations
    .filter(r => {
      // 상태 필터
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !r.expert.name.toLowerCase().includes(query) &&
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

      // 전문가 이름 필터
      if (advancedFilters.expertName) {
        if (!r.expert.name.toLowerCase().includes(advancedFilters.expertName.toLowerCase())) {
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

  const handleSort = (field: 'date' | 'price' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">내 예약 관리</h2>
          <p className="text-sm text-gray-600 mt-1">전문가 상담 예약 현황을 확인하고 관리할 수 있습니다</p>
        </div>
        <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* 통계 카드 - 클릭 가능하도록 개선 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'ALL' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('ALL')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 예약</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setStatusFilter('PENDING')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'CONFIRMED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setStatusFilter('CONFIRMED')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">예약 확정</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'CANCELED' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setStatusFilter('CANCELED')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">취소됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
            </div>
            <X className="h-8 w-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="전문가 이름 또는 예약 ID로 검색..."
          />
        </div>
        <AdvancedFilter
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
        />
      </div>

      {/* 뷰 모드별 렌더링 */}
      {viewMode === 'card' && (
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
                <Card key={reservation.id} className="p-6 hover:shadow-lg transition-shadow">
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

                      {/* 예상 비용 */}
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <span className="text-gray-600">예상 비용: </span>
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
                      <Badge variant={config.variant} className="flex items-center space-x-1">
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
                          onClick={() => handleCancelClick(reservation)}
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
                    전문가
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
                    const config = statusConfig[reservation.status];
                    const refundInfo = getRefundInfo(reservation);

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
                          {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}-{new Date(reservation.endAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.expert.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={config.variant} className="inline-flex">
                            {config.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {refundInfo && refundInfo.canCancel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClick(reservation);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              취소
                            </button>
                          )}
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
                  const config = statusConfig[reservation.status];
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
                          <p className="font-medium text-gray-900 truncate">{reservation.expert.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric'
                            })} {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge variant={config.variant} className="ml-2">
                          {config.label}
                        </Badge>
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

                const config = statusConfig[reservation.status];
                const StatusIcon = config.icon;
                const refundInfo = getRefundInfo(reservation);

                return (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">예약 상세 정보</h3>
                        <Badge variant={config.variant} className="flex items-center space-x-1">
                          <StatusIcon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </Badge>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">전문가</label>
                        <p className="mt-1 text-base text-gray-900">{reservation.expert.name}</p>
                        <p className="text-sm text-gray-500">@{reservation.expert.displayId}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">날짜</label>
                        <p className="mt-1 text-base text-gray-900">
                          {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">시간</label>
                        <p className="mt-1 text-base text-gray-900">
                          {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(reservation.endAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">소요 시간: {reservation.duration}분</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">비용</label>
                        <p className="mt-1 text-base text-gray-900">{reservation.cost.toLocaleString()} 크레딧</p>
                      </div>

                      {reservation.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">메모</label>
                          <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{reservation.notes}</p>
                          </div>
                        </div>
                      )}

                      {refundInfo && refundInfo.canCancel && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">환불 정보</label>
                          <div className="mt-1 bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-900">
                              취소 시 {refundInfo.refundAmount?.toLocaleString()} 크레딧 환불 ({refundInfo.message})
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">예약 ID</label>
                        <p className="mt-1 text-sm text-gray-600">#{reservation.displayId}</p>
                      </div>
                    </div>

                    {refundInfo && refundInfo.canCancel && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => handleCancelClick(reservation)}
                          disabled={cancelingId === reservation.displayId}
                          className="w-full"
                        >
                          {cancelingId === reservation.displayId ? '취소 중...' : '예약 취소'}
                        </Button>
                      </div>
                    )}

                    {refundInfo && !refundInfo.canCancel && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {refundInfo.message}
                        </p>
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

      {/* 취소 확인 모달 */}
      {selectedReservation && (
        <CancelReservationModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleCancelConfirm}
          reservation={{
            displayId: selectedReservation.displayId,
            expertName: selectedReservation.expert.name,
            startAt: selectedReservation.startAt,
            endAt: selectedReservation.endAt,
            cost: selectedReservation.cost,
            refundInfo: getRefundInfo(selectedReservation)
          }}
          isLoading={cancelingId === selectedReservation.displayId}
        />
      )}
    </div>
  );
}
