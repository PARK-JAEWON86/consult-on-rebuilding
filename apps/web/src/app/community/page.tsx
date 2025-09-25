"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SearchAndFilter from "@/components/community/SearchAndFilter";
import PostCard from "@/components/community/PostCard";
import CategorySidebar from "@/components/community/CategorySidebar";
import CreatePostModal from "@/components/community/CreatePostModal";
import ConsultationRequestModal from "@/components/community/ConsultationRequestModal";
import ExpertContactModal from "@/components/community/ExpertContactModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

interface Post {
  id: string;
  author: {
    id: number;
    name: string;
    role?: string;
  };
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  postType: "consultation_request" | "consultation_review" | "expert_intro" | "general";
  urgency?: string;
  preferredMethod?: string;
  likes: number;
  comments: number;
  views: number;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  postCount?: number;
}

interface CommunityStats {
  totalPosts: number;
  activeUsers: number;
  todayPosts: number;
}

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "comments" | "views">("latest");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isConsultationRequestOpen, setIsConsultationRequestOpen] = useState(false);
  const [isExpertContactOpen, setIsExpertContactOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [profileMode, setProfileMode] = useState<'expert' | 'client'>('client');
  const [isMyPostsActive, setIsMyPostsActive] = useState(false);
  const [isMyCommentsActive, setIsMyCommentsActive] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});

  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 게시글 작성 뮤테이션
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/community/posts', data);
      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : '게시글 작성에 실패했습니다.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['communityStats'] });
    },
  });

  // 상담 요청 뮤테이션
  const createConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/community/posts', data);
      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : '상담 요청에 실패했습니다.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['communityStats'] });
    },
  });

  // 전문가 연락 뮤테이션
  const expertContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/community/expert-proposals', data);
      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : '전문가 연락에 실패했습니다.');
      }
      return response.data;
    },
    onSuccess: () => {
      // 필요시 관련 쿼리 무효화
    },
  });

  // 카테고리 데이터 로드
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/community/categories');
      return response.success ? response.data : [];
    },
  });

  // 게시글 데이터 로드
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['posts', activeCategory, searchQuery, sortBy, advancedFilters, isMyPostsActive, isMyCommentsActive],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: activeCategory,
        search: searchQuery,
        sortBy: sortBy,
        ...advancedFilters,
        ...(isMyPostsActive && user ? { userId: user.id, type: 'posts' } : {}),
        ...(isMyCommentsActive && user ? { userId: user.id, type: 'comments' } : {}),
      });

      const response = await api.get(`/community/posts?${params}`);
      return response.success ? response.data : [];
    },
  });

  // 커뮤니티 통계 로드
  const { data: communityStats = { totalPosts: 0, activeUsers: 0, todayPosts: 0 } } = useQuery<CommunityStats>({
    queryKey: ['communityStats'],
    queryFn: async () => {
      const response = await api.get('/community/stats');
      return response.success ? response.data : { totalPosts: 0, activeUsers: 0, todayPosts: 0 };
    },
  });

  // 인기 태그 데이터 로드
  const { data: popularTags = [] } = useQuery<string[]>({
    queryKey: ['popularTags'],
    queryFn: async () => {
      const response = await api.get('/community/tags/popular');
      return response.success ? response.data : [];
    },
  });

  const handleCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handleCreateConsultationRequest = () => {
    setIsConsultationRequestOpen(true);
  };

  const handlePostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      if (post.postType === 'consultation_request') {
        setIsExpertContactOpen(true);
      }
    }
  };

  const handleMyPostsClick = () => {
    setIsMyPostsActive(!isMyPostsActive);
    setIsMyCommentsActive(false);
  };

  const handleMyCommentsClick = () => {
    setIsMyCommentsActive(!isMyCommentsActive);
    setIsMyPostsActive(false);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 */}
          <div className="lg:w-72 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              activeTab={activeCategory}
              onTabChange={setActiveCategory}
              popularTags={popularTags}
              onTagClick={handleTagClick}
              onCreatePost={handleCreatePost}
              communityStats={communityStats}
              onMyPostsClick={handleMyPostsClick}
              isMyPostsActive={isMyPostsActive}
              onMyCommentsClick={handleMyCommentsClick}
              isMyCommentsActive={isMyCommentsActive}
              profileMode={profileMode}
              onProfileModeChange={setProfileMode}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1">
            {/* 검색 및 필터 */}
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onFilterClick={() => {}}
              onAdvancedFilter={setAdvancedFilters}
            />

            {/* 게시글 목록 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeCategory === "all" ? "전체 게시글" :
                     categories.find(c => c.id.toString() === activeCategory)?.name || "게시글"}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePost}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      일반글 작성
                    </button>
                    <button
                      onClick={handleCreateConsultationRequest}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      상담 요청
                    </button>
                  </div>
                </div>
              </div>

              {/* 게시글 목록 헤더 */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                <div className="col-span-1 text-center">번호</div>
                <div className="col-span-5">제목</div>
                <div className="col-span-1 text-center">분야</div>
                <div className="col-span-1 text-center">작성자</div>
                <div className="col-span-1 text-center">날짜</div>
                <div className="col-span-2 text-center">좋아요/댓글</div>
                <div className="col-span-1 text-center">조회</div>
              </div>

              {/* 게시글 목록 */}
              {postsLoading ? (
                <div className="p-8 text-center text-gray-500">
                  게시글을 불러오는 중...
                </div>
              ) : posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  게시글이 없습니다.
                </div>
              ) : (
                posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={posts.length - index}
                    onPostClick={handlePostClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={createPostMutation.mutateAsync}
      />

      <ConsultationRequestModal
        isOpen={isConsultationRequestOpen}
        onClose={() => setIsConsultationRequestOpen(false)}
        onSubmit={createConsultationMutation.mutateAsync}
      />

      <ExpertContactModal
        isOpen={isExpertContactOpen}
        onClose={() => setIsExpertContactOpen(false)}
        consultationPost={selectedPost}
        onSubmit={expertContactMutation.mutateAsync}
      />
    </div>
  );
}
