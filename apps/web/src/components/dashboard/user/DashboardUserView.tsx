import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const DashboardUserView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 대시보드</h1>
        <p className="text-gray-600">예약 현황과 크레딧을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 내 예약 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">내 예약</h2>
            <Button variant="ghost" size="sm">
              전체보기
            </Button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">예정된 상담</p>
              <p className="text-xs text-blue-700">오늘 오후 3시 - 김전문가</p>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">다음 예약이 없습니다</p>
              <Button size="sm" className="mt-2">
                상담 예약하기
              </Button>
            </div>
          </div>
        </Card>

        {/* 크레딧 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">크레딧</h2>
            <Button variant="ghost" size="sm">
              충전하기
            </Button>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">1,250</div>
            <p className="text-sm text-gray-500">사용 가능한 크레딧</p>
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>이번 달 사용</span>
                <span>750 크레딧</span>
              </div>
              <div className="flex justify-between">
                <span>만료 예정</span>
                <span>30일 후</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 최근 리뷰 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 리뷰</h2>
            <Button variant="ghost" size="sm">
              전체보기
            </Button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
                <span className="text-xs text-gray-500">2일 전</span>
              </div>
              <p className="text-sm text-gray-700">정말 도움이 되는 상담이었습니다...</p>
              <p className="text-xs text-gray-500 mt-1">박전문가</p>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">작성할 리뷰가 없습니다</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 추가 섹션들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">📅</span>
              <span>예약하기</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">💳</span>
              <span>크레딧 충전</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">📊</span>
              <span>이용 내역</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-2xl mb-1">⚙️</span>
              <span>설정</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">상담 완료</p>
                <p className="text-xs text-gray-500">김전문가 - 2시간 전</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">크레딧 충전</p>
                <p className="text-xs text-gray-500">1,000 크레딧 - 1일 전</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">예약 생성</p>
                <p className="text-xs text-gray-500">이전문가 - 3일 전</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
