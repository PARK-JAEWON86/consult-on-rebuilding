"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Users, Star, Award, Clock, MessageCircle, Video, Heart, Calendar, MapPin } from "lucide-react";
// ExpertProfile 타입 정의
interface ExpertProfile {
  id: number;
  displayId?: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: number;
  description: string;
  specialties: string[];
  consultationTypes: string[];
  languages?: string[];
  profileImage?: string | null;
  responseTime?: string | number | null;
  level?: number;
  consultationCount?: number;
  totalSessions?: number;
  avgRating?: number;
}
import ExpertLevelBadge from "./ExpertLevelBadge";

// API를 통해 전문가 레벨과 요금 정보를 가져오는 함수
const getExpertLevelPricing = async (expertId: number, totalSessions: number = 0, avgRating: number = 0) => {
  try {
    // 전문가 레벨 정보를 가져옴
    const response = await fetch(`/api/expert-levels?action=getExpertLevel&expertId=${expertId}&totalSessions=${totalSessions}&avgRating=${avgRating}`);
    const data = await response.json();
    
    if (data.currentLevel && data.pricing) {
      return {
        level: data.currentLevel,
        creditsPerMinute: data.pricing.creditsPerMinute,
        tierName: data.levelTitle,
        tierInfo: data.tierInfo
      };
    }
    
    // API에서 데이터를 가져올 수 없는 경우 기본값 반환
    return {
      level: 1,
      creditsPerMinute: 100,
      tierName: "Tier 1 (Lv.1-99)",
      tierInfo: null
    };
  } catch (error) {
    console.error('전문가 레벨 요금 정보 가져오기 실패:', error);
    return {
      level: 1,
      creditsPerMinute: 100,
      tierName: "Tier 1 (Lv.1-99)",
      tierInfo: null
    };
  }
};

import { calculateCreditsByLevel } from "@/utils/expertLevels";

interface ExpertCardProps {
  expert: ExpertProfile | any;
  mode?: 'default' | 'grid' | 'list' | 'hero';
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (expertId: number) => void;
  showProfileButton?: boolean;
  onProfileView?: (expert: any) => void;
  searchContext?: {
    category?: string;
    ageGroup?: string;
    startDate?: string;
    endDate?: string;
  };
}

// 상담 방식 아이콘 함수
const getConsultationTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return Video;
    case "chat":
      return MessageCircle;
    default:
      return MessageCircle;
  }
};

// 답변 시간 텍스트 변환 함수
const getResponseTimeText = (responseTime: string | number | null | undefined): string => {
  if (!responseTime) return "답변 시간 정보 없음";
  if (typeof responseTime === "number") {
    if (responseTime < 60) return `${responseTime}분 내`;
    if (responseTime < 1440) return `${Math.floor(responseTime / 60)}시간 내`;
    return `${Math.floor(responseTime / 1440)}일 내`;
  }
  return responseTime.toString();
};

// 답변 시간 색상 함수
const getResponseTimeColor = (responseTime: string | number | null | undefined): string => {
  if (!responseTime) return "text-gray-400";
  if (typeof responseTime === "number") {
    if (responseTime < 60) return "text-green-500";
    if (responseTime < 1440) return "text-yellow-500";
    return "text-red-500";
  }
  return "text-gray-400";
};

// 전문가 데이터 정규화 함수
const normalizeExpert = (raw: any) => {
  const reviewCount = raw.reviewCount ?? raw.totalConsultations ?? 0;
  const specialties: string[] = Array.isArray(raw.specialties)
    ? raw.specialties
    : Array.isArray(raw.tags)
      ? raw.tags
      : raw.specialty
        ? [raw.specialty]
        : [];
  const consultationTypes: string[] = Array.isArray(raw.consultationTypes)
    ? raw.consultationTypes
    : ["video", "chat"]; // 기본값
  // 공식 랭킹 점수 기반 레벨 사용 (API에서 제공)
  const level = raw.level ?? 1;

  return {
    id: raw.id,
    name: raw.name,
    specialty: raw.specialty ?? (specialties[0] || ""),
    rating: raw.rating ?? 0,
    reviewCount,
    experience: raw.experience ?? 0,
    description: raw.description ?? "",
    specialties,
    consultationTypes,
    languages: raw.languages ?? [],
    profileImage: raw.profileImage ?? raw.image ?? null,
    responseTime: raw.responseTime,
    level,
    consultationCount: raw.consultationCount,
    totalSessions: raw.totalSessions,
    avgRating: raw.avgRating,
  };
};

