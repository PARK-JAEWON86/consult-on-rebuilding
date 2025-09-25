'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import {
  CreditCard,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ConsultationItem {
  id: number;
  date: string;
  customer: string;
  topic: string;
  amount: number;
  status: 'completed' | 'scheduled' | 'canceled';
}

interface SettlementSummary {
  totalConsultations: number;
  totalGrossCredits: number;
  totalGrossKrw: number;
  totalPlatformFeeKrw: number;
  taxWithheldKrw: number;
  netPayoutCredits: number;
  avgDurationMin: number;
}

interface MonthlyStats {
  month: number;
  label: string;
  gross: number;
  fee: number;
  net: number;
  consultationCount: number;
}

interface SettlementResponse {
  summary: SettlementSummary;
  consultations: ConsultationItem[];
  monthlyStats: MonthlyStats[];
  nextSettlementDate: string;
  daysUntilSettlement: number;
}

function formatCredits(n: number) {
  return `${n.toLocaleString()} 크레딧`;
}

const CREDIT_TO_KRW = 10; // 1 크레딧 = 10원
function formatKRW(n: number) {
  return `${n.toLocaleString()}원`;
}


// 매월 5일 정산 시스템 관련 함수들
function getNextSettlementDate(): Date {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  if (currentDay >= 5) {
    return new Date(currentYear, currentMonth + 1, 5);
  } else {
    return new Date(currentYear, currentMonth, 5);
  }
}

