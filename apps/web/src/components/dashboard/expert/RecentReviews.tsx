"use client";

import { Card } from '@/components/ui/Card';
import { Star, User, Calendar } from 'lucide-react';

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  consultationId: string;
  consultationType?: 'video' | 'chat' | 'voice';
  specialty?: string;
}

interface RecentReviewsProps {
  reviews: Review[];
  onViewAll?: () => void;
  maxDisplay?: number;
}

export const RecentReviews = ({
  reviews,
  onViewAll,
  maxDisplay = 3
}: RecentReviewsProps) => {
  const displayReviews = reviews.slice(0, maxDisplay);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1일 전';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-yellow-600';
    if (rating >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'video':
        return '📹';
      case 'chat':
        return '💬';
      case 'voice':
        return '🎤';
      default:
        return '💬';
    }
  };

  if (displayReviews.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">아직 리뷰가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">
            첫 상담을 완료하고 리뷰를 받아보세요!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">최근 리뷰</h3>
        {reviews.length > maxDisplay && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            전체보기 ({reviews.length})
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {displayReviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {review.clientName}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                      {review.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(review.date)}</span>
                </div>
                {review.consultationType && (
                  <div className="text-xs text-gray-500">
                    {getTypeIcon(review.consultationType)} {review.specialty}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              "{review.comment}"
            </p>
          </div>
        ))}
      </div>
      
      {reviews.length > maxDisplay && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              총 {reviews.length}개의 리뷰가 있습니다
            </p>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                모든 리뷰 보기 →
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
