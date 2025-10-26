'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import EnhancedReservationCalendar from './EnhancedReservationCalendar';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Clock,
  Send,
  CheckCircle
} from 'lucide-react';

interface Expert {
  id: number;
  name: string;
  displayId: string;
  totalSessions: number;
  ratingAvg: number;
  experience: number;
  avatarUrl?: string | null;
  specialty?: string | null;
  level?: string | null;
  consultationStyle?: string | null;
  // Availability 관련 필드 추가 (profile API에서 이미 제공됨)
  availabilitySlots?: Array<{
    id: number;
    expertId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  holidaySettings?: {
    acceptHolidayConsultations: boolean;
    holidayNote: string;
  };
  restTimeSettings?: {
    enableLunchBreak: boolean;
    lunchStartTime: string;
    lunchEndTime: string;
    enableDinnerBreak: boolean;
    dinnerStartTime: string;
    dinnerEndTime: string;
  };
}

interface ReservationModalImprovedProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  creditsPerMinute: number;
  userCredits?: number; // 부모 컴포넌트에서 전달받은 크레딧 (선택적)
}

interface ReservationData {
  userId: number;
  expertId: number;
  startAt: string;
  endAt: string;
  note?: string;
}

type Step = 'select' | 'confirm' | 'success';

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
  const [alternativeTimes, setAlternativeTimes] = useState<Array<{ startAt: string; endAt: string }>>([]);
  const [reservationDisplayId, setReservationDisplayId] = useState('');

  // 구조화된 상담 정보
  const [consultationTopic, setConsultationTopic] = useState('');
  const [consultationType, setConsultationType] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');

  // 전문가 전문분야에 따른 플레이스홀더 생성
  const getPlaceholders = () => {
    const specialty = expert.specialty?.toLowerCase() || '';

    // 전문분야별 맞춤 플레이스홀더
    const placeholders: Record<string, { topic: string; situation: string }> = {
      '마케팅': {
        topic: '예: 브랜드 포지셔닝 전략, SNS 마케팅 방법',
        situation: '예: 신규 제품 출시를 앞두고 있는데, 어떤 마케팅 채널이 효과적일지 고민입니다.'
      },
      '창업': {
        topic: '예: 초기 비즈니스 모델 검증, 투자 유치 전략',
        situation: '예: 아이디어는 있지만 어떻게 시작해야 할지, 초기 자금을 어떻게 마련해야 할지 막막합니다.'
      },
      '경력': {
        topic: '예: 이직 준비 전략, 커리어 전환 방법',
        situation: '예: 현재 직무에서 다른 분야로 전환을 고민 중인데, 어떤 준비가 필요한지 모르겠습니다.'
      },
      '재무': {
        topic: '예: 투자 포트폴리오 구성, 재무 계획 수립',
        situation: '예: 목돈이 생겼는데 어떻게 관리하고 투자해야 할지 결정하기 어렵습니다.'
      },
      '심리': {
        topic: '예: 직장 내 스트레스 관리, 대인관계 고민',
        situation: '예: 최근 업무 스트레스로 인해 번아웃이 오는 것 같고, 동료들과의 관계도 어렵습니다.'
      },
      '법률': {
        topic: '예: 계약서 검토, 법적 분쟁 대응 방법',
        situation: '예: 비즈니스 계약을 앞두고 있는데, 불리한 조항이 있을까 걱정됩니다.'
      },
      'it': {
        topic: '예: 기술 스택 선택, 아키텍처 설계',
        situation: '예: 새로운 프로젝트를 시작하는데, 어떤 기술을 사용하는 것이 적합할지 고민입니다.'
      },
      '디자인': {
        topic: '예: UI/UX 개선, 브랜드 아이덴티티 구축',
        situation: '예: 서비스의 사용자 경험을 개선하고 싶은데, 어디서부터 손대야 할지 모르겠습니다.'
      }
    };

    // 전문분야 키워드 매칭
    for (const [key, value] of Object.entries(placeholders)) {
      if (specialty.includes(key)) {
        return value;
      }
    }

    // 기본 플레이스홀더
    return {
      topic: '예: 창업 초기 마케팅 전략, 경력 전환 상담',
      situation: '현재 어떤 상황이신가요? 어떤 점이 고민되시나요?'
    };
  };

  const placeholders = getPlaceholders();

  // 크레딧 시스템 제거 - 주석 처리
  // const { data: creditsData } = useQuery({
  //   queryKey: ['user-credits', user?.id],
  //   queryFn: async () => {
  //     const response = await api.get(`http://localhost:4000/v1/credits/balance?userId=${user?.id}`);
  //     return response.data;
  //   },
  //   enabled: !!user?.id && isOpen && propUserCredits === undefined
  // });

  // 크레딧 관련 변수 제거
  // const userCredits = propUserCredits !== undefined ? propUserCredits : (creditsData?.data || 0);
  // const totalCost = Math.ceil(creditsPerMinute * duration);
  // const canAfford = userCredits >= totalCost;

  // 예약 생성 뮤테이션
  const { mutate: createReservation, isPending } = useMutation({
    mutationFn: async (data: ReservationData) => {
      // Idempotency Key 생성 (UUID v4 형식)
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      const response = await api.post('/reservations', data, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return response;  // ✅ api.post()가 이미 response.data를 반환하므로 그대로 사용
    },
    onSuccess: (data) => {
      if (data.success) {
        // 예약 번호 저장
        if (data.data?.displayId) {
          setReservationDisplayId(data.data.displayId);
        }
        setStep('success');  // 성공 단계로 이동
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['credits'] });
        // handleClose()는 사용자가 "확인" 버튼을 클릭할 때 호출
      } else {
        showToast(data.error?.message || '예약에 실패했습니다.', 'error');
      }
    },
    onError: (error: any) => {
      console.error('Reservation error:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || '예약에 실패했습니다.';
      const errorCode = error?.response?.data?.error?.code;
      const statusCode = error?.response?.status;

      // 409 Conflict - 중복 요청 처리 중
      if (statusCode === 409) {
        showToast('예약 요청이 이미 처리 중입니다. 잠시만 기다려주세요.', 'warning');
        return;
      }

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
    setConsultationTopic('');
    setConsultationType('');
    setCurrentSituation('');
    setAlternativeTimes([]);
    setReservationDisplayId('');
    onClose();
  };

  // 슬롯 선택 핸들러
  const handleSelectSlot = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  // 구조화된 상담 정보를 포맷팅
  const formatConsultationNote = (): string => {
    let formattedNote = `[상담 주제]\n${consultationTopic.trim()}\n\n`;

    if (consultationType) {
      formattedNote += `[상담 유형]\n${consultationType}\n\n`;
    }

    formattedNote += `[현재 상황 및 고민사항]\n${currentSituation.trim()}`;

    return formattedNote;
  };

  // 다음 단계로
  const handleNext = () => {
    // 1단계에서는 날짜/시간만 검증
    if (!selectedDate || !selectedTime) {
      showToast('날짜와 시간을 선택해주세요.', 'error');
      return;
    }

    // 2단계로 이동 (상담 정보는 2단계에서 입력)
    setStep('confirm');
  };

  // 예약 확정
  const handleConfirm = () => {
    if (!user?.id) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    // 상담 정보 검증 (2단계에서 필수)
    if (!consultationTopic.trim()) {
      showToast('상담 주제를 입력해주세요.', 'error');
      return;
    }

    if (currentSituation.trim().length < 10) {
      showToast('현재 상황을 최소 10자 이상 작성해주세요.', 'error');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    // duration이 0이면 (전문가와 상의하여 결정) 기본 30분으로 설정하고 요청사항에 명시
    const actualDuration = duration === 0 ? 30 : duration;
    const endDateTime = new Date(startDateTime.getTime() + (actualDuration * 60 * 1000));

    // 구조화된 상담 정보 포맷팅
    const formattedNote = formatConsultationNote();

    // duration이 0일 경우 상담 시간 협의 메시지 추가
    const finalNote = duration === 0
      ? `[상담 시간은 전문가와 상의하여 결정하겠습니다]\n\n${formattedNote}`
      : formattedNote;

    const reservationData: ReservationData = {
      userId: Number(user.id),
      expertId: expert.id,
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      note: finalNote
    };

    createReservation(reservationData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">상담 예약</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'select' && '1단계: 날짜와 시간 선택'}
              {step === 'confirm' && '2단계: 예약 정보 확인'}
              {step === 'success' && '예약 요청 완료'}
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
          {step === 'success' ? (
            // 3단계: 성공 화면
            <div className="text-center py-12">
              {/* 성공 아이콘 */}
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>

              {/* 성공 메시지 */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                예약 요청이 완료되었습니다!
              </h3>

              <p className="text-gray-600 mb-6">
                전문가가 요청을 확인한 후 승인 여부를 알려드립니다.
              </p>

              {/* 예약 정보 요약 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900 mb-3">예약 정보</h4>
                <div className="space-y-2 text-sm">
                  {reservationDisplayId && (
                    <div className="flex justify-between pb-2 border-b border-gray-300">
                      <span className="text-gray-600">예약 번호</span>
                      <span className="font-bold text-blue-900">{reservationDisplayId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">전문가</span>
                    <span className="font-medium text-gray-900">{expert.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">날짜</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedDate).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">시간</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        const period = hours < 12 ? '오전' : '오후';
                        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                      })()} ({duration === 0 ? '전문가와 협의' : `${duration}분`})
                    </span>
                  </div>
                </div>
              </div>

              {/* 다음 단계 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                <h4 className="font-semibold text-blue-900 mb-3">다음 단계</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>전문가가 예약 요청을 확인합니다.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>전문가가 승인하면 알림을 보내드립니다.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>예약 관리 페이지에서 상태를 확인할 수 있습니다.</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mb-8">
                예약 상태는 <strong>대시보드 &gt; 예약 관리</strong>에서 확인하실 수 있습니다.
              </p>

              {/* 확인 버튼 */}
              <Button
                type="button"
                onClick={handleClose}
                className="px-8 py-3"
              >
                확인
              </Button>
            </div>
          ) : step === 'select' ? (
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
                  <option value={30}>30분</option>
                  <option value={60}>60분</option>
                  <option value={90}>90분</option>
                  <option value={120}>120분</option>
                  <option value={0}>전문가와 상의하여 결정</option>
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
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1"
                >
                  <span className="inline-flex items-center">
                    다음 <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </Button>
              </div>
            </>
          ) : (
            // 2단계: 예약 확인
            <>
              {/* 예약 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예약 정보
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">전문가</span>
                      <span className="font-bold text-gray-900">{expert.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">날짜</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">시간</span>
                      <span className="font-medium text-gray-900">
                        {(() => {
                          const [hours, minutes] = selectedTime.split(':').map(Number);
                          const period = hours < 12 ? '오전' : '오후';
                          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                          return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                        })()} ({duration === 0 ? '전문가와 상의하여 결정' : `${duration}분`})
                      </span>
                    </div>
                    <div className="border-t border-gray-300 my-2 pt-2"></div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">분당 요금</span>
                      <span className="font-semibold text-blue-900">{creditsPerMinute} 크레딧</span>
                    </div>
                    {duration > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">예상 비용</span>
                        <span className="font-bold text-lg text-blue-900">{creditsPerMinute * duration} 크레딧</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 상담 정보 */}
              <div className="space-y-4 mt-4">
                {/* 1. 상담 주제 (필수) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상담 주제 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={consultationTopic}
                    onChange={(e) => setConsultationTopic(e.target.value)}
                    placeholder={placeholders.topic}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{consultationTopic.length}/100</p>
                </div>

                {/* 2. 상담 유형 (선택) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상담 유형
                  </label>
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하지 않음</option>
                    <option value="초기 상담">초기 상담 (처음 받는 상담)</option>
                    <option value="후속 상담">후속 상담 (이전 상담 연장)</option>
                    <option value="긴급 상담">긴급 상담 (빠른 의사결정 필요)</option>
                    <option value="일반 상담">일반 상담</option>
                  </select>
                </div>

                {/* 3. 현재 상황 및 고민사항 (필수) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 상황 및 고민사항 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={currentSituation}
                    onChange={(e) => setCurrentSituation(e.target.value)}
                    placeholder={placeholders.situation}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-xs text-gray-500 mt-1">{currentSituation.length}/300</p>
                </div>

                {/* 안내사항 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ 예약 전 확인사항</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 전문가 승인 후 예약이 확정됩니다</li>
                    <li>• 예약 시간 5분 전까지 입장해주세요</li>
                    <li>• 상담 요청사항을 구체적으로 작성해주세요</li>
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
                  <span className="inline-flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-1" /> 이전
                  </span>
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending || !consultationTopic.trim() || currentSituation.trim().length < 10}
                  className="flex-1"
                >
                  {isPending ? (
                    '예약 중...'
                  ) : (
                    <span className="inline-flex items-center">
                      <Send className="h-4 w-4 mr-1" /> 예약 요청
                    </span>
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
