'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthProvider';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Calendar, Clock, X, CheckCircle, ChevronDown, ChevronUp, AlertCircle, User, MessageCircle } from 'lucide-react';
import CancelReservationModal from './CancelReservationModal';
import SearchBar from '@/components/reservation/SearchBar';
import AdvancedFilter from '@/components/reservation/AdvancedFilter';
import Pagination from '@/components/reservation/Pagination';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'REJECTED' | 'COMPLETED' | 'NO_SHOW';

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
  subject?: string;
  note?: string;
  cancelReason?: string;
  canceledAt?: string;
  createdAt: string;
  expert: {
    id?: number;
    name: string;
    displayId: string;
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

const statusConfig = {
  PENDING: { label: '승인 대기', variant: 'yellow' as const, icon: Clock },
  CONFIRMED: { label: '예약 확정', variant: 'green' as const, icon: CheckCircle },
  CANCELED: { label: '취소됨', variant: 'red' as const, icon: X },
  REJECTED: { label: '거절됨', variant: 'red' as const, icon: X },
  COMPLETED: { label: '완료', variant: 'blue' as const, icon: CheckCircle },
  NO_SHOW: { label: '노쇼', variant: 'gray' as const, icon: X }
};

const getStatusConfig = (status: ReservationStatus) => {
  return statusConfig[status] || { label: status, variant: 'gray' as const, icon: AlertCircle };
};

export default function UserReservationManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // UI 상태
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 취소 관련 상태
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 확장된 행 관리
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // 필터/정렬 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, advancedFilters, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 예약 관리</h2>
        <p className="text-sm text-gray-600 mt-1">전문가 상담 예약 현황을 확인하고 관리할 수 있습니다</p>
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

      {/* 테이블 뷰 */}
      <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전문가 이름
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
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      상담날짜
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      예상비용
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      예약 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedReservations.map((reservation, index) => {
                    const refundInfo = getRefundInfo(reservation);
                    const isExpanded = expandedRowId === reservation.id;
                    const rowNumber = startIndex + index + 1;

                    return (
                      <>
                        <tr
                          key={reservation.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedRowId(isExpanded ? null : reservation.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {rowNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-gray-400 transform rotate-180" />
                              )}
                              {reservation.displayId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.expert.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusConfig(reservation.status).variant} className="inline-flex">
                              {getStatusConfig(reservation.status).label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(reservation.endAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.cost.toLocaleString()} 크레딧
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
                        {isExpanded && (
                          <tr key={`${reservation.id}-details`}>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-2 gap-4">
                                {/* 왼쪽: 전문가 정보 & 상담 정보 (위아래 배치) */}
                                <div className="space-y-4">
                                  {/* 전문가 정보 */}
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <User className="h-5 w-5 text-gray-400" />
                                      <h4 className="font-semibold text-gray-900">전문가 정보</h4>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      {/* 프로필 사진 */}
                                      <div className="flex-shrink-0">
                                        {reservation.expert.avatarUrl ? (
                                          <img
                                            src={reservation.expert.avatarUrl}
                                            alt={reservation.expert.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                            <User className="h-8 w-8 text-gray-500" />
                                          </div>
                                        )}
                                      </div>
                                      {/* 정보 */}
                                      <div className="flex-1 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-gray-500">이름</p>
                                            <p className="font-medium text-gray-900">{reservation.expert.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">전문가 ID</p>
                                            <p className="font-medium text-gray-900">@{reservation.expert.displayId}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 상담 정보 */}
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Clock className="h-5 w-5 text-gray-400" />
                                      <h4 className="font-semibold text-gray-900">상담 정보</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-500">상담 날짜</p>
                                        <p className="font-medium text-gray-900">
                                          {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            weekday: 'short'
                                          })}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">상담 시간</p>
                                        <p className="font-medium text-gray-900">
                                          {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })} - {new Date(reservation.endAt).toLocaleTimeString('ko-KR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">예상 청구 비용</p>
                                        <p className="font-medium text-gray-900">{reservation.cost.toLocaleString()} 크레딧</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">상태</p>
                                        <Badge variant={getStatusConfig(reservation.status).variant}>
                                          {getStatusConfig(reservation.status).label}
                                        </Badge>
                                      </div>

                                      {/* 거절 사유 표시 (REJECTED 상태일 때만) */}
                                      {reservation.status === 'REJECTED' && reservation.cancelReason && (
                                        <div className="col-span-2 mt-2 pt-4 border-t border-gray-200">
                                          <p className="text-gray-500 mb-2 font-medium">거절 사유</p>
                                          <div className="bg-red-50 p-3 rounded-lg border border-red-200 max-h-40 overflow-y-auto">
                                            <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">
                                              {reservation.cancelReason}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* 오른쪽: 상담 요청 내용 */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col h-full">
                                  <div className="flex items-center gap-2 mb-3">
                                    <MessageCircle className="h-5 w-5 text-blue-500" />
                                    <h4 className="font-semibold text-gray-900">상담 요청 내용</h4>
                                  </div>
                                  <div className="flex-1 flex flex-col gap-2">
                                    {reservation.subject && (
                                      <div className="flex items-start gap-2 text-sm">
                                        <span className="font-bold text-gray-900 whitespace-nowrap">상담주제:</span>
                                        <span className="text-gray-800">{reservation.subject}</span>
                                      </div>
                                    )}
                                    {reservation.note && (
                                      <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto min-h-[200px]">
                                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{reservation.note}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 하단: 취소 불가 안내 */}
                              {refundInfo && !refundInfo.canCancel && (
                                <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
                                  <p className="text-sm text-red-800 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {refundInfo.message}
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션 */}
          {filteredReservations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReservations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </Card>

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
