import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const DashboardExpertView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">전문가 대시보드</h1>
        <p className="text-gray-600">상담 일정과 수익을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 오늘 일정 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">오늘 일정</h2>
            <Badge variant="secondary">3건</Badge>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-green-900">14:00 - 15:00</p>
                  <p className="text-xs text-green-700">김○○님 상담</p>
                </div>
                <Badge size="sm" className="bg-green-100 text-green-800">
                  예정
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-900">16:00 - 17:00</p>
                  <p className="text-xs text-blue-700">이○○님 상담</p>
                </div>
                <Badge size="sm" className="bg-blue-100 text-blue-800">
                  대기중
                </Badge>
              </div>
            </div>
            <div className="text-center py-2">
              <Button size="sm" variant="outline">
                전체 일정 보기
              </Button>
            </div>
          </div>
        </Card>

        {/* 예약 요청 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">예약 요청</h2>
            <Badge variant="destructive">2건</Badge>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-orange-900">박○○님</p>
                <Badge size="sm" className="bg-orange-100 text-orange-800">
                  신규
                </Badge>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                내일 오후 2시 상담 요청
              </p>
              <div className="flex gap-2">
                <Button size="xs" className="bg-green-600 hover:bg-green-700">
                  승인
                </Button>
                <Button size="xs" variant="outline">
                  거절
                </Button>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-yellow-900">최○○님</p>
                <Badge size="sm" className="bg-yellow-100 text-yellow-800">
                  재예약
                </Badge>
              </div>
              <p className="text-xs text-yellow-700 mb-2">
                다음주 화요일 상담 요청
              </p>
              <div className="flex gap-2">
                <Button size="xs" className="bg-green-600 hover:bg-green-700">
                  승인
                </Button>
                <Button size="xs" variant="outline">
                  거절
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 정산 카드 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">정산 현황</h2>
            <Button variant="ghost" size="sm">
              상세보기
            </Button>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">₩847,500</div>
            <p className="text-sm text-gray-500">이번 달 수익</p>
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>완료된 상담</span>
                <span>23건</span>
              </div>
              <div className="flex justify-between">
                <span>평균 상담료</span>
                <span>₩36,850</span>
              </div>
              <div className="flex justify-between">
                <span>정산 예정</span>
                <span>15일 후</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 추가 섹션들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">전문가 도구</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">📅</span>
              <span>일정 관리</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">👥</span>
              <span>고객 관리</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">📊</span>
              <span>수익 분석</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">⚙️</span>
              <span>프로필 설정</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 리뷰</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
                <span className="text-xs text-gray-500">김○○님 - 1일 전</span>
              </div>
              <p className="text-sm text-gray-700">
                "정말 전문적이고 친절한 상담이었습니다. 많은 도움이 되었어요!"
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(4)}{'☆'}
                </div>
                <span className="text-xs text-gray-500">이○○님 - 3일 전</span>
              </div>
              <p className="text-sm text-gray-700">
                "시간을 잘 지켜주시고 설명도 이해하기 쉬웠습니다."
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 성과 요약 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 성과</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">23</div>
            <p className="text-sm text-gray-500">완료된 상담</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">4.8</div>
            <p className="text-sm text-gray-500">평균 평점</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">95%</div>
            <p className="text-sm text-gray-500">출석률</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-sm text-gray-500">신규 고객</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
