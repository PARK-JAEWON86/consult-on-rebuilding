'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchExpertById } from '@/lib/experts';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import RatingStars from '@/components/ui/RatingStars';
import Skeleton from '@/components/ui/Skeleton';
import ReservationModalImproved from '@/components/reservation/ReservationModalImproved';
import { calculateCreditsByLevel, calculateExpertLevel } from '@/utils/expertLevels';
import { useAuth } from '@/components/auth/AuthProvider';
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
  Image as ImageIcon,
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
  Edit,
  Settings
} from "lucide-react";

interface ExpertProfileDetailProps {
  displayId: string;
  isOwner?: boolean;
  showEditMode?: boolean;
  hideBackButton?: boolean;
  hideActions?: boolean;
  hideSidebar?: boolean;
  className?: string;
  onBackClick?: () => void;
}

export default function ExpertProfileDetail({
  displayId,
  isOwner = false,
  showEditMode = false,
  hideBackButton = false,
  hideActions = false,
  hideSidebar = false,
  className = "",
  onBackClick
}: ExpertProfileDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview');
  const [rankingTab, setRankingTab] = useState<'overall' | 'category'>('overall');
  const [isLiked, setIsLiked] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);

  // 사용자 크레딧 잔액 조회
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id && !isOwner
  });

  const { data: expert, isLoading, error } = useQuery({
    queryKey: ['expert', displayId],
    queryFn: () => fetchExpertById(displayId),
    enabled: !!displayId,
  });

  // 전문가 랭킹 정보 조회
  const { data: rankingData, isLoading: isRankingLoading } = useQuery({
    queryKey: ['expert-rankings', expert?.data?.id],
    queryFn: async () => {
      if (!expert?.data?.id) return null;

      // 전체 랭킹과 전문가 개별 통계를 동시에 가져오기
      const [overallRankings, expertStats] = await Promise.all([
        api.get('http://localhost:4000/v1/expert-stats/rankings', { params: { type: 'overall' } }),
        api.get(`http://localhost:4000/v1/expert-stats`, { params: { expertId: expert.data!.id.toString() } })
      ]);

      if (!overallRankings.success || !expertStats.success) {
        return null;
      }

      const rankings = overallRankings.data.rankings || [];
      const currentExpertRanking = rankings.find((r: any) => r.expertId === expert.data!.id.toString());

      return {
        overallRankings: rankings,
        currentExpert: expertStats.data,
        currentRanking: currentExpertRanking
      };
    },
    enabled: !!expert?.data?.id,
  });

  // Debug logging
  console.log('🔍 ExpertProfileDetail debug:', { displayId, isLoading, expert, error, isOwner, showEditMode });
  console.log('📊 Ranking data debug:', { isRankingLoading, rankingData });

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const handleConsultationRequest = () => {
    if (isOwner) {
      showToast('본인은 본인에게 상담을 요청할 수 없습니다.', 'warning');
      return;
    }
    setIsReservationModalOpen(true);
  };

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    showToast(isLiked ? '찜 목록에서 제거되었습니다.' : '찜 목록에 추가되었습니다.', 'success');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `전문가 ${expert?.data?.name}`,
        text: `${expert?.data?.bio || '전문가 프로필을 확인해보세요'}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('링크가 복사되었습니다.', 'success');
    }
  };

  const handleEditProfile = () => {
    router.push(`/dashboard/expert/profile/edit`);
  };

  const handleProfileSettings = () => {
    router.push(`/dashboard/expert/settings`);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {/* 뒤로가기 버튼 */}
          {!hideBackButton && (
            <div className="mb-4">
              <button
                onClick={handleBackClick}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                이전으로
              </button>
            </div>
          )}

          {/* 타이틀 스켈레톤 */}
          <div className="mb-6">
            <Skeleton width={300} height={36} className="mb-2" />
            <Skeleton width={400} height={20} />
          </div>

          {/* 메인 컨텐츠 */}
          <div className="relative flex gap-8">
            <div className="flex-1 min-w-0 w-full lg:w-auto space-y-6">
              <Card>
                <div className="flex items-start space-x-6">
                  <Skeleton variant="rectangular" width={144} height={192} className="rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <Skeleton height={32} />
                    <Skeleton height={20} />
                    <Skeleton height={16} />
                    <div className="flex space-x-2">
                      <Skeleton width={80} height={24} />
                      <Skeleton width={80} height={24} />
                      <Skeleton width={80} height={24} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-80 space-y-6">
              <Card>
                <Skeleton height={200} />
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !expert?.data) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-6">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">전문가를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">
            요청하신 전문가 정보를 찾을 수 없습니다. 다른 전문가를 찾아보세요.
          </p>
          <Button onClick={() => router.push('/experts')}>
            전문가 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 데이터 추출 및 계산
  const expertData = expert.data;
  const expertLevel = (expertData as any).calculatedLevel || calculateExpertLevel(
    (expertData as any).totalSessions || 0,
    expertData.ratingAvg || 0,
    (expertData as any).experience || 0
  );
  const creditsPerMinute = (expertData as any).creditsPerMinute || calculateCreditsByLevel(expertLevel);
  const tierInfo = (expertData as any).tierInfo;

  // 메인 렌더링
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 space-y-6">
        {/* 뒤로가기 버튼 */}
        {!hideBackButton && (
          <div className="mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              이전으로
            </button>
          </div>
        )}

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isOwner ? '프로필 미리보기' : '전문가 프로필'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {isOwner
                  ? '클라이언트에게 보여질 프로필을 확인하세요'
                  : '전문가의 상세 정보와 경력을 확인하세요'}
              </p>
            </div>
            {isOwner && showEditMode && !hideActions && (
              <button
                onClick={handleEditProfile}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Edit className="h-4 w-4 mr-2" />
                프로필 편집하기
              </button>
            )}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="relative flex gap-8">
          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0 w-full lg:w-auto space-y-6">
            {/* 전문가 기본 정보 */}
            <Card>
              <div className="flex items-start space-x-6">
                {/* 왼쪽: 프로필 사진 */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-36 h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center overflow-hidden">
                      {expertData.avatarUrl ? (
                        <img
                          src={expertData.avatarUrl}
                          alt={expertData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 text-4xl font-bold">
                          {expertData.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 모든 정보 */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* 전문가 이름과 전문 분야 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold text-gray-900">{expertData.name}</h1>
                      <Badge variant="blue">{(expertData as any).specialty || expertData.title}</Badge>
                      <Badge variant="primary">
                        {tierInfo?.name || (expertData as any).level || 'Iron (아이언)'}
                      </Badge>
                    </div>
                  </div>

                  {/* 평점 및 정보 */}
                  <div className="flex items-center space-x-4">
                    <RatingStars
                      rating={expertData.ratingAvg}
                      count={expertData.reviewCount}
                      size="sm"
                    />
                    <div className="flex items-center text-sm text-gray-500">
                      <Award className="h-4 w-4 mr-1" />
                      {(expertData as any).experience || 1}년 경력 • Lv.{expertLevel}
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {expertData.bio || (expertData as any).description || "전문가 소개가 없습니다."}
                  </p>

                  {/* 전문 분야 태그 */}
                  <div className="flex gap-2 flex-wrap">
                    {expertData.categories?.map((category, index) => (
                      <Badge key={index} variant="blue">
                        {category}
                      </Badge>
                    ))}
                    {(expertData as any).specialties?.slice(0, 3).map((specialty: any, index: number) => (
                      <Badge key={`specialty-${index}`} variant="gray">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  {/* 통계 정보 */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{(expertData as any).totalSessions || 0}회 상담</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      <span>{(expertData as any).repeatClients || 0}명 재방문</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{(expertData as any).responseTime || "2시간 내"} 응답</span>
                    </div>
                  </div>

                  {/* 상담 방식과 구사 언어 */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* 상담 방식 */}
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">상담 방식</span>
                        <div className="flex flex-wrap gap-2 ml-2">
                          {(expertData as any).consultationTypes?.map((type: any, index: number) => (
                            <span
                              key={index}
                              className={`px-3 py-1 text-sm rounded-full border flex items-center ${
                                type === 'video'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : type === 'chat'
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}
                            >
                              {type === 'video' && <Video className="h-3 w-3 mr-1" />}
                              {type === 'chat' && <MessageCircle className="h-3 w-3 mr-1" />}
                              {type === 'voice' && <Phone className="h-3 w-3 mr-1" />}
                              {type === 'video' && '화상 상담'}
                              {type === 'chat' && '채팅 상담'}
                              {type === 'voice' && '음성 상담'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 구사 언어 */}
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">구사 언어</span>
                        <div className="flex flex-wrap gap-2 ml-2">
                          {(expertData as any).languages?.map((language: any, index: number) => (
                            <Badge key={index} variant="blue">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="border-t border-gray-200 mt-6 pt-0">
                <nav className="flex space-x-8 px-0">
                  {[
                    { id: 'overview', label: '개요' },
                    { id: 'reviews', label: '리뷰' },
                    { id: 'availability', label: '예약 가능 시간' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="pt-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* MBTI 및 상담 스타일 */}
                    {(expertData as any).mbti && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">성격 유형 및 상담 스타일</h3>
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
                          <div className="flex items-start">
                            <Brain className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="mb-2">
                                <span className="inline-block bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                  {(expertData as any).mbti}
                                </span>
                              </div>
                              {(expertData as any).description && (
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {(expertData as any).description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 학력과 이력 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">학력 및 경력</h3>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4">

                        {/* 학력 */}
                        {(expertData as any).education && (expertData as any).education.length > 0 && (
                          <div>
                            <div className="flex items-center mb-2">
                              <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold text-blue-900">학력</h4>
                            </div>
                            <div className="space-y-1 ml-7">
                              {(expertData as any).education.map((edu: any, index: number) => (
                                <p key={index} className="text-gray-700 text-sm">
                                  {typeof edu === 'string' ? edu : `${edu.year || ''} ${edu.degree || ''} ${edu.school || ''}`.trim()}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 실무 경력 */}
                        {(expertData as any).portfolioItems && (expertData as any).portfolioItems.length > 0 && (
                          <div>
                            <div className="flex items-center mb-2">
                              <Award className="h-5 w-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold text-blue-900">실무 경력</h4>
                            </div>
                            <div className="space-y-1 ml-7">
                              {(expertData as any).portfolioItems.map((career: any, index: number) => (
                                <p key={index} className="text-gray-700 text-sm">{career}</p>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* 자격증 섹션 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="h-5 w-5 text-blue-600 mr-2" />
                        자격증 및 포트폴리오
                      </h3>
                      {(expertData as any).certifications && (expertData as any).certifications.length > 0 ? (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                          <div className="grid gap-3">
                            {(expertData as any).certifications.map((cert: any, index: number) => (
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

                    {/* 포트폴리오 파일 */}
                    {(expertData as any).portfolioFiles && (expertData as any).portfolioFiles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">포트폴리오</h3>
                        {(expertData as any).portfolioFiles.length <= 4 ? (
                          // 4개 이하일 때는 기존 그리드 레이아웃
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {(expertData as any).portfolioFiles.map((file: any, index: number) => {
                              const isImage = file.type?.startsWith('image/');
                              return (
                                <div key={index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                  {isImage ? (
                                    // 이미지 파일 - 미리보기와 확대 기능
                                    <div className="relative">
                                      <img
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full aspect-[3/4] object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => setSelectedImage(file.url)}
                                      />
                                      <div className="absolute top-2 right-2">
                                        <button
                                          onClick={() => setSelectedImage(file.url)}
                                          className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                          title="확대해서 보기"
                                        >
                                          <ZoomIn className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <div className="p-2">
                                        <h4 className="text-xs font-medium text-gray-900 truncate">{file.name}</h4>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                          <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // 문서 파일 - 아이콘과 정보만 표시
                                    <div className="p-3 flex flex-col items-center justify-center h-full min-h-[120px]">
                                      <div className="flex-shrink-0 mb-2">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                      </div>
                                      <div className="text-center">
                                        <h4 className="text-xs font-medium text-gray-900 truncate w-full">{file.name}</h4>
                                        <div className="text-xs text-gray-500 mt-1">
                                          <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                        <div className="mt-2">
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                            {file.type?.split('/')[1]?.toUpperCase()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // 4개 초과일 때는 슬라이드 카루셀
                          <div className="relative">
                            {/* 네비게이션 버튼 */}
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  {currentPortfolioIndex + 1} - {Math.min(currentPortfolioIndex + 4, (expertData as any).portfolioFiles.length)} / {(expertData as any).portfolioFiles.length}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setCurrentPortfolioIndex(Math.max(0, currentPortfolioIndex - 4))}
                                  disabled={currentPortfolioIndex === 0}
                                  className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setCurrentPortfolioIndex(Math.min((expertData as any).portfolioFiles.length - 4, currentPortfolioIndex + 4))}
                                  disabled={currentPortfolioIndex + 4 >= (expertData as any).portfolioFiles.length}
                                  className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* 포트폴리오 슬라이드 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {(expertData as any).portfolioFiles.slice(currentPortfolioIndex, currentPortfolioIndex + 4).map((file: any, index: number) => {
                                const isImage = file.type?.startsWith('image/');
                                return (
                                  <div key={currentPortfolioIndex + index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                    {isImage ? (
                                      // 이미지 파일 - 미리보기와 확대 기능
                                      <div className="relative">
                                        <img
                                          src={file.url}
                                          alt={file.name}
                                          className="w-full aspect-[3/4] object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                          onClick={() => setSelectedImage(file.url)}
                                        />
                                        <div className="absolute top-2 right-2">
                                          <button
                                            onClick={() => setSelectedImage(file.url)}
                                            className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                            title="확대해서 보기"
                                          >
                                            <ZoomIn className="h-4 w-4" />
                                          </button>
                                        </div>
                                        <div className="p-2">
                                          <h4 className="text-xs font-medium text-gray-900 truncate">{file.name}</h4>
                                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // 문서 파일 - 아이콘과 정보만 표시
                                      <div className="p-3 flex flex-col items-center justify-center h-full min-h-[120px]">
                                        <div className="flex-shrink-0 mb-2">
                                          <FileText className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="text-center">
                                          <h4 className="text-xs font-medium text-gray-900 truncate w-full">{file.name}</h4>
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                          </div>
                                          <div className="mt-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                              {file.type?.split('/')[1]?.toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 소셜 미디어 링크 */}
                    {(expertData as any).socialLinks && Object.values((expertData as any).socialLinks).some((link: any) => link) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">소셜 미디어</h3>
                        <div className="flex flex-wrap gap-4">
                          {(expertData as any).socialLinks.linkedin && (
                            <a
                              href={(expertData as any).socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-100"
                            >
                              <Linkedin className="h-4 w-4" />
                              <span className="text-sm font-medium">LinkedIn</span>
                            </a>
                          )}
                          {(expertData as any).socialLinks.github && (
                            <a
                              href={(expertData as any).socialLinks.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200"
                            >
                              <Github className="h-4 w-4" />
                              <span className="text-sm font-medium">GitHub</span>
                            </a>
                          )}
                          {(expertData as any).socialLinks.twitter && (
                            <a
                              href={(expertData as any).socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-100"
                            >
                              <Twitter className="h-4 w-4" />
                              <span className="text-sm font-medium">Twitter</span>
                            </a>
                          )}
                          {(expertData as any).socialLinks.instagram && (
                            <a
                              href={(expertData as any).socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg transition-colors border border-pink-100"
                            >
                              <Instagram className="h-4 w-4" />
                              <span className="text-sm font-medium">Instagram</span>
                            </a>
                          )}
                          {(expertData as any).socialLinks.facebook && (
                            <a
                              href={(expertData as any).socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-100"
                            >
                              <Facebook className="h-4 w-4" />
                              <span className="text-sm font-medium">Facebook</span>
                            </a>
                          )}
                          {(expertData as any).socialLinks.youtube && (
                            <a
                              href={(expertData as any).socialLinks.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-100"
                            >
                              <Youtube className="h-4 w-4" />
                              <span className="text-sm font-medium">YouTube</span>
                            </a>
                          )}
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
                              (Lv.{expertLevel} | {tierInfo?.name || (expertData as any).level || 'Iron (아이언)'})
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">취소 정책</span>
                          <span className="text-gray-900">
                            {(expertData as any).cancellationPolicy || "24시간 전 취소 가능"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">일정 변경</span>
                          <span className="text-gray-900">
                            {(expertData as any).reschedulePolicy || "12시간 전 일정 변경 가능"}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      리뷰 ({expertData.reviewCount || 0})
                    </h3>
                    {(expertData as any).reviews && (expertData as any).reviews.length > 0 ? (
                      <div className="space-y-4">
                        {(expertData as any).reviews.map((review: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <RatingStars rating={review.rating || 5} size="sm" />
                                <span className="ml-2 font-medium text-gray-900">
                                  {review.user?.name || '익명'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700">
                              {review.comment || "좋은 상담이었습니다."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">아직 리뷰가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'availability' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 가능 시간</h3>
                    {(expertData as any).availabilitySlots && (expertData as any).availabilitySlots.length > 0 ? (
                      <div className="space-y-4">
                        {/* 주간 일정 요약 */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="text-sm font-semibold text-blue-900">주간 예약 가능 시간</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                              // 요일별로 그룹화
                              const dayMapping: Record<string, string> = {
                                'MONDAY': '월요일',
                                'TUESDAY': '화요일',
                                'WEDNESDAY': '수요일',
                                'THURSDAY': '목요일',
                                'FRIDAY': '금요일',
                                'SATURDAY': '토요일',
                                'SUNDAY': '일요일'
                              };

                              const availabilityByDay = (expertData as any).availabilitySlots.reduce((acc: any, slot: any) => {
                                const day = slot.dayOfWeek;
                                if (!acc[day]) acc[day] = [];
                                acc[day].push(slot);
                                return acc;
                              }, {});

                              // 요일 순서 정렬
                              const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                              const sortedDays = dayOrder.filter(day => availabilityByDay[day]);

                              return sortedDays.map(day => {
                                const daySlots = availabilityByDay[day].sort((a: any, b: any) =>
                                  a.startTime.localeCompare(b.startTime)
                                );

                                return (
                                  <div key={day} className="space-y-2">
                                    <h5 className="text-sm font-medium text-gray-900 flex items-center">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                      {dayMapping[day]}
                                    </h5>
                                    <div className="space-y-1">
                                      {daySlots.map((slot: any, index: number) => (
                                        <div key={index} className="text-sm text-gray-700 ml-4">
                                          <span className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                                            <Clock className="h-3 w-3 mr-1 text-gray-500" />
                                            {slot.startTime} - {slot.endTime}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* 공휴일 상담 안내 */}
                        {(expertData as any).holidaySettings?.acceptHolidayConsultations && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-5 w-5 text-green-600 mr-2" />
                              <h4 className="text-sm font-semibold text-green-900">공휴일 상담 가능</h4>
                            </div>
                            {(expertData as any).holidaySettings?.holidayNote && (
                              <p className="text-sm text-green-700 ml-7">
                                {(expertData as any).holidaySettings.holidayNote}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 예약 안내 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <MessageCircle className="h-5 w-5 text-gray-600 mr-2" />
                            <h4 className="text-sm font-semibold text-gray-900">예약 안내사항</h4>
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>예약은 최소 2시간 전까지 가능합니다</span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>상담 시간: 30분, 60분, 90분 중 선택 가능</span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>취소/변경: {(expertData as any).cancellationPolicy || "24시간 전까지 가능"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 즉시 상담 버튼 */}
                        {!isOwner && (
                          <div className="text-center pt-4">
                            <Button
                              onClick={handleConsultationRequest}
                              className="px-8 py-3"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              상담 일정 예약하기
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              위 시간대 중에서 원하는 시간을 선택하여 예약할 수 있습니다
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">현재 설정된 예약 가능 시간이 없습니다.</p>
                        <p className="text-sm text-gray-400">
                          {isOwner
                            ? "예약 가능 시간을 설정해주세요."
                            : "전문가에게 직접 문의하여 상담 일정을 조율해보세요."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* 우측 사이드바 */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* 상담 예약 카드 (비소유자) 또는 상담 요금 정보 카드 (소유자) */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isOwner ? '상담 요금 정보' : '상담 예약'}
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-900 mb-1">
                    {creditsPerMinute} 크레딧
                  </p>
                  <p className="text-sm text-blue-700">분당</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Lv.{expertLevel} | {tierInfo?.name || (expertData as any).level || 'Iron (아이언)'}
                  </p>
                </div>

                {/* 레벨 및 티어 상세 정보 (소유자일 때만 표시) */}
                {isOwner && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">전문가 레벨</span>
                        <span className="font-medium text-gray-900">Lv.{expertLevel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">티어</span>
                        <span className="font-medium text-gray-900">
                          {tierInfo?.name || (expertData as any).level || 'Iron (아이언)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">총 상담 세션</span>
                        <span className="font-medium text-gray-900">{(expertData as any).totalSessions || 0}회</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">평점</span>
                        <span className="font-medium text-gray-900">{expertData.ratingAvg?.toFixed(1) || '0.0'}점</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 예약 버튼 (비소유자일 때만 표시) */}
                {!isOwner && (
                  <>
                    {/* 크레딧 잔액 표시 */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">내 크레딧</span>
                        <span className="text-lg font-bold text-gray-900">
                          {creditsData?.data?.toLocaleString() || 0} 크레딧
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>30분 상담</span>
                          <span>{Math.ceil(creditsPerMinute * 30).toLocaleString()} 크레딧</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>60분 상담</span>
                          <span>{Math.ceil(creditsPerMinute * 60).toLocaleString()} 크레딧</span>
                        </div>
                      </div>
                    </div>

                    {/* 크레딧 부족 경고 */}
                    {creditsData?.data && creditsData.data < Math.ceil(creditsPerMinute * 30) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800 mb-2">⚠️ 크레딧이 부족합니다</p>
                        <Button
                          variant="outline"
                          className="w-full text-sm"
                          onClick={() => router.push('/credits/purchase' as any)}
                        >
                          크레딧 충전하기
                        </Button>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleConsultationRequest}
                      disabled={creditsData?.data && creditsData.data < Math.ceil(creditsPerMinute * 30)}
                    >
                      상담 예약하기
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      상담 시간에 따라 크레딧이 차감됩니다
                    </p>
                  </>
                )}

                {/* 요금 안내 (소유자일 때만 표시) */}
                {isOwner && (
                  <p className="text-xs text-gray-500 text-center">
                    고객에게 표시되는 상담 요금입니다
                  </p>
                )}
              </div>
            </Card>

            {/* 랭킹 정보 카드 */}
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
                ) : rankingTab === 'overall' ? (
                  <>
                    {/* 전체 랭킹 TOP 5 */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">전체 TOP 5</h4>
                      <div className="space-y-2">
                        {rankingData?.overallRankings?.slice(0, 5).map((item: any, index: number) => {
                          const rank = index + 1;
                          const isCurrentExpert = expert?.data ? item.expertId === expert.data.id?.toString() : false;
                          return (
                            <div
                              key={item.expertId}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                                isCurrentExpert
                                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className={`w-6 text-center font-semibold ${
                                  rank === 1 ? 'text-yellow-600' :
                                  rank === 2 ? 'text-gray-500' :
                                  rank === 3 ? 'text-orange-600' : 'text-gray-400'
                                }`}>
                                  #{rank}
                                </span>
                                <div className="ml-2">
                                  <div className="flex items-center space-x-2">
                                    <span className={`${isCurrentExpert ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                      {item.expertName || `전문가 ${rank}`}
                                    </span>
                                    {isCurrentExpert && (
                                      <span className="text-xs text-blue-600 font-medium">
                                        Lv.{item.level}
                                      </span>
                                    )}
                                  </div>
                                  {isCurrentExpert && (
                                    <div className="flex items-center mt-1">
                                      <Crown className="h-3 w-3 text-blue-600 mr-1" />
                                      <span className="text-xs text-blue-600 font-medium">
                                        {item.tierInfo?.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs ${isCurrentExpert ? 'text-blue-600' : 'text-gray-500'}`}>
                                {item.rankingScore?.toFixed(1) || '0.0'}점
                              </span>
                            </div>
                          );
                        })}

                        {/* 현재 전문가가 TOP 5에 없는 경우 별도 표시 */}
                        {rankingData?.currentRanking && rankingData.currentRanking.ranking > 5 && (
                          <>
                            <div className="text-center text-gray-400 py-2">...</div>
                            <div className="flex items-center justify-between p-2 rounded-lg text-sm bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                              <div className="flex items-center">
                                <span className="w-6 text-center font-semibold text-gray-400">
                                  #{rankingData.currentRanking.ranking}
                                </span>
                                <div className="ml-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-blue-900">
                                      {rankingData.currentRanking.expertName}
                                    </span>
                                    <span className="text-xs text-blue-600 font-medium">
                                      Lv.{rankingData.currentRanking.level}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Crown className="h-3 w-3 text-blue-600 mr-1" />
                                    <span className="text-xs text-blue-600 font-medium">
                                      {rankingData.currentRanking.tierInfo?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-blue-600">
                                {rankingData.currentRanking.rankingScore?.toFixed(1) || '0.0'}점
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 분야별 랭킹 - 현재는 전체 랭킹과 동일하게 표시 (추후 분야별 API 구현 필요) */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {expertData.categories?.[0] || rankingData?.currentRanking?.specialty || '전문분야'} 랭킹
                      </h4>
                      <div className="space-y-2">
                        {rankingData?.overallRankings?.slice(0, 5).map((item: any, index: number) => {
                          const rank = index + 1;
                          const isCurrentExpert = expert?.data ? item.expertId === expert.data.id?.toString() : false;
                          return (
                            <div
                              key={item.expertId}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                                isCurrentExpert
                                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className={`w-6 text-center font-semibold ${
                                  rank === 1 ? 'text-yellow-600' :
                                  rank === 2 ? 'text-gray-500' :
                                  rank === 3 ? 'text-orange-600' : 'text-gray-400'
                                }`}>
                                  #{rank}
                                </span>
                                <span className={`ml-2 ${isCurrentExpert ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                  {item.expertName || `전문가 ${rank}`}
                                </span>
                              </div>
                              <span className={`text-xs ${isCurrentExpert ? 'text-blue-600' : 'text-gray-500'}`}>
                                {item.rankingScore?.toFixed(1) || '0.0'}점
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 전문가 랭킹 상세페이지 버튼 */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => router.push('/experts/rankings')}
                  >
                    전체 랭킹 보기
                  </Button>
                </div>
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

      {/* 예약 모달 */}
      {!isOwner && (
        <ReservationModalImproved
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
          expert={{
            id: expertData.id,
            name: expertData.name,
            displayId: expertData.displayId,
            totalSessions: (expertData as any).totalSessions || 0,
            ratingAvg: expertData.ratingAvg || 0,
            experience: (expertData as any).experience || 0
          }}
          creditsPerMinute={creditsPerMinute}
        />
      )}

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="닫기"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <img
              src={selectedImage}
              alt="확대 이미지"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}