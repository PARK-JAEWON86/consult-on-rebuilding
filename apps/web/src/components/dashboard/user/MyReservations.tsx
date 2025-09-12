"use client";

import { useState } from "react";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  Clock, 
  Video, 
  MessageCircle, 
  Phone, 
  MapPin,
  Star,
  ChevronRight
} from "lucide-react";
import { Reservation } from '@/lib/reservations';

interface MyReservationsProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onBookNew: () => void;
}

const typeIcons = {
  VIDEO: Video,
  CHAT: MessageCircle,
  VOICE: Phone
};

const typeLabels = {
  VIDEO: '화상상담',
  CHAT: '채팅상담',
  VOICE: '음성상담'
};

const statusLabels = {
  SCHEDULED: '예정',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

const statusColors = {
  SCHEDULED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'gray'
} as const;

export const MyReservations = ({ 
  reservations, 
  onReservationClick, 
  onBookNew 
}: MyReservationsProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const upcomingReservations = reservations.filter(r => r.status === 'SCHEDULED');
  const completedReservations = reservations.filter(r => r.status === 'COMPLETED');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          내 상담 예약
        </h2>
        <Button onClick={onBookNew} size="sm">
          새 예약하기
        </Button>
      </div>

      {/* 예정된 상담 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">다가오는 상담</h3>
        {upcomingReservations.length > 0 ? (
          <div className="space-y-3">
            {upcomingReservations.slice(0, 3).map((reservation) => {
              const TypeIcon = typeIcons[reservation.type];
              const { date, time } = formatDateTime(reservation.startAt);
              
              return (
                <div
                  key={reservation.id}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => onReservationClick(reservation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <TypeIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {reservation.expertName}
                          </h4>
                          <Badge 
                            variant={statusColors[reservation.status] as any}
                            size="sm"
                          >
                            {statusLabels[reservation.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{reservation.specialty}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </span>
                          <span>{typeLabels[reservation.type]}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">예정된 상담이 없습니다</p>
            <Button onClick={onBookNew} variant="outline" size="sm">
              첫 상담 예약하기
            </Button>
          </div>
        )}
      </div>

      {/* 최근 완료된 상담 */}
      {completedReservations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 상담</h3>
          <div className="space-y-3">
            {completedReservations.slice(0, 2).map((reservation) => {
              const TypeIcon = typeIcons[reservation.type];
              const { date, time } = formatDateTime(reservation.startAt);
              
              return (
                <div
                  key={reservation.id}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onReservationClick(reservation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TypeIcon className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {reservation.expertName}
                          </h4>
                          <Badge variant="gray" size="sm">
                            완료
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{date} {time}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
