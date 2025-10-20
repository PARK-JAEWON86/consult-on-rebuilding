'use client';

import Card from '@/components/ui/Card';
import PackCard from '@/components/dashboard/PackCard';
import { Star } from 'lucide-react';

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

export default function CreditsClient() {
  // 평균 요금 (분당 크레딧 - 실제 전문가 데이터 기반 평균값)
  const averageRate = 150; // 분당 평균 150크레딧 (1,500원)


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

        {/* 패키지 카드들 */}
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
