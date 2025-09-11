'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchExperts, Expert } from '@/lib/experts';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import RatingStars from '@/components/ui/RatingStars';
import Skeleton from '@/components/ui/Skeleton';
import UserReviewsSection from './UserReviewsSection';

/**
 * 홈페이지 메인 컴포넌트
 * - 히어로 섹션: 메인 타이틀과 CTA 버튼
 * - 신뢰 3요소: 실명검증, 투명한 후기, 안전한 결제
 * - 평점 상위 전문가: 상위 3명의 전문가 카드
 * - 사용자 후기: 실제 리뷰 섹션
 */
export default function HomePage() {
  const { data: expertsData, isLoading } = useQuery({
    queryKey: ['experts', { size: 3, sort: 'rating' }],
    queryFn: () => fetchExperts({ size: 3, sort: 'rating' }),
  });

  const topExperts = expertsData?.data?.items || [];

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="w-full py-32 md:py-40 lg:py-48 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full px-6 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            전문가와 함께 성장하는<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">온디맨드 상담</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-20 md:mb-24 leading-relaxed">
            다양한 전문가들과 1:1 상담을 통해 당신의 고민을 해결하고 목표를 달성해 보세요
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/experts">
              <Button size="lg" className="px-12 py-4 text-lg" aria-label="전문가 찾기">
                전문가 찾기
              </Button>
            </Link>
            <Link href="/credits">
              <Button variant="ghost" size="lg" className="px-12 py-4 text-lg border-2" aria-label="크레딧 충전">
                크레딧 충전
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 신뢰 3요소 */}
      <section className="w-full py-24 md:py-32 bg-white">
        <div className="w-full px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">실명 검증</h3>
              <p className="text-gray-600 text-lg leading-relaxed">모든 전문가의 신원과 자격을 철저히 검증하여 안전한 상담 환경을 제공합니다.</p>
            </Card>

            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">투명한 후기</h3>
              <p className="text-gray-600 text-lg leading-relaxed">실제 이용자들의 솔직한 후기와 평점을 통해 신뢰할 수 있는 선택을 도와드립니다.</p>
            </Card>

            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">안전한 결제</h3>
              <p className="text-gray-600 text-lg leading-relaxed">암호화된 결제 시스템과 에스크로 서비스로 안전하고 투명한 거래를 보장합니다.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 최근 평점 상위 전문가 */}
      <section className="w-full py-24 md:py-32 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="w-full px-6">
          <div className="text-center mb-20 md:mb-24 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">평점 상위 전문가</h2>
            <p className="text-xl text-gray-600 leading-relaxed">검증된 전문가들과 함께 문제를 해결해보세요</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="text-center p-8 border-0 shadow-lg">
                  <Skeleton variant="circular" width={96} height={96} className="mx-auto mb-6" />
                  <Skeleton height={28} className="mb-3" />
                  <Skeleton height={20} className="mb-4" />
                  <Skeleton height={16} className="mb-2" />
                  <Skeleton height={16} />
                </Card>
              ))}
            </div>
          ) : topExperts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {topExperts.map((expert: Expert) => (
                <Card key={expert.id} hover className="text-center p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                    {expert.avatarUrl ? (
                      <img 
                        src={expert.avatarUrl} 
                        alt={expert.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-500 font-bold">
                        {expert.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{expert.name}</h3>
                  {expert.title && (
                    <p className="text-gray-600 text-lg mb-4">{expert.title}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {expert.categories.map((category) => (
                      <Badge key={category} variant="primary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <div className="mb-4">
                    <RatingStars 
                      rating={expert.ratingAvg} 
                      count={expert.reviewCount}
                      size="sm"
                    />
                  </div>
                  {expert.bio && (
                    <p className="text-gray-600 text-base mt-4 line-clamp-2 leading-relaxed">{expert.bio}</p>
                  )}
                  <Link href={`/experts/${expert.displayId}`} className="block mt-6">
                    <Button variant="ghost" size="sm" className="w-full py-3 text-lg border-2 hover:bg-blue-50">
                      상세보기
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card className="text-center py-16 border-0 shadow-lg">
                <p className="text-gray-500 text-xl">전문가 정보를 불러오는 중입니다.</p>
              </Card>
            </div>
          )}

          <div className="text-center mt-20 md:mt-24">
            <Link href="/experts">
              <Button variant="ghost" className="px-12 py-4 text-lg border-2 hover:bg-white">
                모든 전문가 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <UserReviewsSection limit={12} />
    </main>
  );
}
