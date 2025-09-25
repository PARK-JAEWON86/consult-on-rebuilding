"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createPaymentIntent } from '@/lib/payments';
import { useToast } from '@/components/ui/Toast';
import { Check, Star, Crown, Zap, Clock, RefreshCw, Gift } from "lucide-react";

interface Pack {
  id: number;
  type: "credit" | "subscription" | "free";
  name: string;
  description: string;
  price: number;
  credits: number;
  bonusCredits?: number;
  totalCredits?: number;
  payPerMinute?: number;
  usageMinutes?: number;
  usageTime?: string;
  extraMinutes?: number;
  features: string[];
  isRecommended?: boolean;
  duration?: number;
  sessions?: number;
}

interface PackCardProps {
  pack: Pack;
}

export default function PackCard({ pack }: PackCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setPurchaseLoading] = useState(false);
  const [subscriptionMode, setSubscriptionMode] = useState(
    pack.type === "subscription"
  );

  const createPaymentMutation = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: (data: any) => {
      router.push(`/credits/checkout?orderId=${data.displayId}&amount=${data.amount}`);
    },
    onError: () => {
      showToast('error', '결제 요청 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handlePurchase = async () => {
    setPurchaseLoading(true);

    try {
      if (pack.type === "subscription") {
        console.log(
          "구독 패키지 구매:",
          pack.name,
          subscriptionMode ? "자동갱신" : "일회성"
        );
      } else if (pack.type === "credit") {
        console.log("크레딧 충전:", pack.credits, "크레딧");
        // 실제 결제 처리
        createPaymentMutation.mutate(pack.price);
      } else if (pack.type === "free") {
        console.log("무료 크레딧 받기:", pack.credits, "크레딧");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      showToast('error', "구매에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const getPackIcon = (pack: Pack) => {
    if (pack.type === "free") return <Gift className="h-6 w-6" />;
    if (pack.type === "subscription") {
      if (pack.name.includes("Basic")) return <Star className="h-6 w-6" />;
      if (pack.name.includes("Pro")) return <Crown className="h-6 w-6" />;
    }
    if (pack.type === "credit") return <Zap className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  const getPackColor = (pack: Pack) => {
    if (pack.type === "free")
      return {
        bg: "bg-green-50",
        icon: "text-green-600",
        button: "bg-green-600 hover:bg-green-700",
        badge: "bg-green-100 text-green-800",
      };
    if (pack.type === "subscription") {
      if (pack.name.includes("Basic"))
        return {
          bg: "bg-blue-50",
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
          badge: "bg-blue-100 text-blue-800",
        };
      if (pack.name.includes("Pro"))
        return {
          bg: "bg-purple-50",
          icon: "text-purple-600",
          button: "bg-purple-600 hover:bg-purple-700",
          badge: "bg-purple-100 text-purple-800",
        };
    }
    // 크레딧 패키지는 모두 스탠다드 충전 컬러로 통일
    if (pack.type === "credit") {
      return {
        bg: "bg-blue-50",
        icon: "text-blue-600",
        // 추천 패키지는 블루 버튼, 나머지는 무채색 버튼
        button: pack.isRecommended
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-gray-600 hover:bg-gray-700",
        badge: "bg-blue-100 text-blue-800",
      };
    }
    // 기본 블루 색상
    return {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
      badge: "bg-blue-100 text-blue-800",
    };
  };

  const colors = getPackColor(pack);
  const isFree = pack.type === "free";
  const isSubscription = pack.type === "subscription";
  const isCredit = pack.type === "credit";
  const isPro = pack.name.includes("Pro");

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden flex flex-col h-full ${
        isHovered ? "shadow-lg transform -translate-y-1" : ""
      } ${
        pack.isRecommended
          ? "border-blue-300 shadow-blue-100 ring-2 ring-blue-200"
          : isPro
            ? "border-purple-200"
            : isFree
              ? "border-green-200"
              : "border-gray-200"
      } ${
        pack.isRecommended && isHovered
          ? "shadow-xl shadow-blue-200 border-blue-400"
          : isHovered
            ? "border-blue-200"
            : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 무료 태그 */}
      {isFree && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-bl-lg text-xs font-medium">
          무료
        </div>
      )}

      {/* 추천 태그 */}
      {pack.isRecommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-bl-lg text-xs font-medium shadow-md">
          ⭐ 추천
        </div>
      )}

      {/* 인기 태그 */}
      {isPro && !pack.isRecommended && (
        <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 rounded-bl-lg text-xs font-medium">
          인기
        </div>
      )}

      {/* 월간 구독 태그 */}
      {isSubscription && (
        <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1 rounded-br-lg text-xs font-medium flex items-center">
          <RefreshCw className="h-3 w-3 mr-1" />
          월간구독
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* 헤더 */}
        <div className="flex items-center space-x-3 mb-4 min-h-[5rem]">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className={colors.icon}>{getPackIcon(pack)}</div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{pack.name}</h3>
            <p className="text-sm text-gray-600">{pack.description}</p>
            {isSubscription && (
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {pack.duration}분 세션 x {pack.sessions}회
              </div>
            )}
          </div>
        </div>

        {/* 가격 */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2 min-h-[3rem]">
            {isFree ? (
              <span className="text-3xl font-bold text-green-600">무료</span>
            ) : (
              <>
                <span className="text-3xl font-bold text-gray-900">
                  {pack.price.toLocaleString()}원
                </span>
                <span className="text-sm text-gray-500">
                  {isSubscription ? "/월" : "일시불"}
                </span>
              </>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-2">
            {isSubscription ? (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
              >
                {pack.sessions}세션 ({pack.duration}분)
              </span>
            ) : (
              <>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
                >
                  {pack.credits} 크레딧 포함
                </span>
                {pack.bonusCredits && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                    +{pack.bonusCredits} 추가크레딧
                  </span>
                )}
              </>
            )}
          </div>

          {!isFree && isSubscription && (
            <div className="mt-2 text-sm text-gray-600 min-h-[1.5rem] flex items-center">
              세션당{" "}
              {Math.round(
                pack.price / (pack.sessions || 1)
              ).toLocaleString()}
              원
              <span className="ml-2 text-green-600 font-medium">
                (분당{" "}
                {Math.round(
                  pack.price / ((pack.sessions || 1) * (pack.duration || 1))
                )}
                원)
              </span>
            </div>
          )}
        </div>

        {/* 기능 목록 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            포함된 기능
          </h4>
          <ul className="space-y-2">
            {pack.features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 추가 혜택 */}
        {(isPro || isSubscription || isFree) && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {isFree ? "시작 혜택" : "구독 혜택"}
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {isFree && (
                <>
                  <li>• 3회 무료 상담 세션</li>
                  <li>• 전문가 매칭 서비스</li>
                  <li>• 상담 요약 제공</li>
                  <li>• 이후 크레딧/구독 선택</li>
                </>
              )}
              {isSubscription && pack.name.includes("Basic") && (
                <>
                  <li>• 매월 3세션 보장</li>
                  <li>• 세션당 15분 상담</li>
                  <li>• 초과 시 분당 과금</li>
                  <li>• 언제든 해지 가능</li>
                </>
              )}
              {isPro && (
                <>
                  <li>• 매월 10세션 보장</li>
                  <li>• 전문가 우선 배정</li>
                  <li>• 상담 요약 PDF</li>
                  <li>• 초과 사용 할인</li>
                  <li>• 우선 고객지원</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* 구독 옵션 (구독 패키지에만 표시) */}
        {isSubscription && (
          <div className="mb-6 p-3 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-900">구독 설정</h4>
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name={`subscription-${pack.id}`}
                  checked={subscriptionMode}
                  onChange={() => setSubscriptionMode(true)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-blue-800">자동 갱신 구독 (5% 할인)</span>
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name={`subscription-${pack.id}`}
                  checked={!subscriptionMode}
                  onChange={() => setSubscriptionMode(false)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-blue-800">1개월 단위 구매</span>
              </label>
            </div>
          </div>
        )}

        {/* 구매 버튼 - 하단에 고정 */}
        <div className="mt-auto">
        <button
          onClick={handlePurchase}
          disabled={isLoading || createPaymentMutation.isPending}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
            colors.button
          } ${(isLoading || createPaymentMutation.isPending) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {(isLoading || createPaymentMutation.isPending) ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              처리 중...
            </div>
          ) : (
            <>
              {isFree && "무료로 시작하기"}
              {isSubscription &&
                (subscriptionMode ? "구독 시작하기" : "1개월 구매하기")}
              {isCredit &&
                (pack.bonusCredits ? (
                  <>
                    {pack.credits} 크레딧
                    <br />
                    (+{pack.bonusCredits} 추가)
                  </>
                ) : (
                  `${pack.credits} 크레딧 충전`
                ))}
            </>
          )}
        </button>

        {/* 추가 정보 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {isFree && "카드 등록 없이 즉시 시작"}
            {isSubscription &&
              (subscriptionMode
                ? "VAT 포함 • 언제든 해지 가능 • 첫 7일 무료"
                : "VAT 포함 • 즉시 사용 가능 • 7일 환불 보장")}
            {isCredit && "VAT 포함 • 즉시 충전 • 사용기한 없음"}
          </p>
        </div>
        </div>
      </div>

      {/* 호버 효과 */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50 pointer-events-none" />
      )}
    </div>
  );
}
