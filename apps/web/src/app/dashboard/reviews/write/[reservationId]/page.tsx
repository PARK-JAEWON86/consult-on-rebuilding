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
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ReservationDetail {
  id: number;
  expertId: number;
  expertName: string;
  expertProfileImage?: string;
  consultationDate: string;
  consultationType: 'video' | 'voice' | 'chat';
  duration: number;
  topic: string;
  cost: number;
}

export default function WriteReviewPage() {
  const params = useParams<{ reservationId: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 리뷰 폼 상태
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/reviews');
      return;
    }

    const loadReservation = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
        const response = await fetch(`${apiBaseUrl}/reservations?userId=${user?.id}`);
        if (!response.ok) {
          console.warn('예약 정보 조회 실패:', response.status);
          alert('예약 정보를 찾을 수 없습니다.');
          router.push('/dashboard/reviews');
          return;
        }
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const reservation = result.data.find((r: any) => r.id?.toString() === params.reservationId || r.displayId === params.reservationId);
          if (reservation) {
            setReservation(reservation);
          } else {
            alert('예약 정보를 찾을 수 없습니다.');
            router.push('/dashboard/reviews');
          }
        } else {
          alert('예약 정보를 찾을 수 없습니다.');
          router.push('/dashboard/reviews');
        }
      } catch (error) {
        console.error('예약 정보 로드 오류:', error);
        alert('예약 정보를 불러오는 중 오류가 발생했습니다.');
        router.push('/dashboard/reviews');
      } finally {
        setLoading(false);
      }
    };

    if (params.reservationId) {
      loadReservation();
    }
  }, [params.reservationId, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      alert('리뷰 제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiBaseUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: Number(params.reservationId),
          expertId: reservation?.expertId,
          rating,
          title: title.trim(),
          content: content.trim(),
          isAnonymous,
          isPublic,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('리뷰가 성공적으로 작성되었습니다.');
        router.push('/dashboard/reviews');
      } else {
        alert(result.error || '리뷰 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 작성 오류:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">예약 정보를 찾을 수 없습니다.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 작성</h1>
        <p className="text-gray-600">상담에 대한 솔직한 후기를 남겨주세요.</p>
      </div>

      {/* 상담 정보 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 정보</h2>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {reservation.expertProfileImage ? (
              <img
                src={reservation.expertProfileImage}
                alt={reservation.expertName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {reservation.expertName} 전문가
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(reservation.consultationDate)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(reservation.consultationDate)} ({reservation.duration}분)
              </div>
              <div className="flex items-center">
                {getTypeIcon(reservation.consultationType)}
                <span className="ml-2">{getTypeLabel(reservation.consultationType)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">{reservation.cost.toLocaleString()} 크레딧</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">상담 주제:</span> {reservation.topic}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 리뷰 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 별점 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">평점</h2>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-lg font-medium text-gray-700 ml-3">
              {rating > 0 && `${rating}.0`}
            </span>
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 && '매우 만족'}
              {rating === 4 && '만족'}
              {rating === 3 && '보통'}
              {rating === 2 && '불만족'}
              {rating === 1 && '매우 불만족'}
            </p>
          )}
        </div>

        {/* 리뷰 제목 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label htmlFor="title" className="block text-lg font-semibold text-gray-900 mb-4">
            리뷰 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="리뷰 제목을 입력해주세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-sm text-gray-500 mt-2">{title.length}/100</p>
        </div>

        {/* 리뷰 내용 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label htmlFor="content" className="block text-lg font-semibold text-gray-900 mb-4">
            리뷰 내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상담에 대한 솔직한 후기를 작성해주세요. 다른 이용자들에게 도움이 되는 구체적인 내용을 포함해주시면 좋습니다."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-2">{content.length}/1000</p>
        </div>

        {/* 공개 설정 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">공개 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-3 flex items-center">
                  {isPublic ? (
                    <Eye className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    리뷰 공개
                  </span>
                </label>
              </div>
              <span className="text-sm text-gray-500">
                {isPublic ? '다른 사용자들이 볼 수 있습니다' : '나만 볼 수 있습니다'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!isPublic}
                />
                <label htmlFor="isAnonymous" className="ml-3">
                  <span className={`text-sm font-medium ${
                    isPublic ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    익명으로 작성
                  </span>
                </label>
              </div>
              <span className="text-sm text-gray-500">
                {isAnonymous ? '이름이 표시되지 않습니다' : '이름이 표시됩니다'}
              </span>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? '작성 중...' : '리뷰 작성'}
          </button>
        </div>
      </form>
    </div>
  );
}