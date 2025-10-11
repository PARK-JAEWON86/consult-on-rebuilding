'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TimeSlot {
  time: string;
  available: boolean;
  reserved: boolean;
}

interface AvailableTimeSlotsCalendarProps {
  expertDisplayId: string;
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

export default function AvailableTimeSlotsCalendar({
  expertDisplayId,
  onSelectSlot,
  selectedDate,
  selectedTime
}: AvailableTimeSlotsCalendarProps) {
  const [currentDate, setCurrentDate] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );

  // 예약 가능 시간 조회
  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['available-slots', expertDisplayId, currentDate],
    queryFn: async () => {
      const response = await api.get(
        `http://localhost:4000/v1/experts/${expertDisplayId}/available-slots`,
        { params: { date: currentDate } }
      );
      return response.data;
    },
    enabled: !!expertDisplayId && !!currentDate
  });

  // 날짜 변경 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
  };

  // 슬롯 선택 핸들러
  const handleSlotClick = (time: string) => {
    onSelectSlot(currentDate, time);
  };

  // 오늘 날짜 (최소 선택 가능 날짜)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* 날짜 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4 inline mr-1" />
          날짜 선택
        </label>
        <input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          min={today}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 타임슬롯 그리드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="h-4 w-4 inline mr-1" />
          시간 선택
        </label>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">예약 가능 시간 조회 중...</span>
          </div>
        ) : slotsData?.slots && slotsData.slots.length > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {slotsData.slots.map((slot: TimeSlot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available || slot.reserved}
                  onClick={() => handleSlotClick(slot.time)}
                  className={`
                    relative p-3 rounded-lg border text-sm font-medium transition-all
                    ${
                      selectedDate === currentDate && selectedTime === slot.time
                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                        : slot.reserved
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : !slot.available
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{slot.time}</span>
                    {slot.reserved && (
                      <span className="text-xs mt-1">예약됨</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 범례 */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mt-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                <span>예약 가능</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                <span>예약됨</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                <span>선택됨</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {slotsData?.message || '해당 날짜에 예약 가능한 시간이 없습니다.'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              다른 날짜를 선택해주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