function getDaysUntilSettlement(): number {
  const today = new Date();
  const nextSettlement = getNextSettlementDate();
  const diffTime = nextSettlement.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ExpertPayoutsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const [feeRate] = useState(0.12); // 12% 수수료
  const [nextSettlementDate, setNextSettlementDate] = useState<Date>(new Date());
  const [daysUntilSettlement, setDaysUntilSettlement] = useState<number>(0);
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpertId, setCurrentExpertId] = useState<number | null>(null);
  const [isMonthlyTableExpanded, setIsMonthlyTableExpanded] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const nextDate = getNextSettlementDate();
    const daysLeft = getDaysUntilSettlement();
    setNextSettlementDate(nextDate);
    setDaysUntilSettlement(daysLeft);

    // 전문가 ID 추출 및 정산 데이터 로드
    if (user && user.roles?.includes('EXPERT')) {
      // For now, use user ID directly as expert ID (needs proper mapping later)
      const expertId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      setCurrentExpertId(expertId);
      loadSettlementData(expertId);
    }
  }, [user]);

  const loadSettlementData = async (expertId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load settlement data from API
      const response = await api.get<SettlementResponse>(`/settlements/experts/${expertId}`);

      if (response.success && response.data) {
        const data = response.data;
        setSettlementSummary(data.summary);
        setItems(data.consultations);
        setMonthlyStats(data.monthlyStats);

        // Update settlement dates from API response
        const apiNextDate = new Date(data.nextSettlementDate);
        setNextSettlementDate(apiNextDate);
        setDaysUntilSettlement(data.daysUntilSettlement);

        console.log(`✅ Loaded settlement data for expert ${expertId}:`, data);
      }
    } catch (error) {
      console.error('Failed to load settlement data:', error);
      setError(error instanceof Error ? error.message : '정산 데이터 로드에 실패했습니다.');

      // Fallback to dummy data on error
      const dummySummary: SettlementSummary = {
        totalConsultations: 0,
        totalGrossCredits: 0,
        totalGrossKrw: 0,
        totalPlatformFeeKrw: 0,
        taxWithheldKrw: 0,
        netPayoutCredits: 0,
        avgDurationMin: 0
      };
      setSettlementSummary(dummySummary);
      setItems([]);
      setMonthlyStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const completed = useMemo(
    () => items.filter((it) => it.status === 'completed'),
    [items]
  );

  const gross = settlementSummary ? settlementSummary.totalGrossCredits : completed.reduce((acc, v) => acc + (v.amount || 0), 0);
  const totalFees = settlementSummary ? Math.floor(settlementSummary.totalPlatformFeeKrw / 10) : Math.round(gross * feeRate);
  const taxWithheld = settlementSummary ? Math.floor(settlementSummary.taxWithheldKrw / 10) : 0;
  const net = settlementSummary ? settlementSummary.netPayoutCredits : Math.max(0, gross - totalFees);


  // 월별 집계 - 이제 API에서 가져온 데이터를 사용
  const currentYear = new Date().getFullYear();
  const months = useMemo(() => {
    if (monthlyStats.length > 0) {
      return monthlyStats;
    }

    // Fallback to calculating from consultations if API data not available
    const toDate = (d: string | Date | undefined) =>
      d ? new Date(d) : new Date(0);

    const completedThisYear = completed.filter((it) => {
      const d = toDate(it.date);
      return d.getFullYear() === currentYear;
    });

    const sums: number[] = Array.from({ length: 12 }, () => 0);
    completedThisYear.forEach((it) => {
      const d = toDate(it.date);
      const m = d.getMonth();
      sums[m] += it.amount || 0;
    });

    const feeOf = (v: number) => Math.round(v * feeRate);
    const netOf = (v: number) => Math.max(0, v - feeOf(v));

    return sums.map((grossM, idx) => ({
      month: idx + 1,
      label: `${currentYear}년 ${idx + 1}월`,
      gross: grossM,
      fee: feeOf(grossM),
      net: netOf(grossM),
      consultationCount: completedThisYear.filter(it => {
        const d = toDate(it.date);
        return d.getMonth() === idx;
      }).length
    }));
  }, [monthlyStats, completed, currentYear, feeRate]);



  const downloadCSV = () => {
    const headers = ['id', 'date', 'customer', 'topic', 'amount', 'status'];
    const rows = completed.map((c) => [
      c.id,
      c.date,
      c.customer,
      c.topic,
      c.amount,
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정산/출금</h1>
            <p className="text-gray-600 mt-1">
              완료된 상담 기준 정산 내역과 출금 요청을 관리합니다.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={downloadCSV}
              className="flex items-center h-10 px-4 rounded-md border text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
            </button>
            <button
              onClick={() => {
                if (currentExpertId) {
                  loadSettlementData(currentExpertId);
                }
              }}
              className="flex items-center h-10 px-4 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  데이터 로드 실패
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1">임시 데이터로 표시됩니다. 새로고침 버튼을 눌러 다시 시도해주세요.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 정산 일정 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                매월 5일 정산 시스템
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>다음 정산일: <span className="font-semibold">{nextSettlementDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span></p>
                <p className="mt-1">
                  정산까지 <span className="font-semibold text-blue-900">{daysUntilSettlement}일</span> 남았습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">총 상담 수</div>
                <div className="text-xl font-bold text-gray-900">
                  {settlementSummary ? settlementSummary.totalConsultations : completed.length}건
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  평균 {settlementSummary ? settlementSummary.avgDurationMin : 0}분
                </div>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">총 정산액(완료)</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCredits(gross)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {settlementSummary ? `${(settlementSummary.totalGrossKrw / 10000).toFixed(1)}만원` : ''}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">플랫폼 수수료 (12%)</div>
                <div className="text-xl font-bold text-blue-600">
                  -{formatCredits(totalFees)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {settlementSummary ? `${(settlementSummary.totalPlatformFeeKrw / 10000).toFixed(1)}만원` : ''}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">출금 가능액</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCredits(net)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  원천징수 후: {formatCredits(net - taxWithheld)}
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* 자동 정산 안내 */}
        <div className="bg-white border rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-green-400 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                자동 정산 시스템
              </h3>
              <div className="mt-1 text-sm text-gray-600">
                <p>
                  매월 5일에 완료된 상담의 정산금이 자동으로 지급됩니다.
                  별도의 출금 요청이 필요하지 않습니다.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">다음 정산일</div>
                    <div className="font-medium text-gray-900">
                      {nextSettlementDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {daysUntilSettlement}일 후
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">정산 예상액</div>
                    <div className="font-medium text-green-600">
                      {formatCredits(net)}
                    </div>
                    <div className="text-xs text-gray-500">
                      플랫폼 수수료 차감 후
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 월별 정산 현황 */}
        <div className="bg-white border rounded-lg p-4 mb-8">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">월별 정산 현황</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {currentYear}년 월별 크레딧 수익 및 정산 내역
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">연간 총수익</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCredits(months.reduce((acc, m) => acc + m.net, 0))}
                </div>
              </div>
            </div>
          </div>

          {/* 월별 크레딧 바차트 */}
          <div className="grid grid-cols-12 gap-2 mb-4">
            {months.map((m) => {
              const maxNet = Math.max(...months.map(month => month.net));
              const height = maxNet > 0 ? Math.max((m.net / maxNet) * 100, 2) : 2;

              return (
                <div key={m.month} className="flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t flex flex-col justify-end h-24 relative">
                    {m.net > 0 && (
                      <div
                        className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%` }}
                        title={`${m.label}: ${formatCredits(m.net)}`}
                      />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 font-medium">
                    {m.month}월
                  </div>
                  <div className="text-[9px] text-gray-400">
                    {m.net > 0 ? `${(m.net / 1000).toFixed(0)}K` : '0'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 월별 상세 테이블 토글 버튼 */}
          <div className="border-t mt-4 pt-4">
            <button
              onClick={() => setIsMonthlyTableExpanded(!isMonthlyTableExpanded)}
              className="w-full flex items-center justify-between py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span>월별 상세 내역 보기</span>
              {isMonthlyTableExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isMonthlyTableExpanded && (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-t">
                      <th className="px-2 py-2">월</th>
                      <th className="px-2 py-2 text-right">총 수익</th>
                      <th className="px-2 py-2 text-right">수수료</th>
                      <th className="px-2 py-2 text-right">순 정산액</th>
                      <th className="px-2 py-2 text-right">상담 수</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y">
                    {months.map((m) => {
                      return (
                        <tr key={m.month} className={m.net > 0 ? 'hover:bg-gray-50' : ''}>
                          <td className="px-2 py-2 font-medium">{m.month}월</td>
                          <td className="px-2 py-2 text-right text-gray-900">
                            {m.gross > 0 ? formatCredits(m.gross) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-blue-600">
                            {m.fee > 0 ? `-${formatCredits(m.fee)}` : '-'}
                          </td>
                          <td className="px-2 py-2 text-right font-medium text-green-600">
                            {m.net > 0 ? (
                              <div>
                                <div>{formatCredits(m.net)}</div>
                                <div className="text-xs text-gray-500 font-normal">
                                  ({formatKRW(m.net * CREDIT_TO_KRW)})
                                </div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-gray-500">
                            {m.consultationCount > 0 ? `${m.consultationCount}건` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2" />
              <div className="text-xs text-blue-700">
                <p><strong>정산 기준:</strong> 완료된 상담만 정산 대상이며, 플랫폼 수수료 {Math.round(feeRate * 100)}%가 차감됩니다.</p>
                <p className="mt-1"><strong>지급 일정:</strong> 매월 5일에 전월분 정산금이 지급됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}