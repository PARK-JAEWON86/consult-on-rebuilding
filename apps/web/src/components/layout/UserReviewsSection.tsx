"use client";

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Quote } from 'lucide-react';
import { getReviews } from '@/lib/reviews';

interface Review {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  reservationId: number;
  rating: number;
  content: string;
  isPublic: boolean;
  createdAt: string;
}

type Props = {
  limit?: number;
  title?: string;
  description?: string;
};

export default function UserReviewsSection({
  limit = 12,
  title = '사용자들의 생생한 후기',
  description = '실제로 상담을 받은 사용자들의 솔직한 리뷰를 확인해보세요',
}: Props) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['publicReviews', limit],
    queryFn: async () => {
      const result = await getReviews({ isPublic: true, limit });
      const reviews: Review[] = result.reviews ?? [];
      return reviews.slice(0, Math.max(0, Math.min(12, limit)));
    },
    staleTime: 30_000,
  });

  const reviews = data ?? [];
  const top = useMemo(() => reviews.slice(0, 6), [reviews]);
  const bottom = useMemo(() => reviews.slice(6, 12), [reviews]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        aria-hidden="true"
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));

  // Skeleton
  if (isLoading) {
    return (
      <section className="w-full py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full px-6 text-center mb-16">
          <h2 id="reviews-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">{description}</p>
        </div>
        <div className="space-y-8">
          {/* First row skeleton */}
          <div className="flex gap-6 justify-center overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 w-[340px] rounded-2xl bg-white shadow-sm animate-pulse flex-shrink-0" />
            ))}
          </div>
          {/* Second row skeleton */}
          <div className="flex gap-6 justify-center overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 w-[340px] rounded-2xl bg-white shadow-sm animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error
  if (isError) {
    return (
      <section className="w-full py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full px-6 text-center mb-12">
          <h2 id="reviews-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">{description}</p>
        </div>
        <div className="text-center text-gray-500">
          리뷰를 불러오는 중 문제가 발생했습니다.
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['publicReviews'] })}
            className="ml-3 inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="리뷰 다시 시도"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  // Empty
  if (reviews.length === 0) {
    return (
      <section className="w-full py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full px-6 text-center mb-12">
          <h2 id="reviews-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">{description}</p>
        </div>
        <div className="text-center text-gray-500">아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!</div>
      </section>
    );
  }

  const maskUserId = (userId: number) => {
    const userStr = `사용자${userId}`;
    if (userStr.length <= 2) {
      return userStr.charAt(0) + '*';
    }
    return userStr.charAt(0) + '*'.repeat(userStr.length - 2) + userStr.charAt(userStr.length - 1);
  };

  const Card = ({ r, tone = 'blue' as 'blue' | 'emerald' }: { r: Review; tone?: 'blue' | 'emerald' }) => (
    <div className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-lg">
          {maskUserId(r.userId)}
        </h4>
        <div className={`w-1.5 h-1.5 ${tone === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'} rounded-full`} />
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            tone === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'
          }`}
        >
          전문가 {r.expertId}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        {renderStars(r.rating)}
        <span className="text-sm font-semibold text-gray-700 ml-2">{r.rating}.0</span>
      </div>
      <div className="relative mb-4">
        <Quote aria-hidden="true" className={`absolute -top-1 left-0 w-5 h-5 ${tone === 'blue' ? 'text-blue-300' : 'text-emerald-300'}`} />
        <p className="text-gray-600 leading-relaxed pl-6 text-sm line-clamp-3 font-medium">{r.content}</p>
      </div>
      <div className="text-xs text-gray-400 font-medium text-right">
        {new Date(r.createdAt).toLocaleDateString('ko-KR')}
      </div>
    </div>
  );

  return (
    <section className="w-full py-20 bg-gradient-to-br from-blue-50 to-indigo-100" aria-labelledby="reviews-title">
      <div className="w-full px-6">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 id="reviews-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{title}</h2>
          <p className="text-xl text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* First row - slides left */}
        <div className="mb-8 overflow-hidden">
          <div
            className="flex gap-6 w-max motion-reduce:animate-none animate-scroll-left"
            style={{ animationDuration: '60s' }}
          >
            {top.map((r) => <Card key={r.id} r={r} tone="blue" />)}
            {top.map((r) => <Card key={`dup-${r.id}`} r={r} tone="blue" />)}
          </div>
        </div>

        {/* Second row - slides right */}
        <div className="overflow-hidden">
          <div
            className="flex gap-6 w-max motion-reduce:animate-none animate-scroll-right"
            style={{ animationDuration: '50s' }}
          >
            {bottom.map((r) => <Card key={r.id} r={r} tone="emerald" />)}
            {bottom.map((r) => <Card key={`dup-${r.id}`} r={r} tone="emerald" />)}
          </div>
        </div>
      </div>
    </section>
  );
}
