'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchExperts, Expert } from '@/lib/experts';
import { useCategoriesPublic } from '@/hooks/useCategories';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import RatingStars from '@/components/ui/RatingStars';
import Skeleton from '@/components/ui/Skeleton';
import CategorySelect from '@/components/categories/CategorySelect';

export default function ExpertsPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  
  const { data: categories = [] } = useCategoriesPublic();

  const { data, isLoading, error } = useQuery({
    queryKey: ['experts', { q, category, sort, page }],
    queryFn: () => fetchExperts({ 
      q: q || undefined, 
      category: category || undefined, 
      sort, 
      page, 
      size: 12 
    }),
  });

  const handleReset = () => {
    setQ('');
    setCategory('');
    setSort('rating');
    setPage(1);
  };

  const experts = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const size = data?.data?.size || 12;
  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <main className="max-w-screen-lg mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">전문가 찾기</h1>
        <p className="text-gray-600">다양한 분야의 검증된 전문가들을 만나보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-8">
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색어
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="전문가 이름, 직함, 소개글 검색"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <CategorySelect
                value={category}
                onChange={(value) => { setPage(1); setCategory(Array.isArray(value) ? value[0] || '' : value); }}
                multiple={false}
                placeholder="전체"
                showSearch={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬
              </label>
              <select
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">평점순</option>
                <option value="latest">최신순</option>
                <option value="popular">추천순</option>
              </select>
            </div>
          </div>

          {/* 초기화 버튼 */}
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </div>
      </Card>

      {/* 결과 */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <div className="flex items-start space-x-4">
                <Skeleton variant="circular" width={56} height={56} />
                <div className="flex-1">
                  <Skeleton height={20} className="mb-2" />
                  <Skeleton height={16} className="mb-2" />
                  <Skeleton height={16} className="mb-3" />
                  <div className="flex space-x-1">
                    <Skeleton width={40} height={20} />
                    <Skeleton width={40} height={20} />
                  </div>
                </div>
              </div>
              <Skeleton height={40} className="mt-4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">데이터를 불러올 수 없습니다</p>
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </Card>
      ) : experts.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>검색 조건에 맞는 전문가가 없습니다</p>
          </div>
          <Button variant="ghost" onClick={handleReset}>
            검색 조건 초기화
          </Button>
        </Card>
      ) : (
        <>
          {/* 검색 결과 수 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{total}</span>명의 전문가
            </p>
          </div>

          {/* 전문가 카드 그리드 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {experts.map((expert: Expert) => (
              <Card key={expert.displayId} hover className="h-full">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {expert.avatarUrl ? (
                      <img 
                        src={expert.avatarUrl} 
                        alt={expert.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg text-gray-500">
                        {expert.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {expert.name}
                    </h3>
                    {expert.title && (
                      <p className="text-sm text-gray-600 truncate">{expert.title}</p>
                    )}
                    <RatingStars 
                      rating={expert.ratingAvg} 
                      count={expert.reviewCount}
                      size="sm"
                    />
                  </div>
                </div>

                {/* 카테고리 배지 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {expert.categories.map((cat) => (
                    <Badge key={cat} variant="blue">
                      {cat}
                    </Badge>
                  ))}
                </div>

                {/* 소개 */}
                {expert.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {expert.bio}
                  </p>
                )}

                {/* 상세보기 버튼 */}
                <Link href={`/experts/${expert.displayId}`} className="block">
                  <Button variant="ghost" className="w-full">
                    상세보기
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                이전
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}