'use client';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchExperts, Expert } from '@/lib/experts';
// import { useAuth } from '@/components/auth/AuthProvider'; // 현재 사용하지 않음
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import RatingStars from '@/components/ui/RatingStars';
import Skeleton from '@/components/ui/Skeleton';
import UserReviewsSection from './UserReviewsSection';
import SearchFields from './SearchFields';
import PopularCategoriesSection from './PopularCategoriesSection';
import StatsSection from './StatsSection';
import AIChatPromoSection from './AIChatPromoSection';

// 카테고리 옵션 타입 정의
export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface AgeGroupOption {
  id: string;
  name: string;
  icon: string;
}

export interface DurationOption {
  id: string;
  name: string;
  description: string;
}

/**
 * 홈페이지 메인 컴포넌트
 * - 히어로 섹션: 메인 타이틀과 검색 기능
 * - 인기 카테고리: 상담 분야별 카테고리
 * - 통계 섹션: 플랫폼 주요 지표
 * - AI 채팅 프로모션: AI 상담 서비스 소개
 * - 평점 상위 전문가: 상위 3명의 전문가 카드
 * - 사용자 후기: 실제 리뷰 섹션
 */
export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  // const { } = useAuth(); // 현재 사용하지 않음

  // 검색 상태
  const [searchCategory, setSearchCategory] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchAgeGroup, setSearchAgeGroup] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Expert[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // 카테고리 데이터
  const categories: CategoryOption[] = [
    { id: 'career', name: '커리어 상담', icon: 'Briefcase', description: '직장, 이직, 진로 상담' },
    { id: 'psychology', name: '심리 상담', icon: 'Brain', description: '우울, 불안, 스트레스 관리' },
    { id: 'finance', name: '금융 상담', icon: 'DollarSign', description: '투자, 저축, 재정 관리' },
    { id: 'health', name: '건강 상담', icon: 'Heart', description: '운동, 다이어트, 건강 관리' },
    { id: 'education', name: '교육 상담', icon: 'BookOpen', description: '학습법, 진학, 자격증' },
    { id: 'relationship', name: '인간관계', icon: 'Users', description: '연애, 가족, 사회관계' },
    { id: 'business', name: '사업/창업', icon: 'TrendingUp', description: '창업, 마케팅, 사업 전략' },
    { id: 'tech', name: 'IT/기술', icon: 'Code', description: '프로그래밍, 개발, 기술 트렌드' },
    { id: 'design', name: '디자인', icon: 'Palette', description: 'UI/UX, 그래픽, 브랜딩' },
    { id: 'language', name: '언어 학습', icon: 'Languages', description: '영어, 중국어, 일본어 등' },
    { id: 'music', name: '음악', icon: 'Music', description: '악기, 작곡, 음악 이론' },
    { id: 'travel', name: '여행', icon: 'Plane', description: '여행 계획, 현지 정보' },
    { id: 'beauty', name: '뷰티', icon: 'Scissors', description: '헤어, 메이크업, 스타일링' },
    { id: 'sports', name: '스포츠', icon: 'Trophy', description: '운동, 피트니스, 스포츠' },
    { id: 'pets', name: '반려동물', icon: 'PawPrint', description: '펫케어, 훈련, 건강 관리' },
    { id: 'gardening', name: '원예', icon: 'Sprout', description: '식물 키우기, 정원 가꾸기' },
    { id: 'cooking', name: '요리', icon: 'ChefHat', description: '요리법, 베이킹, 식품' },
    { id: 'real-estate', name: '부동산', icon: 'Building2', description: '매매, 임대, 투자' },
    { id: 'study', name: '학습법', icon: 'GraduationCap', description: '공부법, 시험 준비' },
  ];

  const ageGroups: AgeGroupOption[] = [
    { id: 'teen', name: '10대', icon: 'School' },
    { id: 'twenties', name: '20대', icon: 'User' },
    { id: 'thirties', name: '30대', icon: 'UserCheck' },
    { id: 'forties', name: '40대', icon: 'User' },
    { id: 'fifties', name: '50대', icon: 'UserCheck' },
    { id: 'sixties', name: '60대+', icon: 'User' },
  ];

  const durations: DurationOption[] = [
    { id: '30', name: '30분', description: '간단한 상담' },
    { id: '60', name: '1시간', description: '일반적인 상담' },
    { id: '90', name: '1시간 30분', description: '자세한 상담' },
    { id: '120', name: '2시간', description: '심화 상담' },
  ];

  const { data: expertsData, isLoading } = useQuery({
    queryKey: ['experts', { size: 3, sort: 'rating' }],
    queryFn: () => fetchExperts({ size: 3, sort: 'rating' }),
  });

  const topExperts = expertsData?.data?.items || [];

  // 영어 카테고리를 한글로 매핑하는 함수
  const mapCategoryToKorean = (englishCategory: string): string => {
    const categoryMap: { [key: string]: string } = {
      'career': '커리어 상담',
      'psychology': '심리 상담', 
      'finance': '금융 상담',
      'health': '건강 상담',
      'education': '교육 상담',
      'relationship': '인간관계',
      'business': '사업/창업',
      'tech': 'IT/기술',
      'design': '디자인',
      'language': '언어 학습',
      'music': '음악',
      'travel': '여행',
      'beauty': '뷰티',
      'sports': '스포츠',
      'pets': '반려동물',
      'gardening': '원예',
      'cooking': '요리',
      'real-estate': '부동산',
      'study': '학습법',
      'law': '법무',
      'contract': '계약',
      'tax': '세무',
      'accounting': '회계',
      'startup': '창업'
    };
    return categoryMap[englishCategory] || englishCategory;
  };

  // 카테고리 ID를 이름으로 변환하는 함수
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Handle OAuth success redirect
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'success') {
      // 쿠키가 설정되기를 잠시 기다린 후 상태 업데이트
      setTimeout(() => {
        console.log('Google 로그인이 성공적으로 완료되었습니다!');
        // URL에서 auth 파라미터 제거
        router.replace('/', undefined);
        // 페이지 새로고침으로 인증 상태 업데이트
        window.location.reload();
      }, 500);
    }
  }, [searchParams, router]);

  // 검색 함수
  const handleSearch = async () => {
    if (!searchCategory) return;
    
    setIsSearching(true);
    try {
      const searchParams = {
        category: searchCategory,
        ...(searchStartDate && { startDate: searchStartDate }),
        ...(searchEndDate && searchEndDate !== 'decide_after_matching' && { endDate: searchEndDate }),
        ...(searchAgeGroup && { ageGroup: searchAgeGroup }),
      };

      const result = await fetchExperts(searchParams);
      
      if (result.success && result.data) {
        setSearchResults(result.data.items || []);
        setHasSearched(true);
      } else {
        console.error('검색 결과를 가져올 수 없습니다:', result.error);
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="w-full">
      {/* Hero Section with Search */}
      <section className="relative z-10 overflow-visible py-28 sm:py-40 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
        >
          <div className="relative left-1/2 -translate-x-1/2 h-[36rem] w-[72rem] bg-gradient-to-tr from-indigo-200 via-purple-200 to-pink-200 opacity-40 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 ring-1 ring-inset ring-gray-200">
              온디맨드 전문가 상담 플랫폼
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            전문가와 함께
            <br />
            <span className="block mt-3 text-blue-600">
              성장하는 온디맨드 상담
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            다양한 분야의 전문가들과 1:1 상담을 통해 당신의 고민을 해결하고 목표를
            달성해보세요.
          </p>

          <SearchFields
            searchCategory={searchCategory}
            setSearchCategory={setSearchCategory}
            searchStartDate={searchStartDate}
            setSearchStartDate={setSearchStartDate}
            searchEndDate={searchEndDate}
            setSearchEndDate={setSearchEndDate}
            searchAgeGroup={searchAgeGroup}
            setSearchAgeGroup={setSearchAgeGroup}
            isSearching={isSearching}
            onSearch={handleSearch}
            categories={categories}
            ageGroups={ageGroups}
            durations={durations}
          />

          {/* 검색 결과가 없을 때만 AI 채팅 버튼 표시 */}
          {!hasSearched && (
            <div className="mt-16 flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-px bg-gray-300 w-16"></div>
                <span className="text-sm">또는</span>
                <div className="h-px bg-gray-300 w-16"></div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  어떤 전문가를 찾아야 할지 모르겠나요?
                </p>
                <Link href="/experts">
                  <Button variant="ghost" size="lg" className="px-6 py-3 border border-gray-200 hover:bg-gray-50">
                    AI 채팅 상담하기
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* 검색 결과 표시 */}
          {hasSearched && searchResults && searchResults.length > 0 && (
            <div className="mt-12">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-6 border-b border-gray-100 bg-gray-50">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">매칭된 전문가</h3>
                    <p className="text-gray-600 text-lg">
                      {getCategoryName(searchCategory)} 분야의 전문가 {searchResults.length}명을 찾았습니다.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <button 
                      onClick={() => {
                        setSearchResults([]);
                        setHasSearched(false);
                        setSearchCategory('');
                        setSearchStartDate('');
                        setSearchEndDate('');
                        setSearchAgeGroup('');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      새로 검색
                    </button>
                    {searchResults.length > 6 && (
                      <Link href={`/experts?category=${searchCategory}&ageGroup=${searchAgeGroup}&date=${searchStartDate}`}>
                        <Button size="sm" className="px-4 py-2">
                          전체 {searchResults.length}명 보기
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.slice(0, 6).map((expert: Expert) => (
                      <Card key={expert.id} hover className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                          {expert.avatarUrl ? (
                            <img 
                              src={expert.avatarUrl} 
                              alt={expert.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-gray-500 font-bold">
                              {expert.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{expert.name}</h3>
                        {expert.title && (
                          <p className="text-gray-600 text-sm mb-3">{expert.title}</p>
                        )}
                        <div className="flex flex-wrap gap-1 justify-center mb-3">
                          {expert.categories.slice(0, 2).map((category) => (
                            <Badge key={category} variant="primary" size="sm">
                              {mapCategoryToKorean(category)}
                            </Badge>
                          ))}
                        </div>
                        <div className="mb-3">
                          <RatingStars 
                            rating={expert.ratingAvg} 
                            count={expert.reviewCount}
                            size="sm"
                          />
                        </div>
                        <Link href={`/experts/${expert.displayId}`}>
                          <Button variant="ghost" size="sm" className="w-full py-2 text-sm border-2 hover:bg-blue-50">
                            상세보기
                          </Button>
                        </Link>
                      </Card>
                    ))}
                  </div>
                  
                  {searchResults.length > 6 && (
                    <div className="mt-8 text-center">
                      <Link href={`/experts?category=${searchCategory}&ageGroup=${searchAgeGroup}&date=${searchStartDate}`}>
                        <Button variant="ghost" className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                          더 많은 전문가 보기 (+{searchResults.length - 6}명)
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 검색 결과가 없을 때 */}
          {hasSearched && (!searchResults || searchResults.length === 0) && (
            <div className="mt-12 text-center">
              <div className="bg-gray-50 rounded-xl p-8">
                <p className="text-gray-600 text-lg mb-4">
                  검색 조건에 맞는 전문가를 찾지 못했습니다.
                </p>
                <p className="text-gray-500 mb-6">
                  다른 조건으로 다시 검색해보시거나 AI 채팅 상담을 이용해보세요.
                </p>
                <Link href="/experts">
                  <Button className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700">
                    AI 채팅 상담하기
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 인기 카테고리 섹션 */}
      <PopularCategoriesSection
        categories={categories}
        showAllCategories={showAllCategories}
        setShowAllCategories={setShowAllCategories}
        isLoading={false}
      />

      {/* 통계 섹션 */}
      <StatsSection />

      {/* AI 채팅 프로모션 섹션 */}
      <AIChatPromoSection />

      {/* 최근 평점 상위 전문가 */}
      <section className="w-full py-24 md:py-32 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="w-full px-6">
          <div className="text-center mb-20 md:mb-24 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">평점 상위 전문가</h2>
            <p className="text-xl text-gray-600 leading-relaxed">검증된 전문가들과 함께 문제를 해결해보세요</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="text-center p-8 border-0 shadow-lg">
                  <Skeleton variant="circular" width={96} height={96} className="mx-auto mb-6" />
                  <Skeleton height={28} className="mb-3" />
                  <Skeleton height={20} className="mb-4" />
                  <Skeleton height={16} className="mb-2" />
                  <Skeleton height={16} />
                </Card>
              ))}
            </div>
          ) : topExperts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {topExperts.map((expert: Expert) => (
                <Card key={expert.id} hover className="text-center p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                    {expert.avatarUrl ? (
                      <img 
                        src={expert.avatarUrl} 
                        alt={expert.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-500 font-bold">
                        {expert.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{expert.name}</h3>
                  {expert.title && (
                    <p className="text-gray-600 text-lg mb-4">{expert.title}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {expert.categories.map((category) => (
                      <Badge key={category} variant="primary">
                        {mapCategoryToKorean(category)}
                      </Badge>
                    ))}
                  </div>
                  <div className="mb-4">
                    <RatingStars 
                      rating={expert.ratingAvg} 
                      count={expert.reviewCount}
                      size="sm"
                    />
                  </div>
                  {expert.bio && (
                    <p className="text-gray-600 text-base mt-4 line-clamp-2 leading-relaxed">{expert.bio}</p>
                  )}
                  <Link href={`/experts/${expert.displayId}`} className="block mt-6">
                    <Button variant="ghost" size="sm" className="w-full py-3 text-lg border-2 hover:bg-blue-50">
                      상세보기
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card className="text-center py-16 border-0 shadow-lg">
                <p className="text-gray-500 text-xl">전문가 정보를 불러오는 중입니다.</p>
              </Card>
            </div>
          )}

          <div className="text-center mt-20 md:mt-24">
            <Link href="/experts">
              <Button variant="ghost" className="px-12 py-4 text-lg border-2 hover:bg-white">
                모든 전문가 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <UserReviewsSection limit={12} />
    </main>
  );
}
