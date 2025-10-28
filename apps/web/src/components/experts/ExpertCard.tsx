"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Users, Star, Award, Clock, MessageCircle, Video, Phone, Heart, Calendar } from "lucide-react";
// ExpertProfile 타입 정의
interface ExpertProfile {
  id: number;
  displayId: string; // displayId를 필수 필드로 변경
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: number;
  description: string;
  keywords: string[];  // specialties → keywords로 변경
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
    case "voice":
      return Phone;
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
  const keywords: string[] = Array.isArray(raw.keywords)
    ? raw.keywords
    : Array.isArray(raw.tags)
      ? raw.tags
      : raw.specialty
        ? [raw.specialty]
        : [];
  const consultationTypes: string[] = Array.isArray(raw.consultationTypes)
    ? raw.consultationTypes
    : ["video", "chat"]; // 기본값

  // 🎯 레벨 데이터 우선순위: level (page.tsx 변환) → calculatedLevel (직접 API) → 1 (폴백)
  // page.tsx에서 이미 calculatedLevel을 level로 변환해서 전달
  const level = raw.level || raw.calculatedLevel || 1;

  // 디버그: 백엔드 데이터 누락 감지
  if (!raw.level && !raw.calculatedLevel && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ [ExpertCard] 레벨 데이터 누락:', {
      expertId: raw.id,
      expertName: raw.name,
      fallbackLevel: level,
      message: 'level 또는 calculatedLevel 필드가 없음'
    });
  }

  return {
    id: raw.id,
    displayId: raw.displayId ?? raw.id, // displayId가 없으면 id를 사용 (하위 호환성)
    name: raw.name,
    specialty: raw.specialty ?? (keywords[0] || ""),
    rating: raw.rating ?? 0,
    reviewCount,
    experience: raw.experience ?? 0,
    description: raw.description ?? "",
    keywords,
    consultationTypes,
    languages: raw.languages ?? [],
    profileImage: raw.profileImage ?? raw.image ?? null,
    responseTime: raw.responseTime,
    level,
    consultationCount: raw.consultationCount,
    totalSessions: raw.totalSessions,
    avgRating: raw.avgRating,
    // 백엔드에서 제공하는 추가 레벨 정보
    tierInfo: raw.tierInfo,
    creditsPerMinute: raw.creditsPerMinute,
    rankingScore: raw.rankingScore,
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

  // 전문가 데이터 정규화
  const expert = normalizeExpert(rawExpert);

  // 디버깅: 정규화 전후 데이터 확인 및 레벨 소스 확인
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [ExpertCard] Level calculation source:', {
        name: expert.name,
        source: rawExpert.calculatedLevel ? 'BACKEND' : 'CLIENT_ESTIMATED',
        raw_calculatedLevel: rawExpert.calculatedLevel,
        raw_rankingScore: rawExpert.rankingScore,
        raw_tierInfo: rawExpert.tierInfo,
        raw_creditsPerMinute: rawExpert.creditsPerMinute,
        final_level: expert.level,
        final_creditsPerMinute: expert.creditsPerMinute,
        stats: {
          totalSessions: expert.totalSessions,
          avgRating: expert.avgRating,
          reviewCount: rawExpert.reviewCount,
        },
        raw_keywords: rawExpert.keywords,
        normalized_keywords: expert.keywords,
        raw_consultationTypes: rawExpert.consultationTypes,
        normalized_consultationTypes: expert.consultationTypes,
      });
    }
  }, [rawExpert, expert]);

  // 🎯 백엔드에서 제공한 레벨 및 요금 정보 사용 (API 호출 제거)
  useEffect(() => {
    const loadPricingInfo = () => {
      try {
        setIsLoadingPricing(true);

        // 백엔드에서 제공한 데이터 우선 사용
        const level = expert.level || 1;
        const creditsPerMinute = expert.creditsPerMinute || 100;
        const tierInfo = expert.tierInfo;

        setPricingInfo({
          level,
          creditsPerMinute,
          tierName: tierInfo?.name || `Level ${level}`,
          tierInfo
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [ExpertCard] ${expert.name} (ID: ${expert.id}) 요금 정보:`, {
            level,
            creditsPerMinute,
            tierName: tierInfo?.name,
            source: 'BACKEND_DATA'
          });
        }
      } catch (error) {
        console.error('요금 정보 로드 실패:', error);
        // 폴백
        setPricingInfo({
          level: expert.level || 1,
          creditsPerMinute: 100,
          tierName: `Level ${expert.level || 1}`,
          tierInfo: null
        });
      } finally {
        setIsLoadingPricing(false);
      }
    };

    loadPricingInfo();
  }, [expert.id, expert.level, expert.creditsPerMinute, expert.tierInfo]);

  // 요금 정보: 백엔드 제공 데이터 사용
  const creditsPerMinute = pricingInfo?.creditsPerMinute || expert.creditsPerMinute || 100;

  const handleProfileView = () => {
    // 프로필 보기는 로그인 없이도 가능하도록 수정
    if (onProfileView) {
      onProfileView(expert);
    } else if (expert.displayId || expert.id) {
      // displayId 우선 사용, 없으면 id 사용 (하위 호환성)
      const identifier = expert.displayId || expert.id;

      // 검색 컨텍스트가 있으면 URL 파라미터로 전달
      let url = `/experts/${identifier}`;
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
            {/* 레벨 배지 추가 */}
            <div className="mb-2">
              <ExpertLevelBadge
                expertId={expert.id.toString()}
                size="sm"
                level={expert.level}
                tierInfo={expert.tierInfo}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {expert.name || "이름 미등록"}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {expert.specialty || "분야 미정"}
            </p>

            {/* 평점 */}
            <div className="flex items-center space-x-1 mb-2">
              {(() => {
                const rating = expert.avgRating ?? expert.rating ?? 0;
                if (rating === 0) {
                  return (
                    <>
                      <Star className="h-4 w-4 text-gray-300" />
                      <span className="text-sm text-gray-400">평점 없음</span>
                    </>
                  );
                }
                return (
                  <>
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({expert.reviewCount || 0})
                    </span>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 전문 분야 */}
          {expert.keywords && expert.keywords.length > 0 && (
            <div className="mb-3">
              <div className="flex gap-1.5 overflow-hidden">
                {expert.keywords
                  .slice(0, 4)
                  .map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0 whitespace-nowrap"
                    >
                      {keyword}
                    </span>
                  ))}
                {expert.keywords.length > 4 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100 flex-shrink-0 whitespace-nowrap">
                    +{expert.keywords.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 상담 정보 */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{expert.experience || 0}년 경력</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span>{expert.consultationCount || expert.totalSessions || 0}회 상담</span>
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
                  level={expert.level}
                  tierInfo={expert.tierInfo}
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
            {(() => {
              const rating = expert.avgRating ?? expert.rating ?? 0;
              if (rating === 0) {
                return (
                  <>
                    <Star className="h-4 w-4 text-gray-300" />
                    <span className="text-sm text-gray-400 ml-1">평점 없음</span>
                  </>
                );
              }
              return (
                <>
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold text-gray-900 ml-1">
                    {Number(rating).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({expert.reviewCount || 0})
                  </span>
                </>
              );
            })()}
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
          {(expert.keywords || []).slice(0, 3).map((keyword, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 flex-shrink-0"
            >
              {keyword}
            </span>
          ))}
          {(expert.keywords || []).length > 3 && (
            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex-shrink-0">
              +{(expert.keywords || []).length - 3}
            </span>
          )}
        </div>

        {/* 상담 방식 및 답변 시간 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {(expert.consultationTypes || []).map((type) => {
              const Icon = getConsultationTypeIcon(type);
              const typeLabel = type === "video" ? "화상" : type === "chat" ? "채팅" : type === "voice" ? "음성" : type;
              const typeTitle = type === "video" ? "화상 상담" : type === "chat" ? "채팅 상담" : type === "voice" ? "음성 상담" : type;
              return (
                <div
                  key={type}
                  className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  title={typeTitle}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {typeLabel}
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
