'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import EnhancedReservationCalendar from './EnhancedReservationCalendar';
import {
  CreditCard,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';

interface Expert {
  id: number;
  name: string;
  displayId: string;
  totalSessions: number;
  ratingAvg: number;
  experience: number;
}

interface ReservationModalImprovedProps {
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

type Step = 'select' | 'confirm';

export default function ReservationModalImproved({
  isOpen,
  onClose,
  expert,
  creditsPerMinute
}: ReservationModalImprovedProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('select');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState('');
  const [alternativeTimes, setAlternativeTimes] = useState<Array<{ startAt: string; endAt: string }>>([]);

  // 사용자 크레딧 잔액 조회
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id && isOpen
  });

  // 전문가 공휴일 설정 조회
  const { data: availabilityData } = useQuery({
    queryKey: ['expert-availability', expert.displayId],
    queryFn: async () => {
      const response = await api.get(`/experts/${expert.displayId}/availability`);
      return response.data;
    },
    enabled: isOpen
  });

  const userCredits = creditsData?.data || 0;
  const totalCost = Math.ceil(creditsPerMinute * duration);
  const canAfford = userCredits >= totalCost;

  // 예약 생성 뮤테이션
  const { mutate: createReservation, isPending } = useMutation({
    mutationFn: async (data: ReservationData) => {
      // Idempotency Key 생성 (UUID v4 형식)
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      const response = await api.post('http://localhost:4000/v1/reservations', data, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast('상담 예약이 완료되었습니다!', 'success');
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['credits'] });
        handleClose();
      } else {
        showToast(data.error?.message || '예약에 실패했습니다.', 'error');
      }
    },
    onError: (error: any) => {
      console.error('Reservation error:', error);
      const errorMessage = error?.response?.data?.error?.message || '예약에 실패했습니다.';
      const errorCode = error?.response?.data?.error?.code;

      // 시간 충돌 에러인 경우 대체 시간 제안 표시
      if (errorCode === 'E_TIME_CONFLICT') {
        const alternatives = error?.response?.data?.error?.alternativeTimes || [];
        setAlternativeTimes(alternatives);
        setStep('select'); // 선택 단계로 돌아가기
        showToast('선택한 시간에 이미 다른 예약이 있습니다. 아래의 대체 시간을 확인해주세요.', 'error');
      } else if (errorCode === 'E_NOT_AVAILABLE_TIME') {
        setStep('select');
        showToast('전문가의 예약 가능 시간이 아닙니다. 다른 시간을 선택해주세요.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    }
  });

  // 모달 닫기 핸들러
  const handleClose = () => {
    setStep('select');
    setSelectedDate('');
    setSelectedTime('');
    setDuration(30);
    setNote('');
    onClose();
  };

  // 슬롯 선택 핸들러
  const handleSelectSlot = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  // 다음 단계로
  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      showToast('날짜와 시간을 선택해주세요.', 'error');
      return;
    }

    if (!canAfford) {
      showToast('크레딧이 부족합니다.', 'error');
      return;
    }

    setStep('confirm');
  };

  // 예약 확정
  const handleConfirm = () => {
    if (!user?.id) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    const reservationData: ReservationData = {
      userId: Number(user.id),
      expertId: expert.id,
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      note: note.trim() || undefined
    };

    createReservation(reservationData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">상담 예약</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'select' ? '1단계: 날짜와 시간 선택' : '2단계: 예약 정보 확인'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 전문가 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                <p className="text-sm text-gray-600">전문가</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900">{creditsPerMinute} 크레딧</p>
                <p className="text-xs text-blue-700">분당</p>
              </div>
            </div>
          </div>

          {/* 공휴일 상담 안내 */}
          {availabilityData?.holidaySettings?.acceptHolidayConsultations && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-semibold text-green-900">공휴일 상담 가능</h4>
              </div>
              {availabilityData.holidaySettings.holidayNote && (
                <p className="text-sm text-green-700 ml-7">
                  {availabilityData.holidaySettings.holidayNote}
                </p>
              )}
            </div>
          )}

          {step === 'select' ? (
            // 1단계: 날짜 및 시간 선택
            <>
              <EnhancedReservationCalendar
                expertDisplayId={expert.displayId}
                onSelectSlot={handleSelectSlot}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />

              {/* 상담 시간 선택 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  상담 시간
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30분 ({Math.ceil(creditsPerMinute * 30).toLocaleString()} 크레딧)</option>
                  <option value={60}>60분 ({Math.ceil(creditsPerMinute * 60).toLocaleString()} 크레딧)</option>
                  <option value={90}>90분 ({Math.ceil(creditsPerMinute * 90).toLocaleString()} 크레딧)</option>
                  <option value={120}>120분 ({Math.ceil(creditsPerMinute * 120).toLocaleString()} 크레딧)</option>
                </select>
              </div>

              {/* 대체 시간 제안 */}
              {alternativeTimes.length > 0 && (
                <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-3">⚠️ 선택한 시간은 예약이 불가합니다. 아래의 대체 시간을 확인해주세요:</p>
                  <div className="space-y-2">
                    {alternativeTimes.map((alt, idx) => {
                      const start = new Date(alt.startAt);
                      const end = new Date(alt.endAt);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedDate(start.toISOString().split('T')[0]);
                            setSelectedTime(start.toTimeString().slice(0, 5));
                            setAlternativeTimes([]);
                          }}
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors text-left"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 크레딧 정보 */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">내 크레딧</span>
                  <span className="font-semibold text-gray-900">{userCredits.toLocaleString()} 크레딧</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">예상 비용 ({duration}분)</span>
                  <span className="font-bold text-blue-900">{totalCost.toLocaleString()} 크레딧</span>
                </div>
                {canAfford ? (
                  <div className="flex items-center text-sm text-green-600 mt-2">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>예약 가능</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-red-600 mt-2">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>크레딧이 부족합니다</span>
                  </div>
                )}
              </div>

              {/* 다음 버튼 */}
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime || !canAfford}
                  className="flex-1"
                >
                  다음
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            // 2단계: 예약 확인
            <>
              {/* 예약 요약 */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">예약 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">전문가</span>
                      <span className="font-medium text-gray-900">{expert.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">날짜</span>
                      <span className="font-medium text-gray-900">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">시간</span>
                      <span className="font-medium text-gray-900">{selectedTime} ({duration}분)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-600">예상 비용</span>
                      <span className="font-bold text-blue-900">{totalCost.toLocaleString()} 크레딧</span>
                    </div>
                  </div>
                </div>

                {/* 요청사항 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요청사항 (선택)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="상담받고 싶은 내용이나 궁금한 점을 적어주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{note.length}/500</p>
                </div>

                {/* 취소 정책 안내 */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900 font-medium mb-2">📋 취소 정책</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>24시간 이전 취소:</strong> 전액 환불 (100%)</li>
                    <li>• <strong>24시간 이내 취소:</strong> 50% 환불</li>
                    <li>• <strong>예약 시작 후:</strong> 취소 불가</li>
                  </ul>
                </div>

                {/* 안내사항 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ 예약 전 확인사항</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 예약 시 크레딧이 즉시 차감됩니다</li>
                    <li>• 전문가 승인 후 예약이 확정됩니다</li>
                    <li>• 예약 시간 5분 전까지 입장해주세요</li>
                  </ul>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  이전
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? (
                    '예약 중...'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-1" />
                      예약 확정
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
