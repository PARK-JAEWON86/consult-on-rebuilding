'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Video, MessageSquare, Phone } from 'lucide-react';
import { type Reservation } from '@/lib/reservations';
import Holidays from 'date-holidays';

interface ReservationsCalendarProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  isLoading?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  reservations: Reservation[];
  isHoliday: boolean;
  isSunday: boolean;
  holidayName?: string;
}

// 한국 공휴일 확인 함수
const getHolidayInfo = (date: Date) => {
  const hd = new Holidays('KR');
  const holidays = hd.isHoliday(date);
  return holidays ? holidays[0] : null;
};

export function ReservationsCalendar({
  reservations,
  onReservationClick,
  isLoading = false
}: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 이번 달 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 달력 시작일 (이전 달 일부 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 달력 종료일 (다음 달 일부 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayReservations = reservations.filter(res => {
        const resDate = new Date(res.startAt).toISOString().split('T')[0];
        return resDate === dateStr;
      });

      // 공휴일 확인
      const holidayInfo = getHolidayInfo(current);
      const isSunday = current.getDay() === 0;

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        reservations: dayReservations,
        isHoliday: !!holidayInfo,
        isSunday,
        holidayName: holidayInfo?.name,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, reservations]);

  // 선택된 날짜의 예약들
  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return reservations.filter(res => {
      const resDate = new Date(res.startAt).toISOString().split('T')[0];
      return resDate === dateStr;
    });
  }, [selectedDate, reservations]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-3 h-3" />;
      case 'CHAT':
        return <MessageSquare className="w-3 h-3" />;
      case 'VOICE':
        return <Phone className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 text-blue-700';
      case 'CHAT':
        return 'bg-green-100 text-green-700';
      case 'VOICE':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            오늘
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 달력 */}
        <div className="lg:col-span-2">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isSelected =
                selectedDate && day.date.toDateString() === selectedDate.toDateString();
              const hasReservations = day.reservations.length > 0;
              const isRedDay = day.isHoliday || day.isSunday;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (hasReservations || day.isCurrentMonth) {
                      setSelectedDate(day.date);
                    }
                  }}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg border transition-all
                    ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : isRedDay ? 'text-red-600' : 'text-gray-900'}
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                    ${hasReservations ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm' : ''}
                    ${day.isCurrentMonth && !hasReservations ? 'hover:bg-gray-50' : ''}
                  `}
                  title={day.holidayName}
                >
                  <div className={`text-sm font-medium mb-1 ${isRedDay && day.isCurrentMonth ? 'font-bold' : ''}`}>
                    {day.date.getDate()}
                  </div>

                  {/* 예약 표시 */}
                  {hasReservations && (
                    <div className="space-y-1">
                      {day.reservations.slice(0, 2).map((res, i) => (
                        <div
                          key={res.id}
                          className={`text-xs px-1.5 py-0.5 rounded flex items-center space-x-1 ${getTypeColor(res.type)}`}
                        >
                          {getTypeIcon(res.type)}
                          <span className="truncate flex-1">
                            {new Date(res.startAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                      {day.reservations.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.reservations.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 예약 상세 */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {selectedDate
                ? selectedDate.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })
                : '날짜를 선택하세요'}
            </h4>

            {selectedDate && selectedDateReservations.length > 0 ? (
              <div className="space-y-2">
                {selectedDateReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    onClick={() => onReservationClick(reservation)}
                    className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(reservation.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {reservation.expertName}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(reservation.type)}`}>
                        {reservation.type === 'VIDEO' ? '화상' :
                         reservation.type === 'CHAT' ? '채팅' : '음성'}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 space-x-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(reservation.startAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{reservation.specialty}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-sm text-gray-500 text-center py-8">
                예약이 없습니다
              </p>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                날짜를 선택하면<br />예약 정보를 확인할 수 있습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
