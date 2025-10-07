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
  Plus,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Review {
  id: number;
  reservationId: number;
  expertId: number;
  expertName: string;
  consultationDate: string;
  consultationType: string;
  rating: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PendingReview {
  id: number;
  expertId: number;
  expertName: string;
  consultationDate: string;
  consultationType: string;
  topic: string;
}

export default function ReviewsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // 내가 작성한 리뷰 목록
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['myReviews', user?.id],
    queryFn: async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiBaseUrl}/reviews?userId=${user?.id}`);
      if (!response.ok) {
        console.warn('리뷰 목록 조회 실패:', response.status);
        return [];
      }
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // 리뷰 작성 대기 목록
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingReviews', user?.id],
    queryFn: async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiBaseUrl}/reservations?userId=${user?.id}&status=completed&hasReview=false`);
      if (!response.ok) {
        console.warn('리뷰 대기 목록 조회 실패:', response.status);
        return [];
      }
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!user?.id && isAuthenticated,
  });

  const reviews: Review[] = Array.isArray(reviewsData) ? reviewsData : [];
  const pendingReviews: PendingReview[] = Array.isArray(pendingData) ? pendingData : [];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/reviews');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  // 필터링된 리뷰
  const filteredReviews = Array.isArray(reviews) ? reviews.filter(review => {
    const matchesSearch = !searchQuery ||
      review.expertName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;

    return matchesSearch && matchesRating;
  }) : [];

  // 리뷰 삭제
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiBaseUrl}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('리뷰가 삭제되었습니다.');
        window.location.reload();
      } else {
        alert('리뷰 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 삭제 오류:', error);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

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

  // 리뷰 통계
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">내 리뷰</h1>
        <p className="text-gray-600">
          작성한 리뷰를 관리하고 새로운 리뷰를 작성해보세요.
        </p>
      </div>

      {/* 리뷰 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">총 리뷰 수</p>
              <p className="text-2xl font-bold text-gray-900">{totalReviews}개</p>
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
              <p className="text-2xl font-bold text-gray-900">{averageRating}/5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Edit3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">작성 대기</p>
              <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* 리뷰 작성 대기 섹션 */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">리뷰 작성 대기</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {pendingReviews.length}개
              </span>
            </div>
            <div className="space-y-3">
              {pendingReviews.slice(0, 3).map((pending) => (
                <div
                  key={pending.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{pending.expertName}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(pending.consultationDate)} · {pending.consultationType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/reviews/write/${pending.id}`)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    리뷰 작성
                  </button>
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  그 외 {pendingReviews.length - 3}개 더...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 목록 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">작성한 리뷰</h2>
          <div className="flex items-center space-x-2">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="리뷰 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {searchQuery || ratingFilter !== 'all'
                ? '검색 조건에 맞는 리뷰가 없습니다.'
                : '아직 작성한 리뷰가 없습니다. 상담 후 리뷰를 작성해보세요.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* 리뷰 요약 (항상 표시) */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900">{review.expertName}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(review.consultationDate)} · {review.consultationType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600 ml-1">{review.rating}.0</span>
                      </div>
                      {expandedReviewId === review.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{review.content}</p>

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

                {/* 리뷰 상세 (드롭다운) */}
                {expandedReviewId === review.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">{review.title}</h4>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{review.content}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        review.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.isPublic ? '공개 리뷰' : '비공개 리뷰'}
                      </span>
                      {review.isAnonymous && (
                        <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                          익명 작성
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 pt-3 border-t">
                      <p>작성일: {formatDate(review.createdAt)}</p>
                      {review.updatedAt !== review.createdAt && (
                        <p>수정일: {formatDate(review.updatedAt)}</p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/reviews/${review.id}/edit`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/reviews/${review.id}`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세보기
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReview(review.id);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}