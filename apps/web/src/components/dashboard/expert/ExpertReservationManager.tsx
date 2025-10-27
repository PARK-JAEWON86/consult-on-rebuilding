'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ApproveModal, RejectModal, DeleteModal } from './ReservationActionModals';
import SearchBar from '@/components/reservation/SearchBar';
import AdvancedFilter from '@/components/reservation/AdvancedFilter';
import Pagination from '@/components/reservation/Pagination';
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
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
  subject?: string;
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 예약 액션 상태
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 확장된 행 관리
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

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
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

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

  // 상태별 카운트
  const statusCounts = {
    all: reservations.length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    canceled: reservations.filter(r => r.status === 'CANCELED').length
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
      </div>

      {/* 통계 카드 - 클릭 가능 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'ALL'
              ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400'
              : 'bg-blue-50 border-blue-200'
          }`}
          onClick={() => setStatusFilter('ALL')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">전체 예약</p>
              <p className="text-3xl font-bold text-blue-900">{statusCounts.all}</p>
            </div>
            <Calendar className="h-10 w-10 text-blue-600" />
          </div>
        </Card>
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

      {/* 테이블 뷰 */}
      <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    번호
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    신청번호
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    클라이언트 이름
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      상태
                      {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      상담날짜
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    시간
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      예상비용
                      {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
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
                    const { time } = formatDateTime(reservation.startAt);
                    const endTime = formatDateTime(reservation.endAt).time;
                    const rowNumber = startIndex + index + 1;
                    const isExpanded = expandedRowId === reservation.id;

                    return (
                      <>
                        <tr
                          key={reservation.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedRowId(isExpanded ? null : reservation.id)}
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {rowNumber}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-gray-400 transform rotate-180" />
                              )}
                              {reservation.displayId}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.user.name}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(reservation.startAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {time} - {endTime}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.cost.toLocaleString()} 크레딧
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {reservation.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveClick(reservation);
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectClick(reservation);
                                    }}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
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
                                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row details */}
                        {isExpanded && (
                          <tr key={`${reservation.id}-details`} className="bg-gray-50">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                {/* 왼쪽: 클라이언트 정보 & 상담 정보 (위아래 배치) */}
                                <div className="space-y-4">
                                  {/* 클라이언트 정보 */}
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <User className="h-5 w-5 text-gray-400" />
                                      <h4 className="font-semibold text-gray-900">클라이언트 정보</h4>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      {/* 프로필 사진 */}
                                      <div className="flex-shrink-0">
                                        {reservation.user.avatarUrl ? (
                                          <img
                                            src={reservation.user.avatarUrl}
                                            alt={reservation.user.name}
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
                                            <p className="font-medium text-gray-900">{reservation.user.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">이메일</p>
                                            <p className="font-medium text-gray-900">{reservation.user.email}</p>
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
                                        <p className="font-medium text-gray-900">{time} - {endTime}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">예상 청구 비용</p>
                                        <p className="font-medium text-gray-900">{reservation.cost.toLocaleString()} 크레딧</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">상태</p>
                                        <div>{getStatusBadge(reservation.status)}</div>
                                      </div>
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

          {/* 페이지네이션 - Table View */}
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
