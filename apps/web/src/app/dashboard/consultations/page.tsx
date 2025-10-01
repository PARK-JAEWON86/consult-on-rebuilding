'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import {
  Calendar,
  FileText,
  User,
  Plus,
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { convertIdToConsultationNumber } from '@/utils/consultationNumber';

// 상담 내역 타입 정의
interface ConsultationHistory {
  id: number;
  consultationNumber?: string; // 바코드 형식 상담번호
  sessionId: string;
  reservationId: number;
  expertId: number;
  expertName: string;
  userId: number;
  startAt: string;
  endAt: string;
  duration: number; // 분
  status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  cost: number;
  specialty: string;
  topic: string;
  note?: string;

  // 요약 정보
  summary?: {
    keyPoints: string[];
    recommendations: string[];
    followUpActions: string[];
    tags: string[];
  };

  // 평가 정보
  review?: {
    rating: number;
    comment: string;
  };
}

export default function ConsultationsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 상담 내역 데이터 로드 (임시 데이터 사용)
  const { data: consultationsData, isLoading, error } = useQuery({
    queryKey: ['consultations', user?.id, statusFilter],
    queryFn: async () => {
      // 실제 API 호출 대신 임시 데이터 반환
      const dummyData: ConsultationHistory[] = [
        {
          id: 1,
          consultationNumber: convertIdToConsultationNumber(1, '2025-09-18T10:00:00Z', '심리상담'),
          sessionId: 'session-001',
          reservationId: 101,
          expertId: 1,
          expertName: '김전문가',
          userId: Number(user?.id) || 1,
          startAt: '2025-09-18T10:00:00Z',
          endAt: '2025-09-18T11:00:00Z',
          duration: 60,
          status: 'COMPLETED',
          cost: 500,
          specialty: '심리상담',
          topic: '스트레스 관리 상담',
          note: '스트레스 관리 상담',
          summary: {
            keyPoints: [
              '현재 업무 스트레스가 주요 문제',
              '수면 패턴 불규칙성 확인',
              '운동 부족이 스트레스 증가 요인'
            ],
            recommendations: [
              '주 3회 이상 규칙적인 운동',
              '명상 및 호흡법 연습',
              '업무와 휴식의 경계 설정'
            ],
            followUpActions: [
              '2주 후 재상담 예약',
              '운동 일지 작성',
              '수면 패턴 기록'
            ],
            tags: ['스트레스', '수면', '운동', '업무']
          },
          review: {
            rating: 5,
            comment: '매우 도움이 되었습니다. 구체적인 해결책을 제시해주셔서 감사합니다.'
          }
        },
        {
          id: 2,
          consultationNumber: convertIdToConsultationNumber(2, '2025-09-19T14:00:00Z', '법률상담'),
          sessionId: 'session-002',
          reservationId: 102,
          expertId: 2,
          expertName: '이법무사',
          userId: Number(user?.id) || 1,
          startAt: '2025-09-19T14:00:00Z',
          endAt: '2025-09-19T15:30:00Z',
          duration: 90,
          status: 'COMPLETED',
          cost: 750,
          specialty: '법률상담',
          topic: '부동산 계약 관련 상담',
          note: '부동산 계약 관련 상담',
          summary: {
            keyPoints: [
              '계약서 특약사항 검토 필요',
              '중도금 대출 조건 확인',
              '소유권 이전 절차 안내'
            ],
            recommendations: [
              '계약서 재검토 후 서명',
              '은행 중도금 대출 상담',
              '등기부등본 재확인'
            ],
            followUpActions: [
              '계약서 수정 요청',
              '은행 방문 예약',
              '필요시 재상담'
            ],
            tags: ['부동산', '계약서', '대출', '소유권']
          },
          review: {
            rating: 4,
            comment: '전문적인 조언 감사합니다.'
          }
        }
      ];
      return { data: dummyData };
    },
    enabled: !!user?.id && isAuthenticated,
  });

  const consultations: ConsultationHistory[] = consultationsData?.data || [];

  // 필터링된 상담 내역
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = searchQuery === '' ||
      consultation.expertName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(consultation.id).includes(searchQuery) ||
      consultation.consultationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.note?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || consultation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filteredConsultations.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedConsultations = filteredConsultations.slice(startIndex, endIndex);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/consultations');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }


  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">상담 내역</h1>
        <p className="text-gray-600">
          완료된 상담 내역과 요약을 확인할 수 있습니다.
        </p>
      </div>

      <div className="space-y-6">

            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="상담번호, 전문가 이름, 상담주제로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'COMPLETED' | 'CANCELLED')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">전체 상태</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소됨</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">상담 내역을 불러오는 중...</p>
                </div>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <FileText className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchQuery || statusFilter !== 'ALL' ? '검색 결과가 없습니다' : '상담 내역이 없습니다'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || statusFilter !== 'ALL'
                      ? '다른 검색어나 필터를 사용해보세요.'
                      : '아직 완료된 상담이 없습니다. 전문가와 상담을 시작해보세요.'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'ALL' && (
                    <div className="mt-6">
                      <button
                        onClick={() => router.push('/experts')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        전문가 찾기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 상담 내역 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상담번호
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상담일자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전문가
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상담주제
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용한 크레딧
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedConsultations.map((consultation) => (
                          <tr
                            key={consultation.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/dashboard/consultations/${consultation.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border">
                                {consultation.consultationNumber || `#${consultation.id}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {format(new Date(consultation.startAt), "PP", { locale: ko })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="font-medium">{consultation.expertName}</div>
                                  <div className="text-xs text-gray-500">{consultation.specialty}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                {consultation.topic}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              <div className="flex items-center justify-end">
                                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                                {consultation.cost.toLocaleString()} 크레딧
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredConsultations.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-16 text-center text-sm text-gray-500"
                            >
                              검색 조건에 맞는 상담 내역이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredConsultations.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        총 {filteredConsultations.length.toLocaleString()}건 · {currentPage}/{totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`inline-flex items-center h-9 px-3 rounded-md border text-sm ${
                            currentPage === 1
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-white"
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`inline-flex items-center h-9 px-3 rounded-md border text-sm ${
                            currentPage === totalPages
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-white"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
        )}
      </div>
    </div>
  );
}