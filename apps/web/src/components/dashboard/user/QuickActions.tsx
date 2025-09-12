"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  CreditCard, 
  Search, 
  Settings, 
  Star,
  MessageCircle,
  BookOpen,
  HelpCircle
} from "lucide-react";

interface QuickActionsProps {
  onBookConsultation: () => void;
  onPurchaseCredits: () => void;
  onFindExpert: () => void;
  onViewReviews: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

export const QuickActions = ({
  onBookConsultation,
  onPurchaseCredits,
  onFindExpert,
  onViewReviews,
  onSettings,
  onHelp
}: QuickActionsProps) => {
  const actions = [
    {
      id: 'book',
      title: '상담 예약',
      description: '전문가와 상담을 예약하세요',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: onBookConsultation
    },
    {
      id: 'credits',
      title: '크레딧 충전',
      description: '상담에 필요한 크레딧을 구매하세요',
      icon: CreditCard,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: onPurchaseCredits
    },
    {
      id: 'find',
      title: '전문가 찾기',
      description: '나에게 맞는 전문가를 찾아보세요',
      icon: Search,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: onFindExpert
    },
    {
      id: 'reviews',
      title: '리뷰 작성',
      description: '완료된 상담에 리뷰를 남기세요',
      icon: Star,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      onClick: onViewReviews
    },
    {
      id: 'settings',
      title: '설정',
      description: '계정 및 알림 설정을 관리하세요',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600',
      onClick: onSettings
    },
    {
      id: 'help',
      title: '도움말',
      description: '서비스 이용 방법을 확인하세요',
      icon: HelpCircle,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: onHelp
    }
  ];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">빠른 액션</h2>
        <p className="text-sm text-gray-600 mt-1">
          자주 사용하는 기능에 빠르게 접근하세요
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors"
            >
              <div className={`p-3 rounded-lg text-white ${action.color} transition-colors`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </Button>
          );
        })}
      </div>

      {/* 추가 정보 섹션 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">도움이 필요하신가요?</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageCircle className="h-4 w-4" />
            <span>고객지원 채팅</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>이용 가이드</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
