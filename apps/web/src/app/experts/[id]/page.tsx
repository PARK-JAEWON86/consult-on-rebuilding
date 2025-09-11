'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { fetchExpertById } from '@/lib/experts';
import { createReservation } from '@/features/reservations/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import RatingStars from '@/components/ui/RatingStars';
import Skeleton from '@/components/ui/Skeleton';

export default function ExpertDetailPage() {
  const params = useParams();
  const displayId = params.id as string;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationData, setReservationData] = useState({
    startAt: '',
    endAt: '',
    note: '',
  });

  const { data: expert, isLoading, error } = useQuery({
    queryKey: ['expert', displayId],
    queryFn: () => fetchExpertById(displayId),
    enabled: !!displayId,
  });

  const createReservationMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      showToast('success', '예약이 성공적으로 생성되었습니다.');
      setIsReservationModalOpen(false);
      setReservationData({ startAt: '', endAt: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (error: any) => {
      if (error.message?.includes('409') || error.message?.includes('conflict')) {
        showToast('warn', '해당 시간대는 이미 예약되었습니다. 다른 시간을 선택해주세요.');
      } else {
        showToast('error', '예약 생성에 실패했습니다. 다시 시도해주세요.');
      }
    },
  });

  const handleReservation = () => {
    if (!reservationData.startAt || !reservationData.endAt) {
      showToast('warn', '예약 시간을 입력해주세요.');
      return;
    }

    // 임시 userId (실제로는 인증 상태에서 가져와야 함)
    const userId = 1;

    createReservationMutation.mutate({
      userId,
      expertId: expertData.id || 0,
      startAt: reservationData.startAt,
      endAt: reservationData.endAt,
      note: reservationData.note || undefined,
    });
  };

  if (isLoading) {
    return (
      <main className="max-w-screen-lg mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 프로필 스켈레톤 */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-start space-x-6 mb-6">
                <Skeleton variant="circular" width={100} height={100} />
                <div className="flex-1">
                  <Skeleton height={32} className="mb-2" />
                  <Skeleton height={20} className="mb-3" />
                  <Skeleton height={16} className="mb-4" />
                  <div className="flex space-x-2">
                    <Skeleton width={60} height={24} />
                    <Skeleton width={60} height={24} />
                  </div>
                </div>
              </div>
              <Skeleton height={100} />
            </Card>
          </div>

          {/* 예약 카드 스켈레톤 */}
          <div>
            <Card>
              <Skeleton height={200} />
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (error || !expert?.data) {
    return (
      <main className="max-w-screen-lg mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">전문가 정보를 불러올 수 없습니다</p>
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </Card>
      </main>
    );
  }

  const expertData = expert.data;

  return (
    <main className="max-w-screen-lg mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* 좌측: 프로필 카드 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start space-x-6 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {expertData.avatarUrl ? (
                  <img 
                    src={expertData.avatarUrl} 
                    alt={expertData.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {expertData.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {expertData.name}
                </h1>
                {expertData.title && (
                  <p className="text-xl text-gray-600 mb-3">{expertData.title}</p>
                )}
                <RatingStars 
                  rating={expertData.ratingAvg} 
                  count={expertData.reviewCount}
                  size="lg"
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  {expertData.categories.map((category) => (
                    <Badge key={category} variant="blue">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {expertData.bio && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">소개</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {expertData.bio}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 우측: 예약 카드 + 상담 가이드 */}
        <div className="space-y-6">
          {/* 예약 카드 */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">예약하기</h2>
            <Button 
              className="w-full mb-4"
              onClick={() => setIsReservationModalOpen(true)}
            >
              상담 예약
            </Button>
            <p className="text-sm text-gray-600">
              전문가와 1:1 상담을 통해 궁금한 점을 해결해보세요
            </p>
          </Card>

          {/* 상담 가이드 */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">상담 가이드</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">실명 인증</h3>
                  <p className="text-sm text-gray-600">모든 전문가는 실명과 자격을 검증받았습니다</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">보안 상담</h3>
                  <p className="text-sm text-gray-600">암호화된 화상 통화로 안전하게 상담합니다</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">안전 결제</h3>
                  <p className="text-sm text-gray-600">상담 완료 후 결제가 처리됩니다</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 예약 모달 */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">상담 예약</h3>
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <input
                  type="datetime-local"
                  value={reservationData.startAt}
                  onChange={(e) => setReservationData(prev => ({ ...prev, startAt: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간
                </label>
                <input
                  type="datetime-local"
                  value={reservationData.endAt}
                  onChange={(e) => setReservationData(prev => ({ ...prev, endAt: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 내용 (선택사항)
                </label>
                <textarea
                  value={reservationData.note}
                  onChange={(e) => setReservationData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="상담받고 싶은 내용을 간단히 적어주세요"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsReservationModalOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleReservation}
                loading={createReservationMutation.isPending}
                className="flex-1"
              >
                예약하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}