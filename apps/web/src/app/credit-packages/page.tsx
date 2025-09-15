'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CreditPackagesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/credit-packages');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const creditPackages = [
    {
      id: 1,
      name: '기본 패키지',
      credits: 10,
      price: 10000,
      description: '간단한 상담에 적합한 크레딧'
    },
    {
      id: 2,
      name: '표준 패키지',
      credits: 30,
      price: 25000,
      description: '자주 이용하시는 분에게 추천',
      popular: true
    },
    {
      id: 3,
      name: '프리미엄 패키지',
      credits: 60,
      price: 45000,
      description: '많은 상담이 필요한 분에게 추천'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">크레딧 충전</h1>
        <p className="mt-1 text-sm text-gray-600">
          상담에 필요한 크레딧을 충전하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative bg-white rounded-lg shadow-md p-6 ${
              pkg.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  인기
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">{pkg.credits}</span>
                <span className="text-gray-600 ml-1">크레딧</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-blue-600">
                  {pkg.price.toLocaleString()}원
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{pkg.description}</p>
              
              <button
                className={`mt-6 w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  pkg.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                onClick={() => {
                  // TODO: 결제 로직 구현
                  alert(`${pkg.name} 결제 기능은 준비 중입니다.`);
                }}
              >
                구매하기
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">크레딧 사용 안내</h3>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>• 1크레딧 = 1분 상담 (채팅/음성/영상)</li>
          <li>• 크레딧은 구매 후 즉시 사용 가능합니다</li>
          <li>• 미사용 크레딧은 환불되지 않습니다</li>
        </ul>
      </div>
    </div>
  );
}


