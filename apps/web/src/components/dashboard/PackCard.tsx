'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createPaymentIntent } from '@/lib/payments';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Check, Star } from 'lucide-react';

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

interface PackCardProps {
  pack: Pack;
}

export default function PackCard({ pack }: PackCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const createPaymentMutation = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: (data: any) => {
      router.push(`/credits/checkout?orderId=${data.displayId}&amount=${data.amount}`);
    },
    onError: () => {
      showToast('error', '결제 요청 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handlePurchase = () => {
    createPaymentMutation.mutate(pack.price);
  };

  const discountPercentage = Math.round((pack.bonusCredits / pack.credits) * 100);

  return (
    <Card
      className={`relative transition-all duration-300 ${
        pack.isRecommended
          ? 'ring-2 ring-blue-500 shadow-lg scale-105'
          : 'hover:shadow-lg hover:scale-102'
      } ${isHovered ? 'shadow-xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 추천 배지 */}
      {pack.isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Star className="w-4 h-4 fill-current" />
            <span>추천</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* 패키지 이름과 설명 */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
          <p className="text-gray-600 text-sm">{pack.description}</p>
        </div>

        {/* 가격 정보 */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ₩{pack.price.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {pack.credits.toLocaleString()} + {pack.bonusCredits.toLocaleString()} 보너스
          </div>
        </div>

        {/* 크레딧 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">총 크레딧</span>
            <span className="text-lg font-semibold text-blue-600">
              {pack.totalCredits.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">사용 가능 시간</span>
            <span className="text-sm font-medium text-gray-900">{pack.usageTime}</span>
          </div>
          {pack.bonusCredits > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">보너스 혜택</span>
              <span className="text-sm font-medium text-green-600">
                +{discountPercentage}% 추가
              </span>
            </div>
          )}
        </div>

        {/* 기능 목록 */}
        <div className="mb-6">
          <ul className="space-y-2">
            {pack.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 구매 버튼 */}
        <Button
          onClick={handlePurchase}
          loading={createPaymentMutation.isPending}
          className={`w-full ${
            pack.isRecommended
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {createPaymentMutation.isPending
            ? '처리 중...'
            : `₩${pack.price.toLocaleString()} 구매하기`}
        </Button>
      </div>
    </Card>
  );
}