export default function ExpertCard({
  expert: rawExpert,
  mode = 'default',
  showFavoriteButton = false,
  isFavorite = false,
  onToggleFavorite,
  showProfileButton = true,
  onProfileView,
  searchContext,
}: ExpertCardProps) {
  const router = useRouter();
  const [pricingInfo, setPricingInfo] = useState<{
    level: number;
    creditsPerMinute: number;
    tierName: string;
    tierInfo: any;
  } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // 전문가 데이터 정규화
  const expert = normalizeExpert(rawExpert);

  // 전문가 레벨과 요금 정보 로드
  useEffect(() => {
    const loadPricingInfo = async () => {
      try {
        setIsLoadingPricing(true);
        const pricing = await getExpertLevelPricing(
          expert.id,
          expert.totalSessions || 0,
          expert.avgRating || 0
        );
        setPricingInfo(pricing);
      } catch (error) {
        console.error('요금 정보 로드 실패:', error);
        // 에러 시 기본값 설정
        setPricingInfo({
          level: 1,
          creditsPerMinute: 100,
          tierName: "Tier 1 (Lv.1-99)",
          tierInfo: null
        });
      } finally {
        setIsLoadingPricing(false);
      }
    };

    loadPricingInfo();
  }, [expert.id, expert.totalSessions, expert.avgRating]);

  // 요금 정보가 로딩 중이거나 없을 때 기본값 사용 (레벨은 실시간 계산됨)
  const creditsPerMinute = pricingInfo?.creditsPerMinute || calculateCreditsByLevel(1); // 기본값 사용

  const handleProfileView = () => {
    // 프로필 보기는 로그인 없이도 가능하도록 수정
    if (onProfileView) {
      onProfileView(expert);
    } else if (expert.id) {
      // 검색 컨텍스트가 있으면 URL 파라미터로 전달
      let url = `/experts/${expert.id}`;
      if (searchContext) {
        const params = new URLSearchParams();
        if (searchContext.category) params.set('fromCategory', searchContext.category);
        if (searchContext.ageGroup) params.set('fromAgeGroup', searchContext.ageGroup);
        if (searchContext.startDate) params.set('fromStartDate', searchContext.startDate);
        if (searchContext.endDate) params.set('fromEndDate', searchContext.endDate);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      router.push(url as any);
    }
  };

  // 매칭 모드 (간소화된 카드)
  if (mode === 'grid' || mode === 'list') {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
          mode === "grid" ? "hover:shadow-lg hover:scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 전문가 이미지 */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {expert.name?.charAt(0) || "E"}
              </span>
            </div>
          </div>
        </div>

        {/* 전문가 정보 */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {expert.name || "전문가 이름"}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {expert.specialty || "전문 분야"}
            </p>

            {/* 평점 */}
            <div className="flex items-center space-x-1 mb-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-gray-900">
                {(() => {
                  const displayRating = expert.avgRating || expert.rating || 4.5;
                  return Number(displayRating).toFixed(1);
                })()}
              </span>
              <span className="text-sm text-gray-500">
                ({expert.reviewCount || 12})
              </span>
            </div>
          </div>

          {/* 전문 분야 */}
          <div className="mb-3">
            <div className="flex gap-1.5 overflow-hidden">
              {(expert.specialties || ["전문분야1", "전문분야2"]).map(
                (specialty: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0 whitespace-nowrap"
                  >
                    {specialty}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* 상담 정보 */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{expert.experience || "5"}년 경력</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span>{expert.consultationCount || expert.totalSessions || "50"}회 상담</span>
            </div>
          </div>

          {/* 하단 섹션 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* 가격 정보 */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 text-xl">
                {creditsPerMinute}크레딧
              </span>
              <span className="text-sm text-gray-500">/분</span>
            </div>

            {/* 프로필 보기 버튼 */}
            <button 
              onClick={handleProfileView} 
              className="px-4 py-2 rounded-lg font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm"
            >
              프로필 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 기본 모드 (상세한 카드)
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="p-6">
        {/* 전문가 기본 정보 */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-100">
                {expert.profileImage ? (
                  <img
                    src={expert.profileImage}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* 전문가 레벨 배지 (이름 위) */}
              <div className="mb-1">
                <ExpertLevelBadge
                  expertId={expert.id.toString()}
                  size="md"
                />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {expert.name}
                </h3>
              </div>
              <p className="text-base text-gray-600 font-medium">
                {expert.specialty}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* 좋아요 버튼 */}
            {showFavoriteButton && (
              <button
                onClick={() => onToggleFavorite?.(expert.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? "fill-current" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 평점 및 정보 */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-900 ml-1">
              {Number(expert.avgRating || expert.rating || 4.5).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              ({expert.reviewCount})
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Award className="h-4 w-4 mr-1" />
            {expert.experience}년 경력
          </div>
        </div>

        {/* 설명 */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {expert.description}
        </p>

        {/* 전문 분야 태그 */}
        <div className="flex gap-1.5 overflow-hidden mb-4">
          {(expert.specialties || []).slice(0, 3).map((specialty, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 flex-shrink-0"
            >
              {specialty}
            </span>
          ))}
          {(expert.specialties || []).length > 3 && (
            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex-shrink-0">
              +{(expert.specialties || []).length - 3}
            </span>
          )}
        </div>

        {/* 상담 방식 및 답변 시간 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {(expert.consultationTypes || []).map((type) => {
              const Icon = getConsultationTypeIcon(type);
              return (
                <div
                  key={type}
                  className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  title={type === "video" ? "화상 상담" : "채팅 상담"}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {type === "video" && "화상"}
                  {type === "chat" && "채팅"}
                </div>
              );
            })}
          </div>

          {/* 답변 시간 표시 */}
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Clock
              className={`h-3 w-3 ${getResponseTimeColor(expert.responseTime)}`}
            />
            <span>{getResponseTimeText(expert.responseTime)}</span>
          </div>
        </div>

        {/* 가격 및 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <div className="text-xl font-bold text-gray-900">
              {isLoadingPricing ? (
                <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
              ) : (
                `${creditsPerMinute} 크레딧`
              )}
              <span className="text-sm font-normal text-gray-500">
                /분
              </span>
            </div>
            {/* 시간당 요금 표시 */}
            {!isLoadingPricing && (
              <div className="text-sm text-gray-500">
                시간당 {creditsPerMinute * 60} 크레딧
              </div>
            )}
          </div>
          {showProfileButton && (
            <div className="flex space-x-2">
              <button
                onClick={handleProfileView}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                aria-label={`${expert.name} 전문가 프로필 보기`}
              >
                프로필 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
}
