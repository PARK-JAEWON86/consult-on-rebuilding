"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Brain,
  Scale,
  DollarSign,
  Target,
  Home,
  Monitor,
  BookOpen,
  Youtube,
  TrendingUp,
  Zap,
  Palette,
  Camera,
  Mic,
  Smartphone,
  Globe,
  ShoppingBag,
  Briefcase,
  Code,
  Languages,
  Music,
  Plane,
  Scissors,
  Sprout,
  PawPrint,
  Building2,
  GraduationCap,
  ChefHat,
  RefreshCw,
  Video,
  Star,
  Heart,
  Plus,
} from "lucide-react";

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
  repeatClients?: number;
  rankingScore?: number;
}
// import { dummyExperts, convertExpertItemToProfile } from "@/data/dummy/experts"; // 더미 데이터 제거

import ExpertCard from "@/components/experts/ExpertCard";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
// 랭킹 점수 계산 함수
const calculateRankingScore = (stats: {
  totalSessions: number;
  avgRating: number;
  reviewCount: number;
  repeatClients: number;
  likeCount: number;
}) => {
  const { totalSessions, avgRating, reviewCount, repeatClients, likeCount } = stats;

  // 가중치 적용한 랭킹 점수 계산
  const sessionScore = totalSessions * 0.3;
  const ratingScore = avgRating * 10;
  const reviewScore = reviewCount * 0.5;
  const repeatScore = repeatClients * 0.8;
  const likeScore = likeCount * 0.2;

  return sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
};



// ExpertProfile 타입 사용
type ExpertItem = ExpertProfile;

type SortBy = "rating" | "experience" | "reviews" | "level" | "ranking";




