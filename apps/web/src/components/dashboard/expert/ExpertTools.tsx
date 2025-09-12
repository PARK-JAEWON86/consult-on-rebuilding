"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  FileText,
  MessageCircle,
  Video,
  Clock,
  Award,
  Target,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface ExpertTool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}

interface ExpertToolsProps {
  onToolClick?: (toolId: string) => void;
}

export const ExpertTools = ({ onToolClick }: ExpertToolsProps) => {
  const tools: ExpertTool[] = [
    {
      id: 'schedule',
      title: '일정 관리',
      description: '상담 일정을 관리하고 조정하세요',
      icon: <Calendar className="h-6 w-6" />,
      href: '/expert/schedule'
    },
    {
      id: 'clients',
      title: '고객 관리',
      description: '고객 정보와 상담 기록을 확인하세요',
      icon: <Users className="h-6 w-6" />,
      href: '/expert/clients'
    },
    {
      id: 'analytics',
      title: '수익 분석',
      description: '수익 현황과 통계를 분석하세요',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/expert/analytics'
    },
    {
      id: 'profile',
      title: '프로필 설정',
      description: '전문가 프로필을 수정하세요',
      icon: <Settings className="h-6 w-6" />,
      href: '/expert/profile'
    },
    {
      id: 'reports',
      title: '상담 보고서',
      description: '상담 일지와 보고서를 작성하세요',
      icon: <FileText className="h-6 w-6" />,
      href: '/expert/reports'
    },
    {
      id: 'availability',
      title: '상담 가능 시간',
      description: '상담 가능한 시간을 설정하세요',
      icon: <Clock className="h-6 w-6" />,
      href: '/expert/availability'
    },
    {
      id: 'achievements',
      title: '성과 관리',
      description: '목표와 성과를 추적하세요',
      icon: <Award className="h-6 w-6" />,
      href: '/expert/achievements'
    },
    {
      id: 'goals',
      title: '목표 설정',
      description: '월간/주간 목표를 설정하세요',
      icon: <Target className="h-6 w-6" />,
      href: '/expert/goals'
    }
  ];

  const handleToolClick = (tool: ExpertTool) => {
    if (tool.disabled) return;
    
    if (onToolClick) {
      onToolClick(tool.id);
    } else if (tool.href) {
      window.location.href = tool.href;
    } else if (tool.onClick) {
      tool.onClick();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">전문가 도구</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          <span>빠른 접근</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="outline"
            className={`h-24 flex-col p-4 transition-all duration-200 ${
              tool.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
            }`}
            onClick={() => handleToolClick(tool)}
            disabled={tool.disabled}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`${tool.disabled ? 'text-gray-400' : 'text-blue-600'}`}>
                {tool.icon}
              </div>
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-900">
                    {tool.title}
                  </span>
                  {tool.badge && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-tight">
                  {tool.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">12</div>
            <div className="text-xs text-blue-600">이번 주 상담</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">4.8</div>
            <div className="text-xs text-green-600">평균 평점</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">95%</div>
            <div className="text-xs text-purple-600">출석률</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
