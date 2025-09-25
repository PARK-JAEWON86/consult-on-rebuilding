'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAIUsage,
  addPurchasedCredits,
  simulateUsage,
  formatKRW,
  formatTokens,
  AIUsageResponse
} from '@/lib/ai-usage';
import {
  Brain,
  Zap,
  TrendingUp,
  RefreshCw,
  Plus,
  Calculator,
  Clock,
  AlertTriangle
} from 'lucide-react';

// AI 사용량 카드 컴포넌트
function AIUsageCard({ router }: { router: any }) {
  const [showDetails, setShowDetails] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationTurns, setSimulationTurns] = useState(10);
  const [simulationTokens, setSimulationTokens] = useState(900);
  const [preciseMode, setPreciseMode] = useState(false);
  const queryClient = useQueryClient();

  // AI 사용량 데이터 로드
  const { data: aiUsageData, isLoading: aiUsageLoading, error: aiUsageError } = useQuery<AIUsageResponse>({
    queryKey: ['aiUsage'],
    queryFn: getAIUsage,
    refetchInterval: 30000, // 30초마다 갱신
  });

  // 크레딧으로 토큰 구매 뮤테이션
  const purchaseTokensMutation = useMutation({
    mutationFn: addPurchasedCredits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiUsage'] });
    },
  });

  // 사용량 시뮬레이션
  const { data: simulationResult } = useQuery({
    queryKey: ['aiUsageSimulation', simulationTurns, simulationTokens, preciseMode],
    queryFn: () => simulateUsage(simulationTurns, simulationTokens, preciseMode),
    enabled: simulationMode,
  });

  const aiUsage = aiUsageData?.data;
  const summary = aiUsage?.summary;

  // 토큰 구매 핸들러
  const handlePurchaseTokens = async (credits: number) => {
    try {
      await purchaseTokensMutation.mutateAsync(credits);
      alert(`${credits} 크레딧으로 토큰을 구매했습니다!`);
    } catch (error) {
      alert('토큰 구매에 실패했습니다.');
    }
  };

  // 리셋 날짜 포맷팅
  const formatResetDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return '오늘 리셋';
    if (days === 1) return '내일 리셋';
    return `${days}일 후 리셋`;
  };

  // 사용률에 따른 색상
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-orange-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (aiUsageLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="ml-3 h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-28 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (aiUsageError || !aiUsage) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 ml-3">AI 채팅상담 토큰량</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">데이터를 불러올 수 없습니다.</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['aiUsage'] })}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </button>
      </div>
    );
  }

  const remainingTokens = (summary?.remainingFreeTokens || 0) + (summary?.remainingPurchasedTokens || 0);
  const usagePercent = 100 - aiUsage.remainingPercent;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Brain className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 ml-3">AI 채팅상담 토큰량</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-3">
        <div>
          <p className="text-gray-600 text-sm mb-1">사용 가능한 토큰</p>
          <p className="text-2xl font-bold text-green-600">
            {formatTokens(remainingTokens)}
          </p>
          <p className="text-xs text-gray-500">
            예상 {summary?.totalEstimatedTurns || 0}턴 사용 가능
          </p>
        </div>

        {/* 사용률 진행바 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">이번 달 사용률</span>
            <span className={`text-xs font-medium ${getUsageColor(usagePercent)}`}>
              {usagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercent >= 90 ? 'bg-red-500' :
                usagePercent >= 70 ? 'bg-orange-500' :
                usagePercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 리셋 정보 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>월간 무료: {formatTokens(summary?.freeTokens || 0)}</span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatResetDate(aiUsage.monthlyResetDate)}
          </span>
        </div>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">무료 토큰</p>
              <p className="font-medium">{formatTokens(summary?.remainingFreeTokens || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600">구매 토큰</p>
              <p className="font-medium">{formatTokens(summary?.remainingPurchasedTokens || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600">총 사용</p>
              <p className="font-medium">{aiUsage.totalTurns}턴</p>
            </div>
            <div>
              <p className="text-gray-600">평균 토큰/턴</p>
              <p className="font-medium">{aiUsage.averageTokensPerTurn}</p>
            </div>
          </div>

          {/* 시뮬레이션 모드 */}
          <div className="mt-4">
            <button
              onClick={() => setSimulationMode(!simulationMode)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <Calculator className="w-4 h-4 mr-1" />
              사용량 시뮬레이션 {simulationMode ? '숨기기' : '보기'}
            </button>

            {simulationMode && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">턴 수</label>
                    <input
                      type="number"
                      value={simulationTurns}
                      onChange={(e) => setSimulationTurns(Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">토큰/턴</label>
                    <input
                      type="number"
                      value={simulationTokens}
                      onChange={(e) => setSimulationTokens(Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      min="100"
                      max="5000"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="preciseMode"
                    checked={preciseMode}
                    onChange={(e) => setPreciseMode(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="preciseMode" className="text-xs text-gray-600">정밀 모드 (1.2배)</label>
                </div>
                {simulationResult?.data && (
                  <div className="text-xs text-gray-700">
                    <p>총 토큰: {simulationResult.data.simulation.totalTokens.toLocaleString()}</p>
                    <p>사용 가능 턴: {simulationResult.data.simulation.canAffordTurns}턴</p>
                    <p>예상 비용: {formatKRW(Math.round(simulationResult.data.simulation.costEstimateKRW))}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 토큰 구매 빠른 버튼 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handlePurchaseTokens(100)}
              disabled={purchaseTokensMutation.isPending}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              100크레딧
            </button>
            <button
              onClick={() => handlePurchaseTokens(300)}
              disabled={purchaseTokensMutation.isPending}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              300크레딧
            </button>
            <button
              onClick={() => handlePurchaseTokens(500)}
              disabled={purchaseTokensMutation.isPending}
              className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              500크레딧
            </button>
          </div>
        </div>
      )}

      {/* 메인 액션 버튼 */}
      <div className="mt-4 space-y-2">
        <button
          onClick={() => router.push('/chat' as any)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Brain className="w-4 h-4 mr-2" />
          AI 채팅 시작
        </button>

        {usagePercent >= 80 && (
          <button
            onClick={() => router.push('/credits')}
            className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors flex items-center justify-center text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            토큰 추가 구매
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          환영합니다, {user.name}님!
        </h1>
        <p className="text-gray-600">
          상담 예약과 크레딧을 관리하세요
        </p>
      </div>

      <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 전문가 찾기 카드 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">전문가 찾기</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    다양한 분야의 전문가와 상담을 예약하세요
                  </p>
                  <button
                    onClick={() => router.push('/experts')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    전문가 보기
                  </button>
                </div>

                {/* AI채팅상담 토큰량 카드 */}
                <AIUsageCard router={router} />

                {/* 크레딧보유량 카드 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">크레딧보유량</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">현재 보유량</p>
                  <p className="text-2xl font-bold text-purple-600 mb-4">
                    {user.credits?.toLocaleString() || 0} 크레딧
                  </p>
                  <button
                    onClick={() => router.push('/credits')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    크레딧 충전
                  </button>
                </div>
              </div>

              {/* 내 예약 섹션 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">최근 예약</h3>
                  <button
                    onClick={() => router.push('/dashboard/reservations')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="text-gray-500 text-center py-8">
                  아직 예약이 없습니다.
                </div>
              </div>

              {/* 퀵 액션 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 시작</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/experts')}
                    className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 border border-blue-200 transition-colors"
                  >
                    전문가 찾기
                  </button>
                  <button
                    onClick={() => router.push('/chat' as any)}
                    className="px-4 py-2 bg-white text-green-600 rounded-md hover:bg-green-50 border border-green-200 transition-colors"
                  >
                    AI 상담 시작
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/expert')}
                    className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-purple-50 border border-purple-200 transition-colors"
                  >
                    전문가 대시보드
                  </button>
                </div>
        </div>
      </div>
    </div>
  );
}