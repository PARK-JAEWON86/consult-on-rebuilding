"use client";

import { useState, useEffect } from "react";
import { TrendingUp, User, MessageCircle, Heart, MessageSquare, ChevronDown, ChevronUp, UserCheck, Briefcase, LogIn, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
  postCount?: number;
  receivedLikes?: number;
  commentCount?: number;
  expert?: {
    id: number;
    specialty: string;
    level: number;
    experience: number;
    rating: number;
  };
}

interface UserStats {
  postCount: number;
  commentCount: number;
  receivedLikes: number;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategorySidebarProps {
  categories: Category[];
  activeTab: string;
  onTabChange: (categoryId: string) => void;
  popularTags?: string[];
  onTagClick?: (tag: string) => void;
  onCreatePost?: () => void;
  isAuthenticated?: boolean;
  user?: any;
  communityStats?: {
    totalPosts: number;
    activeUsers: number;
    todayPosts: number;
  };
  onMyPostsClick?: () => void;
  isMyPostsActive?: boolean;
  onMyCommentsClick?: () => void;
  isMyCommentsActive?: boolean;
  refreshStats?: number;
  profileMode?: 'expert' | 'client';
  onProfileModeChange?: (mode: 'expert' | 'client') => void;
}

const CategorySidebar = ({
  categories,
  activeTab,
  onTabChange,
  popularTags = [],
  onTagClick,
  onCreatePost,
  isAuthenticated: isAuthenticatedProp,
  user: userProp,
  communityStats = { totalPosts: 0, activeUsers: 0, todayPosts: 0 },
  onMyPostsClick,
  isMyPostsActive = false,
  onMyCommentsClick,
  isMyCommentsActive = false,
  refreshStats = 0,
  profileMode = 'client',
  onProfileModeChange,
}: CategorySidebarProps) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });

  const [userStats, setUserStats] = useState<UserStats>({
    postCount: 0,
    commentCount: 0,
    receivedLikes: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const router = useRouter();

  // 앱 상태 로드
  useEffect(() => {
    const loadAppState = async () => {
      try {
        // 먼저 로컬 스토리지에서 확인
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          try {
            const user = JSON.parse(storedUser);
            const isAuth = JSON.parse(storedAuth);
            
            if (isAuth) {
              setAppState({
                isAuthenticated: true,
                user: user
              });
              return;
            }
          } catch (error) {
            console.error('로컬 스토리지 파싱 오류:', error);
          }
        }
        
        // API에서 앱 상태 로드 (백업)
        const response = await fetch('/api/app-state');
        const result = await response.json();
        if (result.success) {
          setAppState({
            isAuthenticated: result.data.isAuthenticated,
            user: result.data.user
          });
        }
      } catch (error) {
        console.error('앱 상태 로드 실패:', error);
      }
    };

    loadAppState();
  }, []);

  // localStorage 변경 감지하여 상태 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          const user = JSON.parse(storedUser);
          const isAuthenticated = JSON.parse(storedAuth);
          
          setAppState(prev => ({
            ...prev,
            isAuthenticated,
            user: isAuthenticated ? user : null
          }));
        } else {
          setAppState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null
          }));
        }
      } catch (error) {
        console.error('localStorage 변경 감지 시 파싱 오류:', error);
        // 파싱 오류 시 localStorage 정리
        localStorage.removeItem('consulton-user');
        localStorage.removeItem('consulton-auth');
        setAppState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null
        }));
      }
    };

    // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // 커스텀 이벤트 리스너 (같은 탭에서의 변경 감지)
      window.addEventListener('authStateChanged', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('authStateChanged', handleStorageChange);
      };
    }
  }, []);

  // props로 전달받은 인증 상태를 우선적으로 사용, 없으면 내부 상태 사용
  const isAuthenticated = isAuthenticatedProp !== undefined ? isAuthenticatedProp : appState.isAuthenticated;
  const user = userProp || appState.user;

  // 사용자 통계 로드
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingStats(true);
        console.log('사용자 통계 로드 시도:', user.id, '프로필 모드:', profileMode);
        const response = await fetch(`/api/user/stats?userId=${user.id}&profileMode=${profileMode}`);
        console.log('사용자 통계 응답:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('사용자 통계 데이터:', data);
          if (data.success) {
            console.log('설정할 통계 데이터:', data.data);
            setUserStats(data.data);
          }
        }
      } catch (error) {
        console.error('사용자 통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadUserStats();
  }, [user?.id, refreshStats, profileMode]);
  
  // 상위 7개 카테고리 (전체 포함)
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 7);
  const hasMoreCategories = categories.length > 7;

  return (
    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* 개인 프로필 */}
      <div className={`rounded-lg shadow-sm border p-4 ${
        profileMode === 'expert' 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
          : 'bg-white border-gray-200'
      }`}>
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{user?.name || "사용자"}</h3>
                {profileMode === 'expert' ? (
                  <div className="text-sm text-gray-500">
                    <p className="font-medium text-blue-600">전문가</p>
                    {user?.expert ? (
                      <p className="text-xs text-gray-400">{user.expert.specialty} • 레벨 1</p>
                    ) : (
                      <p className="text-xs text-gray-400">전문가 정보 없음</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">회원</p>
                )}
              </div>
              {user?.role === 'expert' && onProfileModeChange && (
                <button
                  onClick={() => {
                    const newMode = profileMode === 'expert' ? 'client' : 'expert';
                    onProfileModeChange(newMode);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title={profileMode === 'expert' ? '사용자 모드로 전환' : '전문가 모드로 전환'}
                >
                  {profileMode === 'expert' ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            
            <div className={`flex items-center justify-center gap-2 mb-4 px-2 ${
              profileMode === 'expert' 
                ? 'bg-white/50 rounded-lg py-2' 
                : ''
            }`}>
              <div 
                className={`cursor-pointer transition-colors ${
                  isMyPostsActive 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={onMyPostsClick}
                title="내가 쓴 글 보기"
              >
                <span className="text-sm">내가 쓴 글</span>
                <span className="ml-1 text-sm font-medium">
                  {isLoadingStats ? '...' : userStats.postCount}
                </span>
              </div>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <div 
                className={`cursor-pointer transition-colors ${
                  isMyCommentsActive 
                    ? 'text-green-600 font-medium' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
                onClick={onMyCommentsClick}
                title="내가 쓴 댓글 보기"
              >
                <span className="text-sm">내가 쓴 댓글</span>
                <span className="ml-1 text-sm font-medium">
                  {isLoadingStats ? '...' : userStats.commentCount}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onCreatePost}
              className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors duration-200 shadow-sm"
            >
              새 글 작성하기
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-lg">
                G
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">게스트</h3>
                <p className="text-sm text-gray-500">로그인이 필요합니다</p>
              </div>
            </div>
            
            <button 
              onClick={() => router.push("/auth/login")}
              className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              로그인하기
            </button>
          </>
        )}
      </div>

      {/* 카테고리 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">카테고리</h3>
        <div className="space-y-2">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onTabChange(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === category.id
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{category.name}</span>
              <span className="text-sm text-gray-400">{category.count}</span>
            </button>
          ))}
          
          {/* 더보기/접기 버튼 */}
          {hasMoreCategories && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full flex items-center justify-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
            >
              <span className="mr-1">
                {showAllCategories ? "접기" : `더보기 (+${categories.length - 7})`}
              </span>
              {showAllCategories ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 인기 태그 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">인기 태그</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-blue-100 hover:text-blue-600 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 커뮤니티 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">커뮤니티 현황</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">전체 게시글</span>
            <span className="text-sm font-medium text-gray-900">{communityStats.totalPosts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">활성 사용자</span>
            <span className="text-sm font-medium text-gray-900">{communityStats.activeUsers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">오늘 새글</span>
            <span className="text-sm font-medium text-blue-600">{communityStats.todayPosts}</span>
          </div>
        </div>
      </div>

      {/* 커뮤니티 규칙 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2">커뮤니티 규칙</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 서로를 존중하며 예의를 지켜주세요</li>
          <li>• 개인정보 공유를 금지합니다</li>
          <li>• 광고성 게시글은 삭제됩니다</li>
          <li>• 전문적인 조언은 자격을 갖춘 전문가에게</li>
        </ul>
      </div>
    </div>
  );
};

export default CategorySidebar;
