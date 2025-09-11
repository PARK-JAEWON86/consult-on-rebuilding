'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createPaymentIntent } from '@/lib/payments';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CreditCard, LogIn } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  credits: number;
}

export default function CreditsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const { showToast } = useToast();

  // 사용자 인증 상태 확인
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<UserData>('/auth/me').then((r: any) => r.data),
    retry: false,
    // 401 에러는 정상적인 상황(로그인 안함)으로 처리
    throwOnError: (error: any) => {
      return error.status !== 401;
    },
  });

  const isAuthenticated = !!userData?.id;

  // 평균 요금 (분당 크레딧 - 실제 전문가 데이터 기반 평균값)
  const averageRate = 150; // 분당 평균 150크레딧 (150원)

  const createPaymentMutation = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: (data: any) => {
      // 결제 페이지로 이동
      router.push(`/credits/checkout?orderId=${data.displayId}&amount=${data.amount}`);
    },
    onError: () => {
      showToast('error', '결제 요청 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handlePayment = () => {
    if (!isAuthenticated) {
      router.push('/login' as any);
      return;
    }
    
    if (amount < 1000) {
      showToast('warn', '최소 충전 금액은 1,000원입니다.');
      return;
    }
    if (amount > 1000000) {
      showToast('warn', '최대 충전 금액은 1,000,000원입니다.');
      return;
    }
    createPaymentMutation.mutate(amount as any);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const presetAmounts = [10000, 30000, 50000, 100000];

  // 로딩 상태
  if (userLoading) {
    return (
      <main className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </Card>
            </div>
            <div>
              <Card>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태 (401 인증 오류는 제외)
  if (userError && (userError as any).status !== 401) {
    return (
      <main className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <CreditCard className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
            <Button onClick={handleRetry}>
              다시 시도
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // 로그인이 필요한 경우
  if (!isAuthenticated) {
    return (
      <main className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">크레딧 충전</h1>
            <p className="text-gray-600">상담 서비스 이용을 위한 크레딧을 충전하세요</p>
          </div>

          <div className="text-center py-12">
            <LogIn className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">크레딧 충전을 위해서는 먼저 로그인해주세요.</p>
            <Button onClick={() => router.push('/login' as any)}>
              로그인하기
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">크레딧 충전</h1>
          <p className="text-gray-600">상담 서비스 이용을 위한 크레딧을 충전하세요</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 좌측: 잔액 및 내역 */}
          <div className="space-y-6">
            <Card>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">현재 잔액</h2>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  {userData?.credits?.toLocaleString() || 0} <span className="text-lg text-gray-500">크레딧</span>
                </div>
                <p className="text-sm text-gray-600">
                  1 크레딧 = 1원 | 평균 {averageRate}크레딧/분
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 내역</h3>
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">아직 거래 내역이 없습니다</p>
              </div>
            </Card>
          </div>

          {/* 우측: 충전 */}
          <div>
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">크레딧 충전</h2>
            
            {/* 금액 선택 버튼 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                금액 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                {presetAmounts.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    onClick={() => setAmount(presetAmount)}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      amount === presetAmount
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{presetAmount.toLocaleString()}원</div>
                    <div className="text-xs text-gray-500">{presetAmount.toLocaleString()} 크레딧</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 직접 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직접 입력
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  placeholder="충전할 금액을 입력하세요"
                  min="1000"
                  max="1000000"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-gray-500">원</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                최소 1,000원 ~ 최대 1,000,000원
              </p>
            </div>

            {/* 결제 정보 */}
            {amount > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">충전 금액</span>
                  <span className="font-semibold">{amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">받을 크레딧</span>
                  <span className="font-semibold text-blue-600">{amount.toLocaleString()} 크레딧</span>
                </div>
              </div>
            )}

            {/* 결제 버튼 */}
            <Button
              onClick={handlePayment}
              loading={createPaymentMutation.isPending}
              disabled={amount < 1000}
              className="w-full"
            >
              {amount < 1000 ? '금액을 입력하세요' : `${amount.toLocaleString()}원 결제하기`}
            </Button>

              {/* 안내사항 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-blue-900 mb-2">결제 안내</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 충전된 크레딧은 상담 서비스 이용 시 자동으로 차감됩니다</li>
                  <li>• 크레딧은 충전일로부터 1년간 유효합니다</li>
                  <li>• 결제 취소는 충전 후 7일 이내 가능합니다</li>
                  <li>• 전문가별 분당 요금: 평균 {averageRate}크레딧 (전문가에 따라 차이 있음)</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}