'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  CreditCard,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Expert {
  id: number;
  name: string;
  displayId: string;
  totalSessions: number;
  ratingAvg: number;
  experience: number;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  creditsPerMinute: number;
}

interface ReservationData {
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  note?: string;
}

export default function ReservationModal({
  isOpen,
  onClose,
  expert,
  creditsPerMinute
}: ReservationModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30); // 기본 30분
  const [note, setNote] = useState('');
  const [userCredits, setUserCredits] = useState(0);

  // 사용자 크레딧 잔액 조회
  const { mutate: fetchUserCredits } = useMutation({
    mutationFn: async () => {
      const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setUserCredits(data.data || 0);
      }
    }
  });

  // 예약 생성 뮤테이션
  const { mutate: createReservation, isLoading } = useMutation({
    mutationFn: async (data: ReservationData) => {
      const response = await api.post('http://localhost:4000/v1/reservations', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast('success', '상담 예약이 완료되었습니다!');
        queryClient.invalidateQueries(['reservations']);
        queryClient.invalidateQueries(['credits']);
        onClose();
        // 폼 리셋
        setSelectedDate('');
        setSelectedTime('');
        setDuration(30);
        setNote('');
      } else {
        showToast('error', data.error?.message || '예약에 실패했습니다.');
      }
    },
    onError: (error: any) => {
      console.error('Reservation error:', error);
      const message = error?.response?.data?.error?.message || '예약에 실패했습니다.';
      showToast('error', message);
    }
  });

  // 컴포넌트가 열릴 때 크레딧 잔액 조회
  useState(() => {
    if (isOpen && user?.id) {
      fetchUserCredits();
    }
  });

  const totalCost = Math.ceil(creditsPerMinute * duration);
  const canAfford = userCredits >= totalCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast('error', '로그인이 필요합니다.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      showToast('error', '날짜와 시간을 선택해주세요.');
      return;
    }

    if (!canAfford) {
      showToast('error', '크레딧이 부족합니다.');
      return;
    }

    // 날짜와 시간을 조합하여 ISO 문자열 생성
    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    const reservationData: ReservationData = {
      userId: user.id,
      expertId: expert.id,
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      note: note.trim() || undefined
    };

    createReservation(reservationData);
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split('T')[0];

  // 시간 옵션 생성 (9:00 ~ 21:00)
  const timeOptions = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">상담 예약</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 전문가 정보 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-gray-900">{expert.name}</h3>
          <p className="text-sm text-gray-600">전문가</p>
        </div>

        {/* 크레딧 정보 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">내 크레딧</span>
            <span className="font-semibold text-gray-900">{userCredits.toLocaleString()} 크레딧</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">분당 요금</span>
            <span className="font-semibold text-blue-600">{creditsPerMinute} 크레딧</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">예상 비용 ({duration}분)</span>
            <span className="font-bold text-blue-900">{totalCost.toLocaleString()} 크레딧</span>
          </div>

          {!canAfford && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-600">크레딧이 부족합니다</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 시간 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="h-4 w-4 inline mr-1" />
              시간
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">시간을 선택하세요</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* 상담 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상담 시간
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30분 ({Math.ceil(creditsPerMinute * 30).toLocaleString()} 크레딧)</option>
              <option value={60}>60분 ({Math.ceil(creditsPerMinute * 60).toLocaleString()} 크레딧)</option>
              <option value={90}>90분 ({Math.ceil(creditsPerMinute * 90).toLocaleString()} 크레딧)</option>
              <option value={120}>120분 ({Math.ceil(creditsPerMinute * 120).toLocaleString()} 크레딧)</option>
            </select>
          </div>

          {/* 요청사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              요청사항 (선택)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="상담받고 싶은 내용이나 궁금한 점을 적어주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!canAfford || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                '예약 중...'
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-1" />
                  예약하기
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}