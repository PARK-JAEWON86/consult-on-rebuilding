"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import {
  Search,
  Calendar,
  User,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { convertIdToConsultationNumber } from '@/utils/consultationNumber';

type ConsultationStatus = "completed" | "scheduled" | "canceled";

interface Consultation {
  id: number;
  consultationNumber?: string; // 바코드 형식 상담번호
  date: string;
  customer: string;
  topic: string;
  amount: number;
  status: ConsultationStatus;
  specialty?: string; // 상담 분야
}

function formatCredits(amount: number) {
  return `${amount.toLocaleString()} 크레딧`;
}

function hasCustomerLeftReview(customerName: string, expertId: number = 1): boolean {
  return false;
}

export default function ExpertConsultationsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ConsultationStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const [showRangePicker, setShowRangePicker] = useState(false);
  const rangeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        console.log('상담내역 API 호출 시도...');
        const response = await fetch('/api/consultations');
        const result = await response.json();
        console.log('API 응답:', result);
        if (result.success) {
          const consultationData = result.data.items || [];
          console.log('실제 데이터베이스에서 가져온 상담 데이터:', consultationData);
          setConsultations(consultationData.map((it: any) => ({
            id: it.id,
            consultationNumber: it.consultationNumber,
            date: it.date,
            customer: it.customer,
            topic: it.topic,
            amount: it.amount,
            status: it.status,
            specialty: it.specialty,
          })));
        } else {
          console.log('API 호출 실패, 더미 데이터 사용 예정');
        }
      } catch (error) {
        console.error('상담 기록 로드 실패:', error);
        // API 실패시 더미 데이터 사용
        const dummyData: Consultation[] = [
          {
            id: 1,
            consultationNumber: convertIdToConsultationNumber(1, '2025-09-18T10:00:00Z', '심리상담'),
            date: '2025-09-18T10:00:00Z',
            customer: '김고객',
            topic: '스트레스 관리 상담',
            amount: 500,
            status: 'completed',
            specialty: '심리상담'
          },
          {
            id: 2,
            consultationNumber: convertIdToConsultationNumber(2, '2025-09-19T14:00:00Z', '법률상담'),
            date: '2025-09-19T14:00:00Z',
            customer: '박고객',
            topic: '부동산 계약 관련 상담',
            amount: 750,
            status: 'completed',
            specialty: '법률상담'
          },
          {
            id: 3,
            consultationNumber: convertIdToConsultationNumber(3, '2025-09-20T09:00:00Z', '재무상담'),
            date: '2025-09-20T09:00:00Z',
            customer: '이고객',
            topic: '투자 포트폴리오 상담',
            amount: 600,
            status: 'scheduled',
            specialty: '재무상담'
          }
        ];
        setConsultations(dummyData);
      }
    };

    loadConsultations();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setShowRangePicker(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const formatYMD = (d?: string) =>
    d ? format(new Date(d), "yyyy-MM-dd") : "--";

  const shiftRange = (direction: -1 | 1) => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1);
    const newStart = new Date(start);
    const newEnd = new Date(end);
    newStart.setDate(newStart.getDate() + direction * diffDays);
    newEnd.setDate(newEnd.getDate() + direction * diffDays);
    setStartDate(format(newStart, "yyyy-MM-dd"));
    setEndDate(format(newEnd, "yyyy-MM-dd"));
  };

  const quickRanges = {
    today: () => {
      const d = new Date();
      const ymd = format(d, "yyyy-MM-dd");
      setStartDate(ymd);
      setEndDate(ymd);
    },
    last7: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    },
    last30: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    },
    thisMonth: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    },
    lastWeek: () => {
      const now = new Date();
      const day = now.getDay();
      const end = new Date(now);
      end.setDate(now.getDate() - day - 1);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    },
    lastMonth: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
    },
  } as const;

  const filtered = consultations.filter((c) => {
    const matchesQuery =
      !query ||
      c.customer.toLowerCase().includes(query.toLowerCase()) ||
      c.topic.toLowerCase().includes(query.toLowerCase()) ||
      c.consultationNumber?.toLowerCase().includes(query.toLowerCase()) ||
      String(c.id).includes(query);
    const matchesStatus = status === "all" || c.status === status;
    const ts = new Date(c.date).getTime();
    const afterStart = startDate ? ts >= new Date(startDate).getTime() : true;
    const beforeEnd = endDate
      ? ts <= new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
      : true;
    return matchesQuery && matchesStatus && afterStart && beforeEnd;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-900">상담 내역</h1>
        </div>
        <p className="text-blue-700 mt-1">
          상담 날짜, 고객, 주제, 정산 크레딧을 한눈에 확인하세요.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="relative flex-1 md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="고객명, 상담주제, 상담번호 검색"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative md:col-span-2" ref={rangeRef}>
            <div className="flex items-center h-10 border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => shiftRange(-1)}
                className="w-10 h-10 hover:bg-gray-50 text-gray-600"
                title="이전 범위"
              >
                <ChevronLeft className="mx-auto h-4 w-4" />
              </button>
              <button
                onClick={() => setShowRangePicker((s) => !s)}
                className="flex-1 h-10 text-gray-800"
              >
                {startDate && endDate
                  ? `${formatYMD(startDate)} - ${formatYMD(endDate)}`
                  : "기간을 선택하세요"}
              </button>
              <button
                onClick={() => shiftRange(1)}
                className="w-10 h-10 hover:bg-gray-50 text-gray-600"
                title="다음 범위"
              >
                <ChevronRight className="mx-auto h-4 w-4" />
              </button>
            </div>

            {showRangePicker && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 absolute">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={quickRanges.today} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">오늘</button>
                  <button onClick={quickRanges.last7} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">최근 7일</button>
                  <button onClick={quickRanges.last30} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">최근 30일</button>
                  <button onClick={quickRanges.thisMonth} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">이번 달</button>
                  <button onClick={quickRanges.lastWeek} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">지난주</button>
                  <button onClick={quickRanges.lastMonth} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">지난달</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">시작일</div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">종료일</div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as ConsultationStatus | "all"
              )
            }
            className="h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 상태</option>
            <option value="completed">완료</option>
            <option value="scheduled">예약됨</option>
            <option value="canceled">취소됨</option>
          </select>
        </div>
      </div>

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
                  고객
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상담주제
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  정산 크레딧
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/expert/consultations/${row.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border">
                      {row.consultationNumber || `#${row.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {format(new Date(row.date), "PP", { locale: ko })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{row.customer}</span>
                      {hasCustomerLeftReview(row.customer) && (
                        <div className="ml-2 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="ml-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            리뷰 작성함
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {row.topic}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div className="flex items-center justify-end">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      {formatCredits(row.amount)}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              총 {filtered.length.toLocaleString()}건 · {currentPage}/
              {totalPages}
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
  );
}