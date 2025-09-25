"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  ArrowLeft,
  Star,
  User,
  Calendar,
  Clock,
  MessageCircle,
  Video,
  Phone,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

interface ReviewDetail {
  id: number;
  reservationId: number;
  expertId: number;
  expertName: string;
  expertProfileImage?: string;
  consultationDate: string;
  consultationType: 'video' | 'voice' | 'chat';
  duration: number;
  topic: string;
  cost: number;
  rating: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/reviews');
      return;
    }

    const loadReview = async () => {
      try {
        const response = await fetch(`/api/reviews/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setReview(result.data);
        } else {
          alert('리뷰를 찾을 수 없습니다.');
          router.push('/dashboard/reviews');
        }
      } catch (error) {
        console.error('리뷰 로드 오류:', error);
        alert('리뷰를 불러오는 중 오류가 발생했습니다.');
        router.push('/dashboard/reviews');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadReview();
    }
  }, [params.id, isAuthenticated, router]);

  const handleDelete = async () => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/reviews/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('리뷰가 삭제되었습니다.');
        router.push('/dashboard/reviews');
      } else {
        alert('리뷰 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 삭제 오류:', error);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return '화상 상담';
      case 'voice':
        return '음성 상담';
      case 'chat':
        return '채팅 상담';
      default:
        return type;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">리뷰를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 상세</h1>
            <p className="text-gray-600">내가 작성한 리뷰를 확인하고 관리하세요.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/dashboard/reviews/${review.id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              수정
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 리뷰 정보 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {review.expertProfileImage ? (
              <img
                src={review.expertProfileImage}
                alt={review.expertName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {review.expertName} 전문가
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(review.consultationDate)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(review.consultationDate)} ({review.duration}분)
              </div>
              <div className="flex items-center">
                {getTypeIcon(review.consultationType)}
                <span className="ml-2">{getTypeLabel(review.consultationType)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">{review.cost.toLocaleString()} 크레딧</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">상담 주제:</span> {review.topic}
              </p>
            </div>
          </div>
        </div>

        {/* 공개 설정 표시 */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center">
            {review.isPublic ? (
              <Eye className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 mr-2 text-gray-400" />
            )}
            <span className={`text-sm font-medium ${
              review.isPublic ? 'text-green-800' : 'text-gray-600'
            }`}>
              {review.isPublic ? '공개 리뷰' : '비공개 리뷰'}
            </span>
          </div>
          {review.isAnonymous && (
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">익명 작성</span>
            </div>
          )}
        </div>
      </div>

      {/* 리뷰 내용 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">내 리뷰</h2>
            <div className="flex items-center space-x-2">
              {renderStars(review.rating)}
              <span className="text-lg font-medium text-gray-900">{review.rating}.0</span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3">{review.title}</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {review.content}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span className="font-medium">작성일:</span> {formatDateTime(review.createdAt)}
            </div>
            {review.updatedAt !== review.createdAt && (
              <div>
                <span className="font-medium">수정일:</span> {formatDateTime(review.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push(`/dashboard/reviews/${review.id}/edit`)}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            리뷰 수정
          </button>

          <button
            onClick={() => router.push('/dashboard/reviews')}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            리뷰 삭제
          </button>
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">리뷰 관리 안내</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 리뷰는 언제든지 수정하거나 삭제할 수 있습니다.</li>
          <li>• 공개 설정을 변경하여 다른 사용자들의 리뷰 노출을 조절할 수 있습니다.</li>
          <li>• 익명 설정을 통해 이름 노출 여부를 선택할 수 있습니다.</li>
          <li>• 리뷰는 다른 사용자들의 전문가 선택에 도움이 됩니다.</li>
        </ul>
      </div>
    </div>
  );
}