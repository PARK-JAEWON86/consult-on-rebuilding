"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Clock, User, Calendar } from 'lucide-react';

interface ReservationRequest {
  id: string;
  clientName: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'chat' | 'voice';
  specialty: string;
  message?: string;
  isNew: boolean;
  requestedAt: string;
}

interface ReservationRequestsProps {
  requests: ReservationRequest[];
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onViewDetails?: (request: ReservationRequest) => void;
}

export const ReservationRequests = ({
  requests,
  onApprove,
  onReject,
  onViewDetails
}: ReservationRequestsProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '📹';
      case 'chat':
        return '💬';
      case 'voice':
        return '🎤';
      default:
        return '💬';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'purple';
      case 'chat':
        return 'blue';
      case 'voice':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (requests.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">예약 요청이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">
            새로운 예약 요청을 기다리고 있습니다.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">예약 요청</h3>
        <Badge variant="destructive">{requests.length}건</Badge>
      </div>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className={`p-4 rounded-lg border transition-colors ${
              request.isNew 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(request.type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {request.clientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.specialty}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  size="sm" 
                  className={
                    request.isNew 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {request.isNew ? '신규' : '재예약'}
                </Badge>
                <Badge 
                  size="sm" 
                  variant="outline"
                  className={`text-${getTypeColor(request.type)}-600 border-${getTypeColor(request.type)}-200`}
                >
                  {request.type === 'video' ? '화상' : 
                   request.type === 'chat' ? '채팅' : '음성'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{request.date} {request.time}</span>
                <span className="ml-2">({request.duration}분)</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatDate(request.requestedAt)} 요청</span>
              </div>
            </div>

            {request.message && (
              <div className="mb-3 p-2 bg-white rounded border text-sm text-gray-700">
                <strong>메시지:</strong> {request.message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="xs"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove && onApprove(request.id)}
              >
                승인
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onReject && onReject(request.id)}
              >
                거절
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onViewDetails && onViewDetails(request)}
                className="ml-auto"
              >
                상세보기
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
