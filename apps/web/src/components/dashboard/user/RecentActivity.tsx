"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Star, 
  MessageCircle,
  Video,
  Phone,
  Calendar,
  ChevronRight
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'consultation_completed' | 'consultation_scheduled' | 'credit_purchased' | 'review_written' | 'reservation_cancelled';
  title: string;
  description: string;
  timestamp: string;
  expertName?: string;
  reservationId?: number;
  credits?: number;
  rating?: number;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll: () => void;
}

const activityIcons = {
  consultation_completed: CheckCircle,
  consultation_scheduled: Calendar,
  credit_purchased: CreditCard,
  review_written: Star,
  reservation_cancelled: Clock
};

const activityColors = {
  consultation_completed: 'text-green-600 bg-green-100',
  consultation_scheduled: 'text-blue-600 bg-blue-100',
  credit_purchased: 'text-purple-600 bg-purple-100',
  review_written: 'text-yellow-600 bg-yellow-100',
  reservation_cancelled: 'text-red-600 bg-red-100'
};

const typeIcons = {
  VIDEO: Video,
  CHAT: MessageCircle,
  VOICE: Phone
};

export const RecentActivity = ({ activities, onViewAll }: RecentActivityProps) => {
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    const IconComponent = activityIcons[type as keyof typeof activityIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          최근 활동
        </h2>
        <Button onClick={onViewAll} variant="ghost" size="sm">
          전체보기
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const IconComponent = activityIcons[activity.type as keyof typeof activityIcons];
            const colorClass = activityColors[activity.type as keyof typeof activityColors];

            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>

                  {/* 추가 정보 */}
                  <div className="flex items-center space-x-2 mt-2">
                    {activity.expertName && (
                      <Badge variant="outline" size="sm">
                        {activity.expertName}
                      </Badge>
                    )}
                    
                    {activity.credits && (
                      <Badge variant="outline" size="sm">
                        {activity.credits.toLocaleString()} 크레딧
                      </Badge>
                    )}
                    
                    {activity.rating && (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < activity.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">최근 활동이 없습니다</p>
            <p className="text-sm text-gray-400">
              상담을 예약하거나 크레딧을 충전해보세요
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
