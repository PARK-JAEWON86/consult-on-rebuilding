"use client";

import { useState } from "react";
import { Button } from '@/components/ui/Button';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface Consultation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  type: 'video' | 'chat' | 'voice';
}

interface ConsultationCalendarProps {
  consultations: Consultation[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date | null;
}

export const ConsultationCalendar = ({
  consultations,
  onDateSelect,
  selectedDate
}: ConsultationCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getConsultationsByDate = (date: Date) => {
    const dateStr = formatDate(date);
    return consultations.filter(
      (consultation) => consultation.date === dateStr,
    );
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (onDateSelect) {
      onDateSelect(new Date());
    }
  };

  const getConsultationStatusColor = (consultations: Consultation[]) => {
    if (consultations.length === 0) return null;

    const hasScheduled = consultations.some((c) => c.status === "scheduled");
    const hasPending = consultations.some((c) => c.status === "pending");

    if (hasScheduled && hasPending) {
      return "mixed";
    } else if (hasScheduled) {
      return "scheduled";
    } else {
      return "pending";
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (Date | null)[] = [];

    // 빈 칸들 (이전 달의 마지막 날들)
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      days.push(date);
    }

    return days;
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={goToToday}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <CalendarDays className="h-4 w-4" />
            <span>오늘</span>
          </Button>
          <div className="flex space-x-1">
            <Button
              onClick={() => navigateMonth(-1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigateMonth(1)}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 날짜들 */}
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarDays().map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10"></div>;
          }

          const consultationsOnDate = getConsultationsByDate(date);
          const isToday = formatDate(date) === formatDate(new Date());
          const isSelected =
            selectedDate &&
            formatDate(date) === formatDate(selectedDate);
          const statusColor =
            getConsultationStatusColor(consultationsOnDate);

          let dayClasses =
            "h-10 text-sm rounded-lg flex items-center justify-center relative transition-all duration-200 cursor-pointer ";
          let badgeElement = null;

          if (isSelected) {
            dayClasses +=
              "bg-blue-600 text-white shadow-lg scale-105";
          } else if (isToday) {
            dayClasses +=
              "bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300";
          } else if (statusColor) {
            switch (statusColor) {
              case "scheduled":
                dayClasses +=
                  "bg-green-100 text-green-800 hover:bg-green-200 font-semibold border border-green-300";
                badgeElement = (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    ✓
                  </div>
                );
                break;
              case "pending":
                dayClasses +=
                  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold border border-yellow-300";
                badgeElement = (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    ⏳
                  </div>
                );
                break;
              case "mixed":
                dayClasses +=
                  "bg-gradient-to-br from-green-100 to-yellow-100 text-gray-800 hover:from-green-200 hover:to-yellow-200 font-semibold border border-orange-300";
                badgeElement = (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {consultationsOnDate.length}
                  </div>
                );
                break;
            }
          } else {
            dayClasses += "hover:bg-gray-100 text-gray-700";
          }

          return (
            <button
              key={index}
              onClick={() => onDateSelect && onDateSelect(date)}
              className={dayClasses}
              title={
                consultationsOnDate.length > 0
                  ? `${consultationsOnDate.length}개의 상담 예약`
                  : ""
              }
            >
              {date.getDate()}
              {badgeElement}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2 font-medium">범례</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-gray-600">오늘</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                <span style={{ fontSize: "6px" }}>✓</span>
              </div>
            </div>
            <span className="text-gray-600">예정 상담</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                <span style={{ fontSize: "6px" }}>⏳</span>
              </div>
            </div>
            <span className="text-gray-600">대기 상담</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-br from-green-100 to-yellow-100 border border-orange-300 rounded relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                <span style={{ fontSize: "6px" }}>2</span>
              </div>
            </div>
            <span className="text-gray-600">혼합 상담</span>
          </div>
        </div>
      </div>
    </div>
  );
};
