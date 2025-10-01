'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createPaymentIntent } from '@/lib/payments';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PackCard from '@/components/dashboard/PackCard';
import { User } from '@/lib/auth';
import { LogIn, CreditCard, Star } from 'lucide-react';

interface CreditsClientProps {
  user: User;
}

interface Pack {
  id: number;
  type: 'credit';
  name: string;
  description: string;
  price: number;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  usageTime: string;
  isRecommended?: boolean;
  features: string[];
}

export default function CreditsClient({ user }: CreditsClientProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const { showToast } = useToast();

  // 평균 요금 (분당 크레딧 - 실제 전문가 데이터 기반 평균값)
  const averageRate = 150; // 분당 평균 150크레딧 (1,500원)

  const createPaymentMutation = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: (data: any) => {
      router.push(`/credits/checkout?orderId=${data.displayId}&amount=${data.amount}`);
    },
    onError: () => {
      showToast('error', '결제 요청 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handlePayment = () => {
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


  // 크레딧 패키지 데이터
  const packs: Pack[] = [
    {
      id: 1,
      type: 'credit',
      name: '베이직 충전',
      description: '상담 1회를 충분히 할 수 있는 기본 패키지',
      price: 50000,
      credits: 5000,
      bonusCredits: 500, // 10% 보너스
      totalCredits: 5500,
      usageTime: `약 ${Math.floor(5500 / averageRate)}분`,
      features: [
        '5,000 + 500 보너스 크레딧',
        '총 5,500 크레딧 제공',
        '상담 1회 충분히 가능 (약 36분)',
        'AI 상담 및 전문가 상담에 사용 가능',
        '10% 보너스 혜택',
        '사용기한 없음',
      ],
    },
    {
      id: 2,
      type: 'credit',
      name: '스탠다드 충전',
      description: '가장 인기있는 추천 패키지, 여러 번 상담 가능',
      price: 80000,
      credits: 8000,
      bonusCredits: 1200, // 15% 보너스
      totalCredits: 9200,
      usageTime: `약 ${Math.floor(9200 / averageRate)}분`,
      isRecommended: true,
      features: [
        '8,000 + 1,200 보너스 크레딧',
        '총 9,200 크레딧 제공',
        '상담 2회 충분히 가능 (약 61분)',
        'AI 상담 및 전문가 상담에 사용 가능',
        '15% 보너스 혜택',
        '우선 고객지원',
        '사용기한 없음',
      ],
    },
    {
      id: 3,
      type: 'credit',
      name: '프리미엄 충전',
      description: '대용량 충전으로 최대 혜택, 장기 이용 고객용',
      price: 150000,
      credits: 15000,
      bonusCredits: 3000, // 20% 보너스
      totalCredits: 18000,
      usageTime: `약 ${Math.floor(18000 / averageRate)}분`,
      features: [
        '15,000 + 3,000 보너스 크레딧',
        '총 18,000 크레딧 제공',
        '상담 4회 충분히 가능 (약 120분)',
        'AI 상담 및 전문가 상담에 사용 가능',
        '20% 보너스 혜택',
        'VIP 고객지원',
        '전문가 우선 매칭',
        '사용기한 없음',
      ],
    },
  ];

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">크레딧 충전</h1>
          <p className="text-gray-600">
            상담에 필요한 크레딧을 충전하세요. 충전량이 많을수록 더 많은 보너스 혜택을 받을 수 있습니다.
          </p>
        </div>

        {/* 전문가 레벨별 과금 체계 안내 */}
        <div className="mb-4">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="px-4 py-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                전문가 레벨별 과금 체계
              </h3>
              <div className="text-xs text-blue-800">
                <span>
                  <strong>일반적인 요금:</strong> 분당 120~180 크레딧 (₩1,200~₩1,800) | <strong>평균:</strong> 분당 약 {averageRate} 크레딧 (₩{(averageRate * 10).toLocaleString()}) |
                  <span className="text-blue-600">상담 예약 시 정확한 요금 확인</span>
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* 상단: 현재 잔액, 최근 내역, 직접 충전 - 가로 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* 현재 잔액 */}
          <Card>
            <div className="py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">현재 잔액</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {user.credits?.toLocaleString() || 0} <span className="text-lg text-gray-500">크레딧</span>
                </div>
                <p className="text-sm text-gray-600">
                  1 크레딧 = 10원 | 평균 {averageRate}크레딧/분
                </p>
              </div>
            </div>
          </Card>

          {/* 최근 내역 */}
          <Card>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">최근 내역</h3>
              <div className="text-center py-4">
                <CreditCard className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                <p className="text-sm text-gray-500">아직 거래 내역이 없습니다</p>
              </div>
            </div>
          </Card>

          {/* 직접 충전 */}
          <Card>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">직접 충전</h3>

              {!showCustomAmount ? (
                <div className="text-center py-4">
                  <Button
                    onClick={() => setShowCustomAmount(true)}
                    variant="outline"
                    className="w-full"
                  >
                    직접 입력하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      충전할 금액
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount || ''}
                        onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                        placeholder="충전할 금액을 입력하세요"
                        min="1000"
                        max="1000000"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500">원</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      최소 1,000원 ~ 최대 1,000,000원
                    </p>
                  </div>

                  {amount > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">충전 금액</span>
                        <span className="font-semibold">{amount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">받을 크레딧</span>
                        <span className="font-semibold text-blue-600">{amount.toLocaleString()} 크레딧</span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={handlePayment}
                      loading={createPaymentMutation.isPending}
                      disabled={amount < 1000}
                      className="flex-1"
                    >
                      {amount < 1000 ? '금액을 입력하세요' : `${amount.toLocaleString()}원 결제하기`}
                    </Button>
                    <Button
                      onClick={() => setShowCustomAmount(false)}
                      variant="outline"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 하단: 패키지 카드들 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">크레딧 충전 패키지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>

        {/* 패키지 비교 테이블 - 데스크톱용 */}
        <div className="hidden lg:block mb-8">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">크레딧 충전 비교</h3>
              <p className="mt-1 text-sm text-gray-600">
                각 충전 옵션의 혜택, 보너스, 사용 가능 시간을 비교해보세요.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      패키지
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기본 크레딧
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      보너스
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 크레딧
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용 가능 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packs.map((pack) => (
                    <tr key={pack.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {pack.name}
                          {pack.isRecommended && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                              추천
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pack.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          ₩{pack.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {pack.credits} 크레딧
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {pack.bonusCredits && pack.bonusCredits > 0 ? (
                            <span className="text-green-600 font-medium">
                              +{pack.bonusCredits}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {pack.totalCredits} 크레딧
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-blue-600">
                          {pack.usageTime}
                        </div>
                        <div className="text-xs text-gray-500">
                          (평균 {averageRate}크레딧/분 기준)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 안내사항 */}
        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h4 className="font-medium text-blue-900 mb-3">결제 안내</h4>
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
    </main>
  );
}
