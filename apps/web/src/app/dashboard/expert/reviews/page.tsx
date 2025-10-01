"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Calendar,
  User,
  FileText,
  Filter,
  Search,
  MessageSquare,
  TrendingUp,
  Award,
  Eye,
} from 'lucide-react';

interface Review {
  id: number;
  reservationId: number;
  userId: number;
  userName: string;
  consultationDate: string;
  consultationType: string;
  rating: number;
  content: string;
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export default function ExpertReviewsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  // 전문가가 받은 리뷰 목록
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['expertReviews', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/expert-reviews?expertId=${user?.id}`);
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!user?.id && isAuthenticated && user?.roles?.includes('EXPERT'),
  });

  // 리뷰 통계
  const { data: statsData } = useQuery({
    queryKey: ['expertReviewStats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/expert-stats?expertId=${user?.id}`);
      const result = await response.json();
      return result.success ? result.data : {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {}
      };
    },
    enabled: !!user?.id && isAuthenticated && user?.roles?.includes('EXPERT'),
  });

  const reviews: Review[] = reviewsData || [];
  const stats: ReviewStats = statsData || { totalReviews: 0, averageRating: 0, ratingDistribution: {} };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/expert/reviews');
    } else if (!user?.roles?.includes('EXPERT')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user?.roles?.includes('EXPERT')) {
    return null;
  }

  // 필터링된 리뷰
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchQuery ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;

    const matchesVisibility = visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && review.isPublic) ||
      (visibilityFilter === 'private' && !review.isPublic);

    return matchesSearch && matchesRating && matchesVisibility;
  });

  // 별점 렌더링
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 별점 분포 차트용 데이터
  const getRatingPercentage = (rating: number) => {
    return stats.totalReviews > 0
      ? ((stats.ratingDistribution[rating] || 0) / stats.totalReviews * 100)
      : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">리뷰 관리</h1>
        <p className="text-gray-600">
          고객들이 작성한 리뷰를 확인하고 관리하세요.
        </p>
      </div>

      {/* 리뷰 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">총 리뷰 수</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">평균 별점</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}/5.0
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">공개 리뷰</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.filter(r => r.isPublic).length}개
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">5점 리뷰</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.ratingDistribution[5] || 0}개
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 별점 분포 차트 */}
      {stats.totalReviews > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">별점 분포</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm font-medium text-gray-700">{rating}점</span>
                </div>
                <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${getRatingPercentage(rating)}%` }}
                  ></div>
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 리뷰 목록 */}
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">받은 리뷰</h2>

            {/* 필터 및 검색 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 검색 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="리뷰 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 별점 필터 */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 별점</option>
                <option value={5}>5점</option>
                <option value={4}>4점</option>
                <option value={3}>3점</option>
                <option value={2}>2점</option>
                <option value={1}>1점</option>
              </select>

              {/* 공개/비공개 필터 */}
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">리뷰가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || ratingFilter !== 'all' || visibilityFilter !== 'all'
                  ? '검색 조건에 맞는 리뷰가 없습니다.'
                  : '아직 받은 리뷰가 없습니다. 상담을 진행하여 리뷰를 받아보세요.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-colors ${
                    selectedReview?.id === review.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {review.isAnonymous ? '익명 사용자' : review.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(review.consultationDate)} · {review.consultationType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">{review.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{review.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        review.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.isPublic ? '공개' : '비공개'}
                      </span>
                      {review.isAnonymous && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          익명
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 선택된 리뷰 상세 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">리뷰 상세</h2>
          {selectedReview ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedReview.isAnonymous ? '익명 사용자' : selectedReview.userName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedReview.consultationDate)} · {selectedReview.consultationType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedReview.rating, 'md')}
                    <span className="ml-2 text-lg font-medium text-gray-900">
                      {selectedReview.rating}.0
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedReview.content}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    selectedReview.isPublic
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedReview.isPublic ? '공개 리뷰' : '비공개 리뷰'}
                  </span>
                  {selectedReview.isAnonymous && (
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                      익명 작성
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500 pt-3 border-t">
                  <p>작성일: {formatDate(selectedReview.createdAt)}</p>
                  {selectedReview.updatedAt !== selectedReview.createdAt && (
                    <p>수정일: {formatDate(selectedReview.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">리뷰를 선택해주세요</h3>
              <p className="text-gray-600">
                왼쪽에서 리뷰를 선택하면 상세 정보를 확인할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}