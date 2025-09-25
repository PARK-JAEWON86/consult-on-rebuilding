'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import {
  Calendar,
  Clock,
  FileText,
  Star,
  User,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { convertIdToConsultationNumber } from '@/utils/consultationNumber';

interface ConsultationDetail {
  id: number;
  consultationNumber?: string; // 바코드 형식 상담번호
  sessionId: string;
  reservationId: number;
  expertId: number;
  expertName: string;
  userId: number;
  startAt: string;
  endAt: string;
  duration: number;
  status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  cost: number;
  specialty: string;
  topic: string;
  note?: string;

  summary?: {
    keyPoints: string[];
    recommendations: string[];
    followUpActions: string[];
    tags: string[];
  };

  review?: {
    rating: number;
    comment: string;
  };
}

export default function ConsultationDetailPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;

  const { data: consultationData, isLoading, error } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: async () => {
      // 실제 API 호출 대신 임시 데이터 반환
      const dummyData: ConsultationDetail = {
        id: Number(consultationId),
        consultationNumber: convertIdToConsultationNumber(Number(consultationId), '2025-09-18T10:00:00Z', '심리상담'),
        sessionId: 'session-001',
        reservationId: 101,
        expertId: 1,
        expertName: '김전문가',
        userId: Number(user?.id) || 1,
        startAt: '2025-09-18T10:00:00Z',
        endAt: '2025-09-18T11:00:00Z',
        duration: 60,
        status: 'COMPLETED',
        cost: 500,
        specialty: '심리상담',
        topic: '스트레스 관리 상담',
        note: '스트레스 관리 상담',
        summary: {
          keyPoints: [
            '현재 업무 스트레스가 주요 문제',
            '수면 패턴 불규칙성 확인',
            '운동 부족이 스트레스 증가 요인'
          ],
          recommendations: [
            '주 3회 이상 규칙적인 운동',
            '명상 및 호흡법 연습',
            '업무와 휴식의 경계 설정'
          ],
          followUpActions: [
            '2주 후 재상담 예약',
            '운동 일지 작성',
            '수면 패턴 기록'
          ],
          tags: ['스트레스', '수면', '운동', '업무']
        },
        review: {
          rating: 5,
          comment: '매우 도움이 되었습니다. 구체적인 해결책을 제시해주셔서 감사합니다.'
        }
      };
      return { data: dummyData };
    },
    enabled: !!consultationId && !!user?.id && isAuthenticated,
  });

  const consultation: ConsultationDetail | undefined = consultationData?.data;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/consultations');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">상담 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">상담을 찾을 수 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            요청하신 상담 정보가 존재하지 않습니다.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            상담 내역으로 돌아가기
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">상담 상세 내역</h1>
        <div className="flex items-center gap-4">
          <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded border">
            {consultation.consultationNumber || `#${consultation.id}`}
          </div>
          <p className="text-gray-600">
            {formatDate(consultation.startAt)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">상담 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">상담번호</label>
                <div className="font-mono text-xs bg-blue-50 px-3 py-2 rounded border border-blue-200 text-blue-800">
                  {consultation.consultationNumber || `#${consultation.id}`}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">전문가</label>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">{consultation.expertName}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">상담 분야</label>
                <p className="text-sm text-gray-900">{consultation.specialty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">상담 주제</label>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{consultation.topic}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">상담 일시</label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {formatDate(consultation.startAt)} {formatTime(consultation.startAt)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">소요 시간</label>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{consultation.duration}분</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">사용한 크레딧</label>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">{consultation.cost.toLocaleString()} 크레딧</span>
                </div>
              </div>
            </div>
          </div>
          {consultation.note && (
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">상담 내용</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">{consultation.note}</p>
            </div>
          )}
        </div>

        {/* 상담 요약 */}
        {consultation.summary && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">상담 요약</h3>

            <div className="space-y-6">
              {/* 주요 포인트 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">주요 포인트</h4>
                <ul className="space-y-2">
                  {consultation.summary.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-3 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 추천사항 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">추천사항</h4>
                <ul className="space-y-2">
                  {consultation.summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-3 mt-1">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 후속 조치 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">후속 조치</h4>
                <ul className="space-y-2">
                  {consultation.summary.followUpActions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-orange-500 mr-3 mt-1">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 태그 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">관련 키워드</h4>
                <div className="flex flex-wrap gap-2">
                  {consultation.summary.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 리뷰 */}
        {consultation.review && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">내 리뷰</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= consultation.review!.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {consultation.review.rating}/5
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{consultation.review.comment}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}