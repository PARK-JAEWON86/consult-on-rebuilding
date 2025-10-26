'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { X, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: {
    displayId: string;
    userName: string;
    startAt: string;
    endAt: string;
    cost: number;
  };
  isLoading?: boolean;
}

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  reservation: {
    displayId: string;
    userName: string;
    startAt: string;
    endAt: string;
  };
  isLoading?: boolean;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: {
    displayId: string;
    userName: string;
    startAt: string;
    endAt: string;
  };
  isLoading?: boolean;
}

const REJECTION_REASONS = [
  { value: 'schedule_conflict', label: '일정 충돌' },
  { value: 'unavailable', label: '해당 시간대 불가' },
  { value: 'personal_reason', label: '개인 사정' },
  { value: 'too_short_notice', label: '너무 촉박한 예약' },
  { value: 'specialty_mismatch', label: '전문 분야 불일치' },
  { value: 'other', label: '기타' }
];

export function ApproveModal({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false
}: ApproveModalProps) {
  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">예약 승인</h2>
        <p className="text-gray-700 text-center mb-6">
          다음 예약을 승인하시겠습니까?
        </p>

        {/* 예약 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">예약 번호</span>
            <span className="font-semibold text-gray-900">{reservation.displayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">고객</span>
            <span className="font-semibold text-gray-900">{reservation.userName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">시작 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.startAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">종료 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.endAt)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-3">
            <span className="text-gray-700 font-medium">예상 수익</span>
            <span className="font-bold text-green-700 text-lg">{reservation.cost.toLocaleString()} 크레딧</span>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-900 font-medium">
            승인 후 고객에게 확정 알림이 전송됩니다. 예약 시간에 맞춰 상담을 진행해 주세요.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '승인하기'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false
}: RejectModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirm = () => {
    const reason = customReason.trim();

    if (!reason) {
      alert('거절 사유를 작성해주세요.');
      return;
    }

    onConfirm(reason);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">예약 거절</h2>
        <p className="text-gray-700 text-center mb-6">
          다음 예약을 거절하시겠습니까?
        </p>

        {/* 예약 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">예약 번호</span>
            <span className="font-semibold text-gray-900">{reservation.displayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">고객</span>
            <span className="font-semibold text-gray-900">{reservation.userName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">시작 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.startAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">종료 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.endAt)}</span>
          </div>
        </div>

        {/* 거절 사유 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            거절 사유 선택 <span className="text-red-600">*</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isLoading}
          >
            <option value="">거절 사유를 선택해주세요</option>
            {REJECTION_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* 거절 사유 직접 작성 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            거절 사유 작성 <span className="text-red-600">*</span>
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="고객에게 전달될 거절 사유를 작성해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
            rows={4}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-600 mt-1">
            위 드롭다운에서 선택한 사유를 참고하여 친절하게 작성해주세요.
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 font-medium">
              고객에게 전달될 거절 사유를 친절하게 작성해 주세요.
              거절 시 고객에게 알림이 전송되며, 예약이 취소됩니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '거절하기'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false
}: DeleteModalProps) {
  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">예약 삭제</h2>
        <p className="text-gray-700 text-center mb-6">
          다음 예약을 삭제하시겠습니까?
        </p>

        {/* 예약 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">예약 번호</span>
            <span className="font-semibold text-gray-900">{reservation.displayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">고객</span>
            <span className="font-semibold text-gray-900">{reservation.userName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">시작 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.startAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">종료 시간</span>
            <span className="font-semibold text-gray-900">{formatDateTime(reservation.endAt)}</span>
          </div>
        </div>

        {/* 경고 메시지 */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 font-medium">
              이 작업은 되돌릴 수 없습니다. 삭제된 예약은 복구할 수 없습니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? '삭제 중...' : '삭제하기'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