const ExpertSearch = () => {
  const router = useRouter();
  // Fixed: removed showAllCategories references for category-based search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<ExpertItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(9);
  // 상담 추천 관련 상태 제거 (컴포넌트 비활성화로 인해)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allExperts, setAllExperts] = useState<ExpertItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingExperts, setIsLoadingExperts] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // 로컬 스토리지에서 좋아요 상태 로드
  const loadFavoritesFromStorage = () => {
    try {
      const stored = localStorage.getItem('likedExperts');
      const favorites = stored ? JSON.parse(stored) : [];
      setFavorites(favorites);
      console.log('로컬 스토리지에서 좋아요 상태 로드:', favorites);
      return favorites;
    } catch (error) {
      console.error('좋아요 상태 로드 실패:', error);
      return [];
    }
  };

  // 로컬 스토리지에 좋아요 상태 저장
  const saveFavoritesToStorage = (favorites: number[]) => {
    try {
      localStorage.setItem('likedExperts', JSON.stringify(favorites));
      console.log('로컬 스토리지에 좋아요 상태 저장:', favorites);
    } catch (error) {
      console.error('좋아요 상태 저장 실패:', error);
    }
  };

  // 페이지 로드 시 좋아요 상태 로드
  useEffect(() => {
    loadFavoritesFromStorage();
  }, []);

  // 좋아요 상태 변경 이벤트 리스너
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      console.log('좋아요 상태 업데이트 이벤트 수신');
      loadFavoritesFromStorage();
    };

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    // 페이지 포커스 시 좋아요 상태 새로고침
    const handleFocus = () => {
      console.log('페이지 포커스, 좋아요 상태 새로고침');
      loadFavoritesFromStorage();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await api.get('/categories?activeOnly=true');

        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          console.error('카테고리 로드 실패:', response.error?.message || 'Unknown error');
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);


  // 전문가 프로필 데이터 로드
  useEffect(() => {
    const loadExpertProfiles = async () => {
      try {
        console.log('전문가 프로필 로드 시작...');
        setIsLoadingExperts(true);

        // API 호출을 통한 전문가 프로필 조회
        console.log('전문가 프로필 조회 중...');
        const response = await api.get('/experts?size=50');
        console.log('전문가 프로필 조회 결과:', response);

        if (response.success && response.data) {
          console.log('전문가 데이터 설정:', response.data.items?.length || 0, '명');

          // API 응답을 ExpertProfile 타입으로 변환
          const convertedExperts = response.data.items.map((apiExpert: any) => {
            // JSON 필드 파싱 유틸리티 함수
            const parseJsonField = (field: any, fallback: any = null) => {
              if (Array.isArray(field)) return field;
              if (typeof field === 'string') {
                try {
                  return JSON.parse(field);
                } catch (e) {
                  return fallback;
                }
              }
              return field || fallback;
            };

            return {
              id: parseInt(apiExpert.id),
              displayId: apiExpert.displayId,
              name: apiExpert.name,
              specialty: apiExpert.title || apiExpert.specialty || '전문가',
              experience: apiExpert.experience || 0,
              description: apiExpert.bio || apiExpert.description || '',
              specialties: apiExpert.categories || parseJsonField(apiExpert.specialties, []),
              consultationTypes: parseJsonField(apiExpert.consultationTypes, ['video', 'chat']),
              languages: parseJsonField(apiExpert.languages, ['한국어']),
              hourlyRate: apiExpert.hourlyRate || 50000,
              ratePerMin: apiExpert.ratePerMin || Math.ceil((apiExpert.hourlyRate || 50000) / 60),
              totalSessions: apiExpert.totalSessions || 0,
              avgRating: apiExpert.ratingAvg || 4.5,
              rating: apiExpert.ratingAvg || 4.5,
              reviewCount: apiExpert.reviewCount || 0,
              repeatClients: apiExpert.repeatClients || 0,
              responseTime: apiExpert.responseTime || '1시간 이내',
              profileImage: apiExpert.avatarUrl || null,
              level: parseInt(apiExpert.level?.match(/\d+/)?.[0] || '1'),
              rankingScore: apiExpert.rankingScore || 0,
              recentReviews: apiExpert.recentReviews || [],
              categorySlugs: apiExpert.categorySlugs || [],
              // UI 표시용 필드들
              price: apiExpert.hourlyRate ? `₩${apiExpert.hourlyRate.toLocaleString()}/시간` : '가격 문의',
              image: apiExpert.avatarUrl || null,
              createdAt: new Date(apiExpert.createdAt || Date.now()),
              updatedAt: new Date(apiExpert.updatedAt || Date.now()),
              isActive: apiExpert.isActive !== false,
              isProfileComplete: apiExpert.isProfileComplete !== false,
              isOnline: true,
              // ExpertCard에서 기대하는 추가 필드들
              tags: apiExpert.categories || parseJsonField(apiExpert.specialties, []),
              consultationCount: apiExpert.totalSessions || 0,
            };
          });

          console.log('변환된 전문가 데이터:', convertedExperts.length, '명');
          setAllExperts(convertedExperts);
        } else {
          console.error('API 응답 실패:', response.error);
          setAllExperts([]);
        }
      } catch (error) {
        console.error('전문가 프로필 로드 실패:', error);
        setAllExperts([]);
      } finally {
        setIsLoadingExperts(false);
      }
    };

    loadExpertProfiles();
  }, []);

  // 전문가 데이터가 로드되면 추가 처리 (필요시)
  useEffect(() => {
    if (allExperts.length === 0) return;

    console.log('전문가 데이터 로드 완료:', allExperts.length, '명');

    // 랭킹 점수가 없는 전문가들은 계산해서 설정
    setAllExperts(prevExperts =>
      prevExperts.map(expert => ({
        ...expert,
        rankingScore: expert.rankingScore || calculateRankingScore({
          totalSessions: expert.totalSessions || 0,
          avgRating: expert.rating || 0,
          reviewCount: expert.reviewCount || 0,
          repeatClients: expert.repeatClients || 0,
          likeCount: 0
        })
      }))
    );
  }, [allExperts.length]);

  // 실시간 데이터 업데이트를 위한 이벤트 리스너
  useEffect(() => {
    const handleExpertDataUpdate = () => {
      console.log('전문가 데이터 업데이트 이벤트 수신');
      refreshExpertData();
    };

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('expertDataUpdated', handleExpertDataUpdate);
    
    // 페이지 포커스 시 데이터 새로고침
    const handleFocus = () => {
      console.log('페이지 포커스, 데이터 새로고침');
      refreshExpertData();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('expertDataUpdated', handleExpertDataUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered: ExpertItem[] = allExperts;

    // 카테고리 필터
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((expert: ExpertItem) => {
        // 카테고리 이름으로 필터링
        const categoryNames = expert.specialties || [];
        return categoryNames.some(category =>
          category && typeof category === 'string' &&
          category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
      });
    }

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(
        (expert: ExpertItem) =>
          expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expert.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expert.specialties.some((s) =>
            s.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          expert.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    switch (sortBy) {
      case "rating":
        filtered.sort((a: ExpertItem, b: ExpertItem) => b.rating - a.rating);
        break;
      case "experience":
        filtered.sort(
          (a: ExpertItem, b: ExpertItem) => b.experience - a.experience
        );
        break;
      case "reviews":
        filtered.sort(
          (a: ExpertItem, b: ExpertItem) => b.reviewCount - a.reviewCount
        );
        break;
      case "level":
        filtered.sort(
          (a: ExpertItem, b: ExpertItem) => (b.level || 0) - (a.level || 0)
        );
        break;
      case "ranking":
        // 서비스 공식 랭킹 계산 로직 사용 (공통 유틸리티)
        filtered.sort((a: ExpertItem, b: ExpertItem) => {
          const scoreA = a.rankingScore || calculateRankingScore({
            totalSessions: a.totalSessions || 0,
            avgRating: a.rating || 0,
            reviewCount: a.reviewCount || 0,
            repeatClients: a.repeatClients || 0,
            likeCount: (a as any).likeCount || 0
          });
          const scoreB = b.rankingScore || calculateRankingScore({
            totalSessions: b.totalSessions || 0,
            avgRating: b.rating || 0,
            reviewCount: b.reviewCount || 0,
            repeatClients: b.repeatClients || 0,
            likeCount: (b as any).likeCount || 0
          });
          return scoreB - scoreA; // 높은 점수가 먼저
        });
        break;
      default:
        break;
    }

    setFilteredExperts(filtered);
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedCategory, allExperts]);


  const toggleFavorite = (expertId: number) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(expertId)
        ? prev.filter((id) => id !== expertId)
        : [...prev, expertId];
      
      // 로컬 스토리지에 저장
      saveFavoritesToStorage(newFavorites);
      
      return newFavorites;
    });
  };


  // 전문가 데이터 새로고침
  const refreshExpertData = async () => {
    try {
      console.log('전문가 데이터 새로고침 시작...');

      // 전문가 프로필 다시 로드
      const response = await api.get('/experts?size=50');

      if (response.success && response.data) {
        const convertedExperts = response.data.items.map((apiExpert: any) => {
          // JSON 필드 파싱 유틸리티 함수
          const parseJsonField = (field: any, fallback: any = null) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string') {
              try {
                return JSON.parse(field);
              } catch (e) {
                return fallback;
              }
            }
            return field || fallback;
          };

          return {
            id: parseInt(apiExpert.id),
            displayId: apiExpert.displayId,
            name: apiExpert.name,
            specialty: apiExpert.title || apiExpert.specialty || '전문가',
            experience: apiExpert.experience || 0,
            description: apiExpert.bio || apiExpert.description || '',
            specialties: apiExpert.categories || parseJsonField(apiExpert.specialties, []),
            consultationTypes: parseJsonField(apiExpert.consultationTypes, ['video', 'chat']),
            languages: parseJsonField(apiExpert.languages, ['한국어']),
            hourlyRate: apiExpert.hourlyRate || 50000,
            ratePerMin: apiExpert.ratePerMin || Math.ceil((apiExpert.hourlyRate || 50000) / 60),
            totalSessions: apiExpert.totalSessions || 0,
            avgRating: apiExpert.ratingAvg || 4.5,
            rating: apiExpert.ratingAvg || 4.5,
            reviewCount: apiExpert.reviewCount || 0,
            repeatClients: apiExpert.repeatClients || 0,
            responseTime: apiExpert.responseTime || '1시간 이내',
            profileImage: apiExpert.avatarUrl || null,
            level: parseInt(apiExpert.level?.match(/\d+/)?.[0] || '1'),
            rankingScore: apiExpert.rankingScore || calculateRankingScore({
              totalSessions: apiExpert.totalSessions || 0,
              avgRating: apiExpert.ratingAvg || 4.5,
              reviewCount: apiExpert.reviewCount || 0,
              repeatClients: apiExpert.repeatClients || 0,
              likeCount: 0
            }),
            recentReviews: apiExpert.recentReviews || [],
            categorySlugs: apiExpert.categorySlugs || [],
            // UI 표시용 필드들
            price: apiExpert.hourlyRate ? `₩${apiExpert.hourlyRate.toLocaleString()}/시간` : '가격 문의',
            image: apiExpert.avatarUrl || null,
            createdAt: new Date(apiExpert.createdAt || Date.now()),
            updatedAt: new Date(apiExpert.updatedAt || Date.now()),
            isActive: apiExpert.isActive !== false,
            isProfileComplete: apiExpert.isProfileComplete !== false,
            isOnline: true,
            // ExpertCard에서 기대하는 추가 필드들
            tags: apiExpert.categories || parseJsonField(apiExpert.specialties, []),
            consultationCount: apiExpert.totalSessions || 0,
          };
        });

        setAllExperts(convertedExperts);
        console.log('전문가 데이터 새로고침 완료:', convertedExperts.length, '명');
      }
    } catch (error) {
      console.error('전문가 데이터 새로고침 실패:', error);
    }
  };



  // 페이징 관련 계산
  const totalPages = Math.ceil(filteredExperts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExperts: ExpertItem[] = filteredExperts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleProfileView = (expert: ExpertItem) => {
    // 전문가 프로필 페이지로 이동 (displayId 사용)
    const targetId = expert.displayId || expert.id;
    router.push(`/experts/${targetId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <main className="w-full px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* 헤더 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">전문가 찾기</h1>
              <p className="text-gray-600">
                다양한 분야의 전문가들을 찾아 상담받아보세요
              </p>
            </div>

        {/* 상담 요약 추천 섹션 - 임시 비활성화
        <ConsultationRecommendation
          consultationTopic={consultationTopic}
          consultationSummary={consultationSummary}
          showRecommendation={showRecommendation}
          isRecommendationCollapsed={isRecommendationCollapsed}
          setIsRecommendationCollapsed={setIsRecommendationCollapsed}
        />
        */}

        {/* 검색 및 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="전문가 이름, 전문분야, 키워드로 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


            {/* 정렬 선택 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">평점 높은 순</option>
              <option value="level">레벨 높은 순</option>
              <option value="ranking">랭킹 순</option>
              <option value="experience">경력 많은 순</option>
              <option value="reviews">리뷰 많은 순</option>
            </select>
            
            {/* 랭킹 페이지 버튼 */}
            <button
              onClick={() => router.push('/experts/rankings')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Trophy className="h-5 w-5" />
              <span>랭킹</span>
            </button>
            
            {/* 새로고침 버튼 */}
            <button
              onClick={refreshExpertData}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              title="전문가 데이터 새로고침"
            >
              <RefreshCw className="h-5 w-5" />
              <span>새로고침</span>
            </button>
          </div>

          {/* 카테고리별 검색 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                카테고리별 검색
              </h3>
              <div className="flex items-center gap-2">
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded"
                  >
                    전체
                  </button>
                )}
                {!isLoadingCategories && (categories.length > 8 || (!categories.length && 12 > 8)) && (
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 inline-flex items-center gap-1"
                  >
                    {showAllCategories ? '접기' : '전체보기'}
                    {!showAllCategories && (
                      <span className="text-xs text-blue-500">
                        (+{categories.length > 0 ? categories.length - 8 : 4})
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {isLoadingCategories ? (
                // 로딩 상태일 때 스켈레톤 UI 표시
                Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 sm:h-11 w-20 sm:w-24 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))
              ) : categories.length > 0 ? (
                // API에서 가져온 카테고리들을 표시 (첫 줄만 또는 전체)
                categories.slice(0, showAllCategories ? categories.length : 8).map((category) => {
                  // 아이콘 매핑
                  const getIconComponent = (iconName: string) => {
                    const iconMap: { [key: string]: any } = {
                      Target,
                      Brain,
                      DollarSign,
                      Scale,
                      BookOpen,
                      Heart,
                      Users,
                      Briefcase,
                      Code,
                      Palette,
                      Languages,
                      Music,
                      Plane,
                      Scissors,
                      Trophy,
                      Sprout,
                      TrendingUp,
                      Video,
                      Star,
                      ShoppingBag,
                      ChefHat,
                      PawPrint,
                      Building2,
                      GraduationCap,
                      Home,
                      Monitor
                    };
                    return iconMap[iconName] || Target;
                  };

                  const IconComponent = getIconComponent(category.icon);
                  const isSelected = selectedCategory === category.nameKo;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.nameKo);
                      }}
                      className={`flex items-center justify-start px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] sm:min-h-[45px] w-auto ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="text-left leading-tight text-xs sm:text-sm font-medium whitespace-nowrap">{category.nameKo}</span>
                    </button>
                  );
                })
              ) : (
                // API에서 카테고리를 가져올 수 없을 때 fallback 카테고리 표시
                [
                  { name: "심리상담", icon: Brain },
                  { name: "법률상담", icon: Scale },
                  { name: "재무상담", icon: DollarSign },
                  { name: "건강상담", icon: Heart },
                  { name: "진로상담", icon: Target },
                  { name: "부동산상담", icon: Home },
                  { name: "IT상담", icon: Monitor },
                  { name: "교육상담", icon: BookOpen },
                  { name: "비즈니스상담", icon: Briefcase },
                  { name: "마케팅상담", icon: TrendingUp },
                  { name: "언어상담", icon: Languages },
                  { name: "음악상담", icon: Music },
                ].slice(0, showAllCategories ? 12 : 8).map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.name;

                  return (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                      }}
                      className={`flex items-center justify-start px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] sm:min-h-[45px] w-auto ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="text-left leading-tight text-xs sm:text-sm font-medium whitespace-nowrap">{category.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* 검색 결과 및 상단 페이징 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-gray-600">
                총 <span className="font-semibold">{filteredExperts.length}</span>
                명의 전문가를 찾았습니다
                {filteredExperts.length > 0 && (
                  <span className="ml-2 text-sm">
                    (페이지 {currentPage} / {totalPages})
                  </span>
                )}
              </p>
              {selectedCategory !== 'all' && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">카테고리:</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {selectedCategory}
                  </span>
                </div>
              )}
            </div>

            {/* 상단 페이징 */}
            {filteredExperts.length > 0 && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-2 py-1 rounded border transition-colors text-sm ${
                    currentPage === 1
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-2 py-1 rounded border transition-colors text-sm ${
                    currentPage === totalPages
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 전문가 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoadingExperts ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">전문가 데이터를 로딩 중입니다...</p>
            </div>
          ) : currentExperts.length > 0 ? (
            currentExperts.map((expert: ExpertItem) => {
              console.log('Rendering expert:', expert); // 디버깅용 로그
              return (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  mode="default"
                  showFavoriteButton={true}
                  isFavorite={favorites.includes(expert.id as number)}
                  onToggleFavorite={(id) => toggleFavorite(Number(id))}
                  showProfileButton={true}
                  onProfileView={() => handleProfileView(expert)}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 페이징 */}
        {filteredExperts.length > 0 && totalPages > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                이전
              </button>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {filteredExperts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="max-w-md mx-auto">
              <Users className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchQuery
                  ? "검색 조건에 맞는 전문가가 없습니다"
                  : "전문가를 검색해보세요"}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {searchQuery ? (
                  <>
                    현재 검색 조건에 맞는 전문가를 찾을 수 없습니다.
                    <br />
                    다른 키워드로 다시 시도해보세요.
                  </>
                ) : (
                  <>
                    다양한 분야의 전문가들이 준비되어 있습니다.
                    <br />
                    검색창에 키워드를 입력해보세요.
                  </>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                  >
                    🔄 검색 초기화
                  </button>
                )}
              </div>

              {/* 인기 검색어 제안 */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  인기 검색 분야
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "심리상담",
                    "법률상담",
                    "재무상담",
                    "건강상담",
                    "진로상담",
                  ].map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => {
                        setSearchQuery(keyword);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExpertSearch;
