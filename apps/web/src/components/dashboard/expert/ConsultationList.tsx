"use client";

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, Video, MessageCircle, Eye } from 'lucide-react';

interface Consultation {
  id: string;
  clientName: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'chat' | 'voice';
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  specialty: string;
  rating?: number;
  notes?: string;
}

interface ConsultationListProps {
  consultations: Consultation[];
  selectedDate?: Date | null;
  onConsultationClick?: (consultation: Consultation) => void;
}

export const ConsultationList = ({
  consultations,
  selectedDate,
  onConsultationClick
}: ConsultationListProps) => {
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getConsultationsByDate = (date: Date) => {
    const dateStr = formatDate(date);
    return consultations.filter(
      (consultation) => consultation.date === dateStr,
    );
  };

  const displayConsultations = selectedDate 
    ? getConsultationsByDate(selectedDate)
    : consultations.slice(0, 5);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '예정';
      case 'pending':
        return '대기중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-purple-600" />;
      case 'chat':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'voice':
        return <MessageCircle className="h-5 w-5 text-green-600" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  if (displayConsultations.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          {selectedDate ? '해당 날짜에 예약된 상담이 없습니다.' : '예약된 상담이 없습니다.'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {selectedDate ? '다른 날짜를 선택해보세요.' : '새로운 상담을 받아보세요.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {displayConsultations.map((consultation) => (
        <div
          key={consultation.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onConsultationClick && onConsultationClick(consultation)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getTypeIcon(consultation.type)}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {consultation.clientName}
                </h4>
                <p className="text-xs text-gray-500">
                  {consultation.specialty}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {consultation.date} {consultation.time}
                  <span className="ml-2">({consultation.duration}분)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge
                variant={getStatusVariant(consultation.status)}
                className="text-xs"
              >
                {getStatusText(consultation.status)}
              </Badge>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onConsultationClick && onConsultationClick(consultation);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                상세보기
              </Button>
            </div>
          </div>
          
          {consultation.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <strong>메모:</strong> {consultation.notes}
            </div>
          )}
          
          {consultation.rating && (
            <div className="mt-2 flex items-center space-x-1">
              <span className="text-xs text-gray-500">평점:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < consultation.rating! ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
