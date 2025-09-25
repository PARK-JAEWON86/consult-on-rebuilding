"use client";

import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchExpertById } from '@/lib/experts';
import {
  Star,
  Clock,
  MessageCircle,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Globe,
  Phone,
  Video,
  ArrowLeft,
  Heart,
  Share2,
  Crown,
  FileText,
  ZoomIn,
  X,
  Brain,
  GraduationCap,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import RatingStars from "@/components/ui/RatingStars";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type ExpertProfileData = {
  name: string;
  specialty: string;
  experience: number | string;
  description: string;
  education: string[];
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  specialties: string[];
  consultationTypes: any[];
  languages: string[];
  hourlyRate: number | string;
  totalSessions: number;
  avgRating: number;
  reviewCount?: number;
  profileImage: string | null;
  portfolioFiles: any[];
  socialLinks?: {
    linkedin: string;
    github: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  mbti?: string;
  portfolioItems?: string[];
  contactInfo: {
    phone: string;
    email: string;
    location: string;
    website: string;
  };
  cancellationPolicy?: string;
  isProfileComplete?: boolean;
  id?: number;
  availabilitySlots?: any[];
};

interface ExpertProfilePreviewProps {
  expertData: Partial<ExpertProfileData>;
}

export default function ExpertProfilePreview({ expertData }: ExpertProfilePreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview'>('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [rankingTab, setRankingTab] = useState<'overall' | 'category'>('overall');

  // 전문가 프로필 실시간 데이터 조회 (전문가 상세페이지와 동일한 방식 사용)
  const { data: liveProfileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['expert-profile-live', expertData.id],
    queryFn: async () => {
      if (!expertData.id) return null;
      try {
        // 먼저 전문가 목록에서 해당 ID의 실제 displayId를 찾기
        const expertsListResponse = await api.get('/experts', { params: { page: 1, size: 50 } });
        if (expertsListResponse.success) {
          const expertInList = expertsListResponse.data.items.find((expert: any) => expert.id === expertData.id);
          if (expertInList && expertInList.displayId) {
            console.log(`🔍 전문가 ID ${expertData.id}의 실제 displayId: ${expertInList.displayId}`);
            // 전문가 상세페이지와 동일한 방식으로 데이터 로드
            const expertDetail = await fetchExpertById(expertInList.displayId);
            if (expertDetail.success) {
              return expertDetail.data;
            }
          }
        }
        return null;
      } catch (error) {
        console.warn('실시간 프로필 로드 실패, 캐시 데이터 사용:', error);
        return null;
      }
    },
    enabled: !!expertData.id,
    staleTime: 30000, // 30초간 데이터를 fresh로 간주
    refetchOnWindowFocus: true,
  });

  // 전문가 랭킹 정보 조회 (실제 API 사용)
  const { data: rankingData, isLoading: isRankingLoading } = useQuery({
    queryKey: ['expert-rankings', expertData.id],
    queryFn: async () => {
      if (!expertData.id) return null;
      try {
        // 전체 랭킹과 전문가 개별 통계를 동시에 가져오기 (표준화된 API 클라이언트 사용)
        const [overallRankings, expertStats] = await Promise.all([
          api.get('/expert-stats/rankings', { params: { type: 'overall' } }),
          api.get(`/expert-stats`, { params: { expertId: expertData.id.toString() } })
        ]);

        if (!overallRankings.success || !expertStats.success) {
          return null;
        }

        const rankings = overallRankings.data.rankings || [];
        const currentExpertRanking = rankings.find((r: any) => r.expertId === expertData.id?.toString());

        return {
          overallRankings: rankings,
          currentRanking: currentExpertRanking || { rank: '-', score: 0, specialty: expertData.specialty || "전문분야" }
        };
      } catch (error) {
        console.error('랭킹 데이터 로드 실패:', error);
        return null;
      }
    },
    enabled: !!expertData.id,
  });

  // 실시간 데이터와 로컬 데이터를 병합
  const mergedData = liveProfileData ? { ...expertData, ...liveProfileData } : expertData;

  // 디버깅용 로그
  console.log('🔍 ExpertProfilePreview 데이터 상태:', {
    expertData: expertData,
    liveProfileData: liveProfileData,
    mergedData: mergedData,
    isProfileLoading: isProfileLoading,
    hasLiveData: !!liveProfileData,
    expertId: expertData?.id,
    dataSource: liveProfileData ? 'API Database' : 'Local Cache'
  });

  // 병합된 데이터에서 기본값 설정 (데이터베이스 구조 반영)
  const name = mergedData.name || (mergedData as any).fullName || "전문가 이름";
  const specialty = mergedData.specialty || "전문분야";
  const experience = mergedData.experience || (mergedData as any).experienceYears || 0;
  const totalSessions = mergedData.totalSessions || 0;
  const avgRating = (mergedData as any).avgRating || (mergedData as any).ratingAvg || 0;
  const reviewCount = mergedData.reviewCount || 0;
  const description = mergedData.description || (mergedData as any).bio || "";
  const creditsPerMinute = Math.ceil((Number(mergedData.hourlyRate) || Number((mergedData as any).pricePerMinute) * 60 || 50) / 60);

  const tabs = [
    { key: 'overview', label: '개요' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            {/* 전문가 프로필 카드 */}
            <Card className="mb-6">
              <div className="flex items-start space-x-6">
                {/* 프로필 이미지 */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-40 bg-gray-200 rounded-lg overflow-hidden">
                    {mergedData.profileImage ? (
                      <img
                        src={mergedData.profileImage}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                        <Crown className="h-5 w-5 text-yellow-500" />
                      </div>
                      <p className="text-lg text-gray-600 mb-1">{specialty}</p>
                      <p className="text-sm text-gray-500 mb-3">경력 {experience}년</p>

                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center">
                          <RatingStars rating={avgRating} size="sm" />
                          <span className="ml-2 text-sm text-gray-600">
                            {avgRating.toFixed(1)} ({reviewCount}개 리뷰)
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {totalSessions}회 상담
                        </div>
                      </div>

                      {/* 전문 분야 */}
                      {mergedData.specialties && mergedData.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mergedData.specialties.slice(0, 4).map((spec, index) => (
                            <Badge key={index} variant="secondary">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* 언어 */}
                      {mergedData.languages && mergedData.languages.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="h-4 w-4 mr-2" />
                          {mergedData.languages.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 탭 네비게이션 */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* 탭 컨텐츠 - 개요 섹션 */}
            <div className="space-y-6">
              <div className="space-y-6">
                {/* MBTI 및 상담 스타일 */}
                {(mergedData.mbti || mergedData.description) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">성격 유형 및 상담 스타일</h3>
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
                      <div className="flex items-start">
                        <Brain className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          {expertData.mbti && (
                            <div className="mb-2">
                              <span className="inline-block bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                {expertData.mbti}
                              </span>
                            </div>
                          )}
                          {expertData.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {expertData.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 학력 및 경력 */}
                {((mergedData.education && mergedData.education.length > 0) || (mergedData.portfolioItems && mergedData.portfolioItems.length > 0)) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">학력 및 경력</h3>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4">
                      {/* 학력 */}
                      {mergedData.education && mergedData.education.length > 0 && (
                        <div>
                          <div className="flex items-center mb-2">
                            <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold text-blue-900">학력</h4>
                          </div>
                          <div className="space-y-1 ml-7">
                            {mergedData.education.map((edu: any, index: number) => (
                              <p key={index} className="text-gray-700 text-sm">{edu}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 실무 경력 */}
                      {mergedData.portfolioItems && mergedData.portfolioItems.length > 0 && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Award className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold text-blue-900">실무 경력</h4>
                          </div>
                          <div className="space-y-1 ml-7">
                            {mergedData.portfolioItems.map((career: any, index: number) => (
                              <p key={index} className="text-gray-700 text-sm">{career}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 자격증 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 text-blue-600 mr-2" />
                    자격증 및 인증
                  </h3>
                  {mergedData.certifications && mergedData.certifications.length > 0 ? (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <div className="grid gap-3">
                        {mergedData.certifications.map((cert: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center bg-white border border-green-200 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <span className="text-gray-800 font-medium">
                                {typeof cert === 'string' ? cert : cert?.name || '자격증'}
                              </span>
                              {typeof cert === 'object' && cert?.issuer && (
                                <p className="text-gray-500 text-sm">{cert.issuer}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <Badge variant="green" className="text-xs">
                                인증됨
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">등록된 자격증이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">전문가가 자격증을 추가하면 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>

                {/* 포트폴리오 */}
                {expertData.portfolioFiles && expertData.portfolioFiles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">포트폴리오</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {expertData.portfolioFiles.map((file: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                          <div className="relative">
                            <div className="w-full aspect-[3/4] bg-gray-200 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="p-2">
                              <h4 className="text-xs font-medium text-gray-900 truncate">{file.name || `파일 ${index + 1}`}</h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 상담 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">상담 정보</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">분당 상담료</span>
                      <span className="font-semibold text-gray-900">
                        {creditsPerMinute} 크레딧
                        <span className="text-sm text-gray-500 ml-1">
                          (경력 {experience}년)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">취소 정책</span>
                      <span className="text-gray-900">
                        {expertData.cancellationPolicy || "24시간 전 취소 가능"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">일정 변경</span>
                      <span className="text-gray-900">
                        {(mergedData as any).reschedulePolicy || "12시간 전 일정 변경 가능"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 사이드바 */}
          <div className="space-y-6">
            {/* 상담료 정보 카드 */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상담료 정보</h3>
              <div className="space-y-4">
                <div className="text-center py-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 mb-1">
                    {creditsPerMinute}
                  </p>
                  <p className="text-sm text-blue-600">크레딧 / 분</p>
                </div>
                <div className="text-center text-xs text-gray-500">
                  클라이언트에게 표시되는 분당 상담료입니다
                </div>
              </div>
            </Card>

            {/* 예약 가능시간 카드 */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                예약 가능시간
              </h3>
              {mergedData.availabilitySlots && mergedData.availabilitySlots.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-900">주간 예약 가능 시간</h4>
                      <div className="text-sm text-blue-800">
                        설정된 예약 가능 시간이 표시됩니다.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    * 실제 예약은 최소 2시간 전까지 가능합니다
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">예약 가능시간을 설정해주세요</p>
                  <p className="text-xs text-gray-400 mt-1">클라이언트가 예약할 수 있는 시간대를 설정하세요</p>
                </div>
              )}
            </Card>

            {/* 전문가 랭킹 카드 */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">전문가 랭킹</h3>
              {/* 랭킹 탭 네비게이션 */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setRankingTab('overall')}
                  className={`flex-1 py-2 px-1 text-sm font-medium border-b-2 ${
                    rankingTab === 'overall'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  전체 랭킹
                </button>
                <button
                  onClick={() => setRankingTab('category')}
                  className={`flex-1 py-2 px-1 text-sm font-medium border-b-2 ${
                    rankingTab === 'category'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  분야별 랭킹
                </button>
              </div>
              <div className="space-y-4">
                {isRankingLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between p-2 bg-gray-50 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">랭킹 정보를 불러오는 중입니다.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* 안내 카드 */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">안내</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">실명 인증</p>
                    <p className="text-sm text-gray-600">모든 전문가는 신원이 확인되었습니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">안전한 결제</p>
                    <p className="text-sm text-gray-600">상담 완료 후 결제가 처리됩니다</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">24시간 지원</p>
                    <p className="text-sm text-gray-600">AI 챗봇으로 즉시 도움을 받아보세요</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="확대 이미지"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}