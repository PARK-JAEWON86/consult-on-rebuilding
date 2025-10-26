'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { X, AlertTriangle, Calendar, AlertCircle } from 'lucide-react';

interface CancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: {
    displayId: string;
    expertName: string;
    startAt: string;
    endAt: string;
    cost: number;
    refundInfo: {
      canCancel: boolean;
      message: string;
      refundRate: number;
      refundAmount?: number;
    } | null;
  };
  isLoading?: boolean;
}

export default function CancelReservationModal({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false
}: CancelReservationModalProps) {
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const startDateTime = formatDateTime(reservation.startAt);
  const endDateTime = formatDateTime(reservation.endAt);

  const handleConfirm = () => {
    if (!understood) {
      alert('예약 취소에 동의해주세요.');
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">예약 취소</h2>
        <p className="text-gray-700 text-center mb-6">
          정말 예약을 취소하시겠습니까?
        </p>

        {/* 예약 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">예약 번호</span>
            <span className="font-semibold text-gray-900">{reservation.displayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">전문가</span>
            <span className="font-semibold text-gray-900">{reservation.expertName}</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-start space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{startDateTime.date}</p>
                <p className="text-sm text-gray-600">
                  {startDateTime.time} - {endDateTime.time}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 취소 안내 */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                예약을 취소하시면 전문가에게 취소 알림이 전송됩니다.
                예약 시간까지 충분한 여유가 있을 때 취소해주시기 바랍니다.
              </p>
            </div>
          </div>
        </div>

        {/* 확인 체크박스 */}
        <label className="flex items-start space-x-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isLoading}
          />
          <span className="text-sm text-gray-700">
            예약 취소에 동의합니다.
          </span>
        </label>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            돌아가기
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading || !understood}
          >
            {isLoading ? '취소 중...' : '예약 취소하기'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
