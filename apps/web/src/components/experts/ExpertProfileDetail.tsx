'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchExpertById } from '@/lib/experts';
import { createInquiry } from '@/lib/inquiries';
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
  Linkedin,
  Instagram,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Edit,
  Settings,
  Mail,
  Send,
  DollarSign,
  Tv,
  HelpCircle,
  Eye,
  EyeOff
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
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryTab, setInquiryTab] = useState<'schedule' | 'time' | 'price' | 'method' | 'other'>('schedule');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [isInquirySuccessModalOpen, setIsInquirySuccessModalOpen] = useState(false);
  const [isInquiryErrorModalOpen, setIsInquiryErrorModalOpen] = useState(false);
  const [inquiryErrorDetails, setInquiryErrorDetails] = useState({ message: '', code: '', status: '' });

  // 사용자 크레딧 잔액 조회
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.get(`/credits/balance?userId=${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id && !isOwner
  });

  const { data: expert, isLoading, error } = useQuery({
    queryKey: ['expert', displayId],
    queryFn: () => fetchExpertById(displayId),
    enabled: !!displayId,
  });

  // expert 데이터가 로드되면 isProfilePublic 상태 업데이트
  useEffect(() => {
    if (expert?.data?.isProfilePublic !== undefined) {
      setIsProfilePublic(expert.data.isProfilePublic);
    }
  }, [expert]);

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
  console.log('📅 Availability data debug:', {
    availabilitySlots: (expert?.data as any)?.availabilitySlots,
    holidaySettings: (expert?.data as any)?.holidaySettings,
    restTimeSettings: (expert?.data as any)?.restTimeSettings
  });
  console.log('🎯 Level calculation debug:', {
    calculatedLevel: (expert?.data as any)?.calculatedLevel,
    rankingScore: (expert?.data as any)?.rankingScore,
    tierInfo: (expert?.data as any)?.tierInfo,
    creditsPerMinute: (expert?.data as any)?.creditsPerMinute,
    totalSessions: (expert?.data as any)?.totalSessions,
    avgRating: (expert?.data as any)?.ratingAvg,
  });

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

  const handleInquiryOpen = () => {
    if (isOwner) {
      showToast('본인에게 문의할 수 없습니다.', 'warning');
      return;
    }
    if (!user) {
      showToast('로그인이 필요합니다.', 'warning');
      router.push('/auth/login');
      return;
    }
    setIsInquiryModalOpen(true);
  };

  const getInquiryPlaceholder = () => {
    const placeholders = {
      schedule: `상담 일정에 대해 문의하고 싶은 내용을 작성해주세요.

예시:
- 다음 주 월요일 오후 2시에 상담이 가능한가요?
- 평일 저녁 시간대에 상담 가능하신지 궁금합니다.
- 주말 상담도 가능한가요?`,
      time: `상담 시간에 대해 문의하고 싶은 내용을 작성해주세요.

예시:
- 30분 상담으로 충분할까요, 아니면 60분이 필요할까요?
- 첫 상담은 보통 얼마나 걸리나요?
- 상담 시간 연장이 가능한가요?`,
      price: `상담 비용에 대해 문의하고 싶은 내용을 작성해주세요.

예시:
- 패키지 할인이 있나요?
- 여러 회차를 묶어서 결제하면 할인이 되나요?
- 장기 상담 계약 시 특별 요금이 있나요?
- 상담 시간에 따른 비용 차이가 어떻게 되나요?`,
      method: `상담 방식에 대해 문의하고 싶은 내용을 작성해주세요.

예시:
- 화상 상담과 음성 상담 중 어떤 것을 추천하시나요?
- 텍스트 상담도 가능한가요?
- 상담 전 준비해야 할 자료가 있나요?
- 화면 공유가 필요한 상담도 가능한가요?`,
      other: `기타 문의하고 싶은 내용을 자유롭게 작성해주세요.

예시:
- 전문가님의 주요 상담 분야가 궁금합니다.
- 특정 주제에 대한 전문성이 있으신지 확인하고 싶습니다.
- 상담 후 추가 지원이나 피드백을 받을 수 있나요?`
    };
    return placeholders[inquiryTab];
  };

  const getInquiryTitle = () => {
    const titles = {
      schedule: '상담 일정 문의',
      time: '상담 시간 문의',
      price: '상담 비용 문의',
      method: '상담 방식 문의',
      other: '기타 문의'
    };
    return titles[inquiryTab];
  };

  const handleSendInquiry = async () => {
    if (!inquirySubject.trim() || !inquiryContent.trim()) {
      showToast('제목과 내용을 모두 입력해주세요.', 'error');
      return;
    }

    if (!expertData) {
      showToast('전문가 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
      return;
    }

    setIsSendingInquiry(true);

    try {
      await createInquiry({
        expertId: expertData.id,
        subject: inquirySubject,
        content: inquiryContent,
        category: inquiryTab as 'schedule' | 'time' | 'price' | 'method' | 'other'
      });

      // 성공 모달 표시
      setIsInquirySuccessModalOpen(true);
      showToast('문의가 전송되었습니다.', 'success');

      // 입력 내용 초기화
      setInquirySubject('');
      setInquiryContent('');
      setInquiryTab('schedule');
    } catch (error: any) {
      console.error('문의 전송 실패:', error);

      // 오류 메시지 상세하게 표시
      const errorMessage = error?.response?.data?.error?.message || '알 수 없는 오류가 발생했습니다.';
      const errorCode = error?.response?.data?.error?.code || 'UNKNOWN_ERROR';
      const statusCode = String(error?.response?.status || '알 수 없음');

      setInquiryErrorDetails({
        message: errorMessage,
        code: errorCode,
        status: statusCode
      });
      setIsInquiryErrorModalOpen(true);
      showToast(errorMessage, 'error');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleEditProfile = () => {
    router.push(`/dashboard/expert/profile/edit`);
  };

  const handleProfileSettings = () => {
    router.push(`/dashboard/expert/settings`);
  };

  const handleToggleProfilePublic = async () => {
    if (!expert?.data?.id) {
      showToast('전문가 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    setIsTogglingPublic(true);

    try {
      const newPublicState = !isProfilePublic;

      const response = await api.put(`/experts/${displayId}/profile`, {
        isProfilePublic: newPublicState
      });

      if (response.success) {
        setIsProfilePublic(newPublicState);
        showToast(
          newPublicState
            ? '프로필이 공개되었습니다. 이제 전문가 찾기 페이지에 표시됩니다.'
            : '프로필이 비공개되었습니다. 전문가 찾기 페이지에 표시되지 않습니다.',
          'success'
        );
      } else {
        throw new Error(response.error?.message || '프로필 공개 상태 변경 실패');
      }
    } catch (error) {
      console.error('프로필 공개 상태 변경 중 오류:', error);
      showToast('프로필 공개 상태 변경에 실패했습니다.', 'error');
    } finally {
      setIsTogglingPublic(false);
    }
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

  // 공휴일 설정 디버깅
  console.log('🔍 공휴일 설정 상세 디버그:', {
    'expert.data 전체': expertData,
    'holidaySettings': (expertData as any).holidaySettings,
    'acceptHolidayConsultations': (expertData as any).holidaySettings?.acceptHolidayConsultations,
    'holidayNote': (expertData as any).holidaySettings?.holidayNote,
    'availability': (expertData as any).availability,
  });

  // 백엔드에서 제공하는 calculatedLevel 우선 사용
  const expertLevel = (expertData as any).calculatedLevel || calculateExpertLevel(
    (expertData as any).totalSessions || 0,
    expertData.ratingAvg || 0,
    (expertData as any).experience || 0
  );

  // 백엔드에서 제공하는 creditsPerMinute 우선 사용
  const creditsPerMinute = (expertData as any).creditsPerMinute || calculateCreditsByLevel(expertLevel);

  // 백엔드에서 제공하는 tierInfo 우선 사용
  const tierInfo = (expertData as any).tierInfo;

  // 레벨 계산 소스 로깅 (디버깅용)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 [ExpertProfileDetail] Level calculation source:', {
      source: (expertData as any).calculatedLevel ? 'BACKEND' : 'CLIENT_ESTIMATED',
      calculatedLevel: (expertData as any).calculatedLevel,
      clientCalculated: calculateExpertLevel(
        (expertData as any).totalSessions || 0,
        expertData.ratingAvg || 0,
        (expertData as any).experience || 0
      ),
      finalLevel: expertLevel,
      creditsSource: (expertData as any).creditsPerMinute ? 'BACKEND' : 'CLIENT_CALCULATED',
      backendCredits: (expertData as any).creditsPerMinute,
      finalCredits: creditsPerMinute,
      tierInfo: tierInfo,
      stats: {
        totalSessions: (expertData as any).totalSessions,
        avgRating: expertData.ratingAvg,
        reviewCount: (expertData as any).reviewCount,
      }
    });
  }

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
              <div className="flex items-center gap-3">
                {/* 프로필 공개/비공개 토글 버튼 */}
                <button
                  onClick={handleToggleProfilePublic}
                  disabled={isTogglingPublic}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium border-2 ${
                    isProfilePublic
                      ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  } ${isTogglingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isProfilePublic ? '프로필 비공개로 전환' : '프로필 공개로 전환'}
                >
                  {isTogglingPublic ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : isProfilePublic ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2" />
                  )}
                  {isProfilePublic ? '프로필 공개 중' : '프로필 비공개'}
                </button>

                {/* 프로필 편집하기 버튼 */}
                <button
                  onClick={handleEditProfile}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 편집하기
                </button>
              </div>
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
                    <div className="w-48 h-72 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center overflow-hidden">
                      {((expertData as any).profileImage || expertData.avatarUrl) ? (
                        <img
                          src={(expertData as any).profileImage || expertData.avatarUrl}
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
                    {(expertData as any).keywords?.map((specialty: any, index: number) => (
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
                      {(expertData as any).responseTimeStats?.isCalculated && (
                        <span
                          className="ml-2 text-xs text-gray-500"
                          title={`최근 ${(expertData as any).responseTimeStats.sampleSize}건 응답 기준`}
                        >
                          (실제 데이터)
                        </span>
                      )}
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
                    {/* 성격 유형 및 상담 스타일 */}
                    {((expertData as any).mbti || (expertData as any).consultationStyle) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">성격 유형 및 상담 스타일</h3>
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4 space-y-4">

                          {/* 성격 유형 (MBTI) */}
                          {(expertData as any).mbti && (
                            <div>
                              <div className="flex items-center mb-2">
                                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                                <h4 className="font-semibold text-purple-900">성격 유형 (MBTI)</h4>
                              </div>
                              <div className="ml-7">
                                <span className="inline-block bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                  {(expertData as any).mbti}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 상담 스타일 */}
                          {(expertData as any).consultationStyle && (
                            <div>
                              <div className="flex items-center mb-2">
                                <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
                                <h4 className="font-semibold text-purple-900">상담 스타일</h4>
                              </div>
                              <div className="ml-7">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {(expertData as any).consultationStyle}
                                </p>
                              </div>
                            </div>
                          )}

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
                              {(expertData as any).education.map((edu: any, index: number) => {
                                if (typeof edu === 'string') {
                                  return <p key={index} className="text-gray-700 text-sm">{edu}</p>;
                                }

                                // 학교 이름 - 전공 (학위) 형태로 표시
                                const school = edu.school || '';
                                const major = edu.major || '';
                                const degree = edu.degree || '';

                                let displayText = '';
                                if (school && major && degree) {
                                  displayText = `${school} - ${major} (${degree})`;
                                } else if (school && major) {
                                  displayText = `${school} - ${major}`;
                                } else if (school && degree) {
                                  displayText = `${school} (${degree})`;
                                } else {
                                  displayText = school || major || degree || '학력 정보';
                                }

                                return (
                                  <p key={index} className="text-gray-700 text-sm">
                                    {displayText}
                                  </p>
                                );
                              })}
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
                              {(expertData as any).portfolioItems.map((career: any, index: number) => {
                                // career가 객체인 경우 (workExperience 형태)
                                if (typeof career === 'object' && career !== null) {
                                  const company = career.company || '';
                                  const position = career.position || '';
                                  const period = career.period || '';
                                  return (
                                    <p key={index} className="text-gray-700 text-sm">
                                      {company && position && period
                                        ? `${company} - ${position} (${period})`
                                        : company || position || period || '경력 정보'}
                                    </p>
                                  );
                                }
                                // career가 문자열인 경우
                                return (
                                  <p key={index} className="text-gray-700 text-sm">{String(career)}</p>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* 자격증 섹션 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">자격증</h3>
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
                              // file이 문자열(URL)이면 객체로 변환, 아니면 그대로 사용
                              const fileData = typeof file === 'string'
                                ? { url: file, data: file, name: `포트폴리오 ${index + 1}`, type: 'image/jpeg', size: 0 }
                                : file;
                              const imageUrl = fileData.url || fileData.data || fileData;
                              const isImage = typeof imageUrl === 'string' && (imageUrl.startsWith('data:image/') || imageUrl.startsWith('http'));

                              return (
                                <div key={index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                  {isImage ? (
                                    // 이미지 파일 - 미리보기와 확대 기능
                                    <div className="relative">
                                      <img
                                        src={imageUrl}
                                        alt={fileData.name || `포트폴리오 ${index + 1}`}
                                        className="w-full aspect-[3/4] object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => setSelectedImage(imageUrl)}
                                      />
                                      <div className="absolute top-2 right-2">
                                        <button
                                          onClick={() => setSelectedImage(imageUrl)}
                                          className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                          title="확대해서 보기"
                                        >
                                          <ZoomIn className="h-4 w-4" />
                                        </button>
                                      </div>
                                      {fileData.name && fileData.size > 0 && (
                                        <div className="p-2">
                                          <h4 className="text-xs font-medium text-gray-900 truncate">{fileData.name}</h4>
                                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                            <span>{(fileData.size / 1024 / 1024).toFixed(1)} MB</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    // 문서 파일 - 아이콘과 정보만 표시
                                    <div className="p-3 flex flex-col items-center justify-center h-full min-h-[120px]">
                                      <div className="flex-shrink-0 mb-2">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                      </div>
                                      <div className="text-center">
                                        <h4 className="text-xs font-medium text-gray-900 truncate w-full">{fileData.name}</h4>
                                        {fileData.size > 0 && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span>{(fileData.size / 1024 / 1024).toFixed(1)} MB</span>
                                          </div>
                                        )}
                                        {fileData.type && (
                                          <div className="mt-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                              {fileData.type.split('/')[1]?.toUpperCase()}
                                            </span>
                                          </div>
                                        )}
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
                                // file이 문자열(URL)이면 객체로 변환, 아니면 그대로 사용
                                const fileData = typeof file === 'string'
                                  ? { url: file, data: file, name: `포트폴리오 ${currentPortfolioIndex + index + 1}`, type: 'image/jpeg', size: 0 }
                                  : file;
                                const imageUrl = fileData.url || fileData.data || fileData;
                                const isImage = typeof imageUrl === 'string' && (imageUrl.startsWith('data:image/') || imageUrl.startsWith('http'));
                                return (
                                  <div key={currentPortfolioIndex + index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                    {isImage ? (
                                      // 이미지 파일 - 미리보기와 확대 기능
                                      <div className="relative">
                                        <img
                                          src={imageUrl}
                                          alt={fileData.name}
                                          className="w-full aspect-[3/4] object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                          onClick={() => setSelectedImage(imageUrl)}
                                        />
                                        <div className="absolute top-2 right-2">
                                          <button
                                            onClick={() => setSelectedImage(imageUrl)}
                                            className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                            title="확대해서 보기"
                                          >
                                            <ZoomIn className="h-4 w-4" />
                                          </button>
                                        </div>
                                        <div className="p-2">
                                          <h4 className="text-xs font-medium text-gray-900 truncate">{fileData.name}</h4>
                                          {fileData.size > 0 && (
                                            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                              <span>{(fileData.size / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      // 문서 파일 - 아이콘과 정보만 표시
                                      <div className="p-3 flex flex-col items-center justify-center h-full min-h-[120px]">
                                        <div className="flex-shrink-0 mb-2">
                                          <FileText className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="text-center">
                                          <h4 className="text-xs font-medium text-gray-900 truncate w-full">{fileData.name}</h4>
                                          {fileData.size > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              <span>{(fileData.size / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                          )}
                                          <div className="mt-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                              {fileData.type?.split('/')[1]?.toUpperCase()}
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
                          {(expertData as any).socialLinks.website && (
                            <a
                              href={(expertData as any).socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200"
                            >
                              <Globe className="h-4 w-4" />
                              <span className="text-sm font-medium">웹사이트</span>
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
                          {(expertData as any).socialLinks.blog && (
                            <a
                              href={(expertData as any).socialLinks.blog}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-100"
                            >
                              <Globe className="h-4 w-4" />
                              <span className="text-sm font-medium">블로그</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

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
                          <div className="grid grid-cols-7 gap-2">
                            {(() => {
                              // 요일별로 그룹화
                              const dayMapping: Record<string, string> = {
                                'MONDAY': '월',
                                'TUESDAY': '화',
                                'WEDNESDAY': '수',
                                'THURSDAY': '목',
                                'FRIDAY': '금',
                                'SATURDAY': '토',
                                'SUNDAY': '일'
                              };

                              const availabilityByDay = (expertData as any).availabilitySlots.reduce((acc: any, slot: any) => {
                                const day = slot.dayOfWeek;
                                if (!acc[day]) acc[day] = [];
                                acc[day].push(slot);
                                return acc;
                              }, {});

                              // 요일 순서 정렬 (월~일)
                              const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                              return dayOrder.map(day => {
                                const daySlots = availabilityByDay[day]?.sort((a: any, b: any) =>
                                  a.startTime.localeCompare(b.startTime)
                                ) || [];

                                return (
                                  <div key={day} className="space-y-2">
                                    <h5 className="text-xs font-semibold text-center text-gray-900 bg-blue-100 py-1 rounded">
                                      {dayMapping[day]}
                                    </h5>
                                    <div className="space-y-1">
                                      {daySlots.length > 0 ? (
                                        daySlots.map((slot: any, index: number) => (
                                          <div key={index} className="text-xs text-gray-700 text-center">
                                            <div className="bg-white border border-gray-200 rounded px-1 py-1">
                                              {slot.startTime}<br/>-<br/>{slot.endTime}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-xs text-gray-400 text-center py-1">
                                          -
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* 공휴일 상담 안내 */}
                        {(() => {
                          const shouldShow = (expertData as any).holidaySettings?.acceptHolidayConsultations;
                          console.log('🎄 공휴일 상담 섹션 표시 조건:', {
                            shouldShow,
                            holidaySettings: (expertData as any).holidaySettings,
                            acceptHolidayConsultations: (expertData as any).holidaySettings?.acceptHolidayConsultations,
                          });
                          return shouldShow;
                        })() && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-5 w-5 text-green-600 mr-2" />
                              <h4 className="text-sm font-semibold text-green-900">공휴일 상담 설정</h4>
                            </div>
                            <p className="text-sm text-green-700 ml-7">
                              {(expertData as any).holidaySettings?.holidayNote || '공휴일에도 예약을 받습니다.'}
                            </p>
                          </div>
                        )}

                        {/* 휴식시간 설정 */}
                        {((expertData as any).restTimeSettings?.enableLunchBreak || (expertData as any).restTimeSettings?.enableDinnerBreak) && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Clock className="h-5 w-5 text-orange-600 mr-2" />
                              <h4 className="text-sm font-semibold text-orange-900">휴식 시간 설정</h4>
                            </div>
                            <div className="space-y-2 ml-7">
                              {(expertData as any).restTimeSettings?.enableLunchBreak && (
                                <div className="flex items-center text-sm text-orange-700">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  점심시간: {(expertData as any).restTimeSettings.lunchStartTime} - {(expertData as any).restTimeSettings.lunchEndTime}
                                </div>
                              )}
                              {(expertData as any).restTimeSettings?.enableDinnerBreak && (
                                <div className="flex items-center text-sm text-orange-700">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  저녁시간: {(expertData as any).restTimeSettings.dinnerStartTime} - {(expertData as any).restTimeSettings.dinnerEndTime}
                                </div>
                              )}
                            </div>
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

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleInquiryOpen}
                    >
                      문의하기
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
            experience: (expertData as any).experience || 0,
            avatarUrl: expertData.avatarUrl,
            specialty: (expertData as any).specialty || null,
            level: expertData.level,
            consultationStyle: (expertData as any).consultationStyle || null,
            // Availability 관련 필드 전달 (profile API에서 제공)
            availabilitySlots: (expertData as any).availabilitySlots,
            holidaySettings: (expertData as any).holidaySettings,
            restTimeSettings: (expertData as any).restTimeSettings
          }}
          creditsPerMinute={creditsPerMinute}
          userCredits={creditsData?.data}
        />
      )}

      {/* 문의하기 모달 */}
      {isInquiryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsInquiryModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">전문가에게 문의하기</h2>
                  <p className="text-sm text-gray-600">
                    {expertData?.name} 전문가에게 문의를 보냅니다
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 space-y-4">
              {/* 문의 카테고리 탭 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  문의 카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setInquiryTab('schedule')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      inquiryTab === 'schedule'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    상담 일정
                  </button>
                  <button
                    onClick={() => setInquiryTab('time')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      inquiryTab === 'time'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    상담 시간
                  </button>
                  <button
                    onClick={() => setInquiryTab('price')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      inquiryTab === 'price'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    상담 비용
                  </button>
                  <button
                    onClick={() => setInquiryTab('method')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      inquiryTab === 'method'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    상담 방식
                  </button>
                  <button
                    onClick={() => setInquiryTab('other')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      inquiryTab === 'other'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    기타 문의
                  </button>
                </div>
              </div>

              {/* 제목 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  placeholder={getInquiryTitle()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inquirySubject.length}/100
                </p>
              </div>

              {/* 내용 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  placeholder={getInquiryPlaceholder()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={10}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inquiryContent.length}/1000
                </p>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">문의 답변 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>전문가가 확인 후 답변을 보내드립니다</li>
                      <li>답변은 등록하신 이메일로 전송됩니다</li>
                      <li>평균 답변 시간: {(expertData as any).responseTime || '24시간 이내'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsInquiryModalOpen(false)}
                disabled={isSendingInquiry}
              >
                취소
              </Button>
              <Button
                onClick={handleSendInquiry}
                disabled={!inquirySubject.trim() || !inquiryContent.trim() || isSendingInquiry}
              >
                {isSendingInquiry ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    전송 중...
                  </div>
                ) : (
                  '문의 보내기'
                )}
              </Button>
            </div>
          </div>
        </div>
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

      {/* 문의 성공 모달 */}
      {isInquirySuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            {/* 성공 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              문의가 전송되었습니다!
            </h3>

            {/* 설명 */}
            <div className="text-gray-600 text-center mb-6 space-y-2">
              <p>전문가가 확인 후 답변드리겠습니다.</p>
              <p className="text-sm">답변은 <strong>대시보드 &gt; 메시지 관리</strong>에서 확인하실 수 있습니다.</p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInquirySuccessModalOpen(false);
                  setIsInquiryModalOpen(false);
                }}
                className="flex-1"
              >
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsInquirySuccessModalOpen(false);
                  setIsInquiryModalOpen(false);
                  router.push('/dashboard/client/messages');
                }}
                className="flex-1"
              >
                메시지 관리로 이동
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 문의 실패 모달 */}
      {isInquiryErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            {/* 에러 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <X className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              문의 전송 실패
            </h3>

            {/* 에러 상세 정보 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-red-900">오류 메시지:</span>
                  <p className="text-red-700 mt-1">{inquiryErrorDetails.message}</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-200">
                  <span className="text-red-600">오류 코드:</span>
                  <span className="font-mono text-red-900">{inquiryErrorDetails.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">HTTP 상태:</span>
                  <span className="font-mono text-red-900">{inquiryErrorDetails.status}</span>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <p className="text-sm text-gray-600 text-center mb-6">
              다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.
            </p>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInquiryErrorModalOpen(false)}
                className="flex-1"
              >
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsInquiryErrorModalOpen(false);
                  // 다시 시도할 수 있도록 문의 모달은 열어둠
                }}
                className="flex-1"
              >
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}