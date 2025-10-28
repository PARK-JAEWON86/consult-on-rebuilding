"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Crown, 
  Star, 
  Users, 
  Award, 
  TrendingUp,
  Search,
  ArrowLeft
} from "lucide-react";
// import { dummyExpertStats, updateAllRankingScores } from '@/data/dummy/expert-stats'; // 더미 데이터 제거

interface RankingItem {
  expertId: string;
  displayId?: string;
  expertName?: string;
  rankingScore?: number;
  totalSessions: number;
  avgRating: number;
  reviewCount: number;
  likeCount: number;
  specialty?: string;
  mbti?: string; // MBTI 필드 추가
  specialtyRanking?: number;
  specialtyTotalExperts?: number;
  // 새로운 필드들 추가
  level?: number;
  tierInfo?: any;
  ranking?: number;
}


interface Category {
  id: number;
  slug: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  description: string;
  order: number;
}

// 반올림하지 않고 소수점 첫째 자리까지만 표시하는 함수
const truncateToOneDecimal = (num: number): string => {
  return Math.floor(num * 10) / 10 + '';
};

export default function ExpertRankingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overall' | 'rating' | 'sessions' | 'specialty'>('overall');
  const [rankingList, setRankingList] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // sortBy 상태 제거됨 - 탭별 자동 정렬로 대체
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // 전문 분야 목록 (API에서 로드)
  const [categories, setCategories] = useState<Category[]>([]);

  // MBTI 타입 목록 (데모용)
  const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

  // 레벨 티어 목록 제거됨 - 평점/상담수 랭킹으로 대체

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const response = await fetch('http://localhost:4000/v1/categories');
      const result = await response.json();
      if (result.success) {
        const categoriesData = result.data || [];
        setCategories(categoriesData);
      } else {
        console.warn('카테고리 API 응답 실패');
        setCategories([]);
      }
    } catch (error) {
      console.error('카테고리 로딩 오류:', error);
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };


  // 랭킹 목록 로드 (DB 기반 실시간 데이터 사용)
  const loadRankingList = async (type: 'overall' | 'rating' | 'sessions' | 'specialty', specialty?: string) => {
    setIsLoading(true);
    try {
      // 실제 API에서 랭킹 점수를 가져오기 (이미 API 호출로 처리됨)
      
      // API에서 추가 정보 가져오기
      let apiType = type;
      // rating과 sessions 탭은 overall 데이터를 가져와서 클라이언트에서 정렬
      if (type === 'rating' || type === 'sessions') {
        apiType = 'overall';
      }

      let url = `http://localhost:4000/v1/expert-stats/rankings?type=${apiType}`;
      if (type === 'specialty' && specialty) {
        url += `&specialty=${encodeURIComponent(specialty)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const apiRankings = result.data.rankings || [];
        
        // API 데이터 직접 사용 (전문가 프로필 정보 통합)
        console.log('[DEBUG] API 응답 데이터:', apiRankings.slice(0, 2));
        const mergedRankings = apiRankings.map((apiData: any, index: number) => {
          return {
            expertId: apiData.expertId,
            displayId: apiData.displayId,
            expertName: apiData.expertName || `전문가 ${apiData.expertId}`,
            rankingScore: apiData.rankingScore || 0,
            totalSessions: apiData.totalSessions || 0,
            avgRating: apiData.avgRating || 0,
            reviewCount: apiData.reviewCount || 0,
            likeCount: apiData.likeCount || 0,
            specialty: apiData.specialty || '일반',
            mbti: apiData.mbti || mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)], // MBTI 정보 추가 (데모용 랜덤)
            // API에서 계산된 레벨 우선 사용
            level: apiData?.level || 1,
            ranking: apiData?.ranking || index + 1,
            tierInfo: apiData?.tierInfo || null,
            specialtyRanking: apiData?.specialtyRanking || 0,
            specialtyTotalExperts: apiData?.specialtyTotalExperts || 0
          };
        });
        
        // 티어별 필터링 제거됨 - 간단한 정렬로 대체
        
        // 탭별 정렬 적용 (디버깅 로그 포함)
        let sortedRankings;
        console.log(`[DEBUG] 정렬 타입: ${type}, 데이터 개수: ${mergedRankings.length}`);
        
        if (type === 'rating') {
          sortedRankings = mergedRankings.sort((a: any, b: any) => {
            const diff = b.avgRating - a.avgRating;
            return diff;
          });
          console.log('[DEBUG] 평점 랭킹 정렬 완료:', sortedRankings.slice(0, 3).map((r: any) => `${r.expertName}: ${r.avgRating}`));
        } else if (type === 'sessions') {
          sortedRankings = mergedRankings.sort((a: any, b: any) => {
            const diff = b.totalSessions - a.totalSessions;
            return diff;
          });
          console.log('[DEBUG] 상담 수 랭킹 정렬 완료:', sortedRankings.slice(0, 3).map((r: any) => `${r.expertName}: ${r.totalSessions}회`));
        } else {
          // overall, specialty 등 기본값 - 랭킹점수 순
          sortedRankings = mergedRankings.sort((a: any, b: any) => (b.rankingScore || 0) - (a.rankingScore || 0));
          console.log('[DEBUG] 종합 랭킹 정렬 완료:', sortedRankings.slice(0, 3).map((r: any) => `${r.expertName}: ${r.rankingScore}점`));
        }
        
        // 순위 재계산
        const finalRankings = sortedRankings.map((ranking: any, index: number) => ({
          ...ranking,
          ranking: index + 1
        }));
        
        setRankingList(finalRankings);
      } else {
        // API 실패 시 빈 배열 사용
        const fallbackRankings: any[] = [];
        setRankingList(fallbackRankings);
      }
    } catch (error) {
      // 에러 시 빈 배열 사용
      console.error('랭킹 데이터 로드 실패:', error);
      setRankingList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 카테고리, 레벨 정보 로드
  useEffect(() => {
    loadCategories();
    loadExpertLevels();

    // 초기 랭킹 로드
    loadRankingList('overall');
  }, []);

  // 탭 변경 시 랭킹 목록 로드
  useEffect(() => {
    if (activeTab === 'overall') {
      loadRankingList('overall');
    } else if (activeTab === 'rating') {
      loadRankingList('rating');
    } else if (activeTab === 'sessions') {
      loadRankingList('sessions');
    } else if (activeTab === 'specialty') {
      // 분야별 랭킹 탭을 선택했을 때 기본 카테고리 선택
      if (categories.length > 0 && !selectedSpecialty) {
        setSelectedSpecialty(categories[0].nameKo);
      } else if (selectedSpecialty) {
        loadRankingList('specialty', selectedSpecialty);
      }
    }
  }, [activeTab, selectedSpecialty, categories]);

  // 선택된 전문분야가 변경될 때 랭킹 로드
  useEffect(() => {
    if (activeTab === 'specialty' && selectedSpecialty) {
      loadRankingList('specialty', selectedSpecialty);
    }
  }, [selectedSpecialty, activeTab]);


  // 티어 관련 useEffect 제거됨 - 평점/상담수 랭킹으로 대체

  // 레거시 레벨 계산 함수는 제거됨 - 공식 랭킹 점수를 사용

  // 레벨 API에서 전문가 레벨 정보 가져오기
  const [expertLevels, setExpertLevels] = useState<{[key: string]: any}>({});
  
  const loadExpertLevels = async () => {
    try {
      const response = await fetch('http://localhost:4000/v1/expert-stats/levels');
      const result = await response.json();
      if (result.success) {
        const levelsMap: {[key: string]: any} = {};
        result.data.levels.forEach((level: any) => {
          levelsMap[level.expertId] = level;
        });
        setExpertLevels(levelsMap);
      }
    } catch (error) {
      // 에러 발생 시 조용히 처리
    }
  };

  // getTierRange 함수 제거됨 - 티어별 필터링 제거

  // 검색 및 필터링된 랭킹 목록
  const filteredRankings = rankingList.filter(item => {
    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = (item.expertName || '').toLowerCase().includes(query);
      const specialtyMatch = (item.specialty || '').toLowerCase().includes(query);
      if (!nameMatch && !specialtyMatch) return false;
    }

    // 티어 필터링 제거됨 - 평점/상담수 랭킹으로 대체

    return true;
  });

  // 정렬된 랭킹 목록 (탭별 자동 정렬)
  const sortedRankings = [...filteredRankings].sort((a, b) => {
    // 탭별 기본 정렬 적용
    if (activeTab === 'rating') {
      const diff = b.avgRating - a.avgRating;
      console.log(`[CLIENT DEBUG] 평점 정렬: ${a.expertName}(${a.avgRating}) vs ${b.expertName}(${b.avgRating}) = ${diff}`);
      return diff; // 평점 높은 순
    } else if (activeTab === 'sessions') {
      const diff = b.totalSessions - a.totalSessions;
      console.log(`[CLIENT DEBUG] 상담수 정렬: ${a.expertName}(${a.totalSessions}) vs ${b.expertName}(${b.totalSessions}) = ${diff}`);
      return diff; // 상담 수 많은 순
    } else if (activeTab === 'specialty') {
      return (b.rankingScore || 0) - (a.rankingScore || 0); // 분야별 랭킹점수 순
    } else {
      // overall 탭 또는 기본값 - 종합 랭킹점수 순
      return (b.rankingScore || 0) - (a.rankingScore || 0);
    }
  });

  // 최종 정렬 결과 확인
  if (activeTab === 'rating' || activeTab === 'sessions') {
    console.log(`[CLIENT DEBUG] ${activeTab} 탭 최종 정렬 결과:`, 
      sortedRankings.slice(0, 5).map((r, i) => 
        `${i+1}위: ${r.expertName} (${activeTab === 'rating' ? r.avgRating : r.totalSessions})`
      )
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            이전으로
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤드라인 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-4">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            전문가 랭킹
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            전문가들의 상담 실적, 고객 만족도, 리뷰 등을 종합적으로 평가한 랭킹입니다. 
            종합 랭킹, 평점 랭킹, 상담 수 랭킹, 분야별 랭킹을 확인하고, 검색을 통해 원하는 전문가를 찾아보세요.
          </p>
        </div>
        
        {/* 랭킹 통계 */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">총 전문가</p>
                  <p className="text-2xl font-bold text-gray-900">{rankingList.length}명</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 점수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rankingList.length > 0 
                      ? (rankingList.reduce((sum, item) => sum + (item.rankingScore || 0), 0) / rankingList.length).toFixed(1)
                      : '0.0'
                    }점
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">총 상담</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rankingList.reduce((sum, item) => sum + item.totalSessions, 0).toLocaleString()}회
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 평점</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rankingList.length > 0
                      ? truncateToOneDecimal(rankingList.reduce((sum, item) => sum + Number(item.avgRating || 0), 0) / rankingList.length)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">총 리뷰</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rankingList.reduce((sum, item) => sum + (item.reviewCount || 0), 0).toLocaleString()}개
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-pink-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">총 좋아요</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rankingList.reduce((sum, item) => sum + (item.likeCount || 0), 0).toLocaleString()}개
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 랭킹 탭 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* 탭 */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('overall');
                setSelectedSpecialty('');
                setSearchQuery('');
                setShowAllCategories(false);
                loadRankingList('overall');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overall'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              종합 랭킹
            </button>
            <button
              onClick={() => {
                setActiveTab('rating');
                setSelectedSpecialty('');
                setSearchQuery('');
                setShowAllCategories(false);
                loadRankingList('rating');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'rating'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              평점 랭킹
            </button>
            <button
              onClick={() => {
                setActiveTab('sessions');
                setSelectedSpecialty('');
                setSearchQuery('');
                setShowAllCategories(false);
                loadRankingList('sessions');
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'sessions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              상담 수 랭킹
            </button>
            <button
              onClick={() => {
                setActiveTab('specialty');
                setSelectedSpecialty('');
                setSearchQuery('');
                setShowAllCategories(false);
                if (categories.length > 0) {
                  setSelectedSpecialty(categories[0].nameKo);
                  loadRankingList('specialty', categories[0].nameKo);
                }
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'specialty'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              분야별 랭킹
            </button>
          </div>

          {/* 분야 선택 (분야별 랭킹일 때만) */}
          {activeTab === 'specialty' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">전문 분야 선택</label>
              <div className="space-y-3">
                {/* 첫 줄: 주요 카테고리 (최대 5개) */}
                <div className="flex flex-wrap gap-2">
                  {isCategoriesLoading ? (
                    <div className="flex items-center text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      카테고리 로딩 중...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      카테고리를 불러올 수 없습니다.
                    </div>
                  ) : (
                    <>
                      {categories.slice(0, 5).map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedSpecialty(category.nameKo);
                            loadRankingList('specialty', category.nameKo);
                          }}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            selectedSpecialty === category.nameKo
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {category.nameKo}
                        </button>
                      ))}
                      
                      {/* 더보기 버튼 (카테고리가 5개 이상일 때만) */}
                      {categories.length > 5 && (
                        <button
                          onClick={() => setShowAllCategories(!showAllCategories)}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {showAllCategories ? '접기' : '더보기'}
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* 두 번째 줄: 나머지 카테고리 (더보기 클릭 시) */}
                {showAllCategories && categories.length > 5 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {categories.slice(5).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedSpecialty(category.nameKo);
                          loadRankingList('specialty', category.nameKo);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          selectedSpecialty === category.nameKo
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {category.nameKo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 레벨 티어 선택 제거됨 - 평점/상담수 랭킹으로 대체 */}

          {/* 검색 및 정렬 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="전문가 이름 또는 분야로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* 정렬 드롭다운 제거됨 - 탭별 자동 정렬 적용 */}
          </div>
        </div>

        {/* 랭킹 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">랭킹 정보를 불러오는 중...</p>
            </div>
          ) : sortedRankings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-6">
                <Award className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">랭킹 정보가 없습니다</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                  : '현재 랭킹 데이터가 없습니다.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  검색어 지우기
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      레벨
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전문가 이름
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전문분야
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MBTI
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상담 횟수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평점
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      리뷰
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      좋아요
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      랭킹 점수
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRankings.map((item, index) => (
                    <tr
                      key={item.expertId}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const targetId = item.displayId || item.expertId;
                        router.push(`/experts/${targetId}`);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${
                          index < 3 
                            ? 'bg-yellow-500 text-white' 
                            : index < 10
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {expertLevels[item.expertId] ? (
                            <div>Lv.{expertLevels[item.expertId].currentLevel}</div>
                          ) : (
                            `Lv.${item.level || 1}`
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {(item.expertName || '전문가').charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.expertName || `전문가 ${item.expertId}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.specialty || '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="font-bold text-blue-600">{item.mbti || 'N/A'}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.totalSessions.toLocaleString()}회
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm text-gray-900">{truncateToOneDecimal(item.avgRating)}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-gray-900">{item.reviewCount?.toLocaleString() || 0}개</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-gray-900">{item.likeCount?.toLocaleString() || 0}개</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {Number(item.rankingScore || 0).toFixed(1)}점
                        </div>
                      </td>
                      

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 페이지 정보 */}
        {!isLoading && sortedRankings.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            총 {sortedRankings.length}명의 전문가 중 {
              activeTab === 'overall' ? '종합' :
              activeTab === 'rating' ? '평점' :
              activeTab === 'sessions' ? '상담 수' :
              activeTab === 'specialty' ? selectedSpecialty : ''
            } 랭킹
            {searchQuery && ` (검색어: "${searchQuery}")`}
          </div>
        )}
      </div>
    </div>
  );
}
