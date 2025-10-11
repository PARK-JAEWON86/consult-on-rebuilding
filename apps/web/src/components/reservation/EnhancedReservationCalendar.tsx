'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, Clock, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Holidays from 'date-holidays';

interface TimeSlot {
  time: string;
  available: boolean;
  reserved: boolean;
}

interface DayAvailability {
  date: string;
  hasAvailableSlots: boolean;
  totalSlots: number;
  availableSlots: number;
}

interface EnhancedReservationCalendarProps {
  expertDisplayId: string;
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

export default function EnhancedReservationCalendar({
  expertDisplayId,
  onSelectSlot,
  selectedDate,
  selectedTime
}: EnhancedReservationCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateState, setSelectedDateState] = useState(selectedDate || '');

  // 선택된 날짜의 타임슬롯 조회
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['available-slots', expertDisplayId, selectedDateState],
    queryFn: async () => {
      const response = await api.get(
        `http://localhost:4000/v1/experts/${expertDisplayId}/available-slots`,
        { params: { date: selectedDateState } }
      );
      return response.data;
    },
    enabled: !!expertDisplayId && !!selectedDateState
  });

  // 현재 월의 모든 날짜에 대한 가용성 조회
  const { data: monthAvailability, isLoading: isMonthLoading } = useQuery({
    queryKey: ['month-availability', expertDisplayId, currentYear, currentMonth],
    queryFn: async () => {
      // 현재 월의 모든 날짜에 대해 가용성 확인
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const availabilityPromises = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];

        // 오늘 이전 날짜는 건너뛰기
        if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          continue;
        }

        availabilityPromises.push(
          api.get(`http://localhost:4000/v1/experts/${expertDisplayId}/available-slots`, {
            params: { date: dateStr }
          }).then(response => ({
            date: dateStr,
            hasAvailableSlots: response.data?.slots?.some((slot: TimeSlot) => slot.available && !slot.reserved) || false,
            totalSlots: response.data?.slots?.length || 0,
            availableSlots: response.data?.slots?.filter((slot: TimeSlot) => slot.available && !slot.reserved).length || 0
          })).catch(() => ({
            date: dateStr,
            hasAvailableSlots: false,
            totalSlots: 0,
            availableSlots: 0
          }))
        );
      }

      const results = await Promise.all(availabilityPromises);
      return results.reduce((acc, curr) => {
        acc[curr.date] = curr;
        return acc;
      }, {} as Record<string, DayAvailability>);
    },
    enabled: !!expertDisplayId
  });

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 달력 렌더링을 위한 날짜 배열 생성
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days = [];

    // 이전 달의 날짜들 (빈 칸)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

    // 과거 날짜는 선택 불가
    if (dateStr < todayStr) return;

    setSelectedDateState(dateStr);
  };

  // 타임슬롯 선택 핸들러
  const handleSlotClick = (time: string, slot: TimeSlot) => {
    if (!selectedDateState) return;

    // 예약된 시간이거나 예약 불가능한 시간은 선택 불가
    if (slot.reserved || !slot.available) {
      return;
    }

    onSelectSlot(selectedDateState, time);
  };

  // 한국 공휴일 조회
  const koreanHolidays = useMemo(() => {
    const hd = new Holidays('KR');
    const holidays = hd.getHolidays(currentYear);
    const holidayMap: Record<string, string> = {};

    holidays.forEach((holiday) => {
      const date = new Date(holiday.date);
      const dateStr = date.toISOString().split('T')[0];
      holidayMap[dateStr] = holiday.name;
    });

    return holidayMap;
  }, [currentYear]);

  const calendarDays = generateCalendarDays();
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      {/* 달력 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-semibold text-gray-900">
            {currentYear}년 {monthNames[currentMonth]}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-1 ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {isMonthLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">확인 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-[40px]" />;
              }

              const date = new Date(currentYear, currentMonth, day);
              const dateStr = date.toISOString().split('T')[0];
              const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateState;
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const holidayName = koreanHolidays[dateStr];
              const isHoliday = !!holidayName;

              const availability = monthAvailability?.[dateStr];
              const hasSlots = availability?.hasAvailableSlots || false;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={isPast || !hasSlots}
                  className={`
                    p-1 rounded-lg text-xs font-medium transition-all relative min-h-[40px]
                    ${isPast
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : hasSlots
                      ? 'bg-white border-2 border-green-400 text-gray-900 hover:bg-green-50 hover:border-green-500'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-2 ring-blue-400' : ''}
                    ${(isWeekend || isHoliday) && !isPast && !isSelected ? 'text-red-600' : ''}
                  `}
                  title={isHoliday ? holidayName : undefined}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-0.5">
                    <span className="text-xs font-semibold">{day}</span>
                    {isHoliday && !isPast && (
                      <span className="text-[9px] leading-none text-red-500 font-medium truncate max-w-full px-0.5">
                        {holidayName}
                      </span>
                    )}
                    {hasSlots && !isSelected && !isHoliday && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                    {isToday && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 범례 */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-green-400 rounded"></div>
            <span>예약 가능</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>불가</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-semibold">●</span>
            <span>공휴일</span>
          </div>
        </div>
      </div>

      {/* 시간 선택 섹션 */}
      {selectedDateState && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <Clock className="h-4 w-4 text-gray-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900">
              {new Date(selectedDateState).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })} 예약 가능 시간
            </h4>
          </div>

          {isSlotsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">시간 조회 중...</span>
            </div>
          ) : slotsData?.slots && slotsData.slots.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {slotsData.slots.map((slot: TimeSlot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available || slot.reserved}
                    onClick={() => handleSlotClick(slot.time, slot)}
                    className={`
                      relative p-3 rounded-lg border text-sm font-medium transition-all
                      ${
                        selectedTime === slot.time
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                          : slot.reserved
                          ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed opacity-60'
                          : !slot.available
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:shadow-sm'
                      }
                    `}
                    title={
                      slot.reserved
                        ? '이미 예약된 시간입니다'
                        : !slot.available
                        ? '예약할 수 없는 시간입니다'
                        : '클릭하여 예약'
                    }
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{slot.time}</span>
                      {slot.reserved && (
                        <span className="text-xs mt-1 font-medium">예약됨</span>
                      )}
                      {!slot.available && !slot.reserved && (
                        <span className="text-xs mt-1">불가</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* 시간 선택 범례 */}
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                  <span>예약 가능</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                  <span>예약됨</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>선택됨</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">
                {slotsData?.message || '해당 날짜에 예약 가능한 시간이 없습니다.'}
              </p>
            </div>
          )}
        </div>
      )}

      {!selectedDateState && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">날짜를 선택해주세요</p>
          <p className="text-xs text-gray-500 mt-1">
            예약 가능한 날짜는 녹색 테두리로 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
}
