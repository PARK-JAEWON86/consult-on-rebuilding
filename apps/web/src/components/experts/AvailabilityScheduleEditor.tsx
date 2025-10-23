'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Copy, Calendar, Coffee } from 'lucide-react';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface AvailabilitySlot {
  id?: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00" format
  endTime: string;   // "18:00" format
  isActive: boolean;
}

export interface HolidaySettings {
  acceptHolidayConsultations: boolean;
  holidayNote?: string;
}

export interface RestTimeSettings {
  enableLunchBreak: boolean;
  lunchStartTime: string;
  lunchEndTime: string;
  enableDinnerBreak: boolean;
  dinnerStartTime: string;
  dinnerEndTime: string;
}

interface AvailabilityScheduleEditorProps {
  initialSlots?: AvailabilitySlot[];
  initialHolidaySettings?: HolidaySettings;
  initialRestTimeSettings?: RestTimeSettings;
  onChange: (slots: AvailabilitySlot[], holidaySettings: HolidaySettings, restTimeSettings: RestTimeSettings) => void;
}

const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일',
};

const dayOrder: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function AvailabilityScheduleEditor({
  initialSlots = [],
  initialHolidaySettings = { acceptHolidayConsultations: false },
  initialRestTimeSettings = {
    enableLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    enableDinnerBreak: false,
    dinnerStartTime: '18:00',
    dinnerEndTime: '19:00'
  },
  onChange
}: AvailabilityScheduleEditorProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [holidaySettings, setHolidaySettings] = useState<HolidaySettings>(initialHolidaySettings);
  const [restTimeSettings, setRestTimeSettings] = useState<RestTimeSettings>(initialRestTimeSettings);

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    setHolidaySettings(initialHolidaySettings);
  }, [initialHolidaySettings]);

  useEffect(() => {
    setRestTimeSettings(initialRestTimeSettings);
  }, [initialRestTimeSettings]);

  const handleSlotsChange = (newSlots: AvailabilitySlot[]) => {
    setSlots(newSlots);
    onChange(newSlots, holidaySettings, restTimeSettings);
  };

  const handleHolidaySettingsChange = (newSettings: HolidaySettings) => {
    setHolidaySettings(newSettings);
    onChange(slots, newSettings, restTimeSettings);
  };

  const handleRestTimeSettingsChange = (newSettings: RestTimeSettings) => {
    setRestTimeSettings(newSettings);
    onChange(slots, holidaySettings, newSettings);
  };

  const addSlot = (day: DayOfWeek) => {
    const newSlot: AvailabilitySlot = {
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isActive: true,
    };
    handleSlotsChange([...slots, newSlot]);
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    handleSlotsChange(newSlots);
  };

  const updateSlot = (index: number, updates: Partial<AvailabilitySlot>) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], ...updates };
    handleSlotsChange(newSlots);
  };

  const copyToAllWeekdays = (sourceDay: DayOfWeek) => {
    const sourceSlots = slots.filter(s => s.dayOfWeek === sourceDay);
    if (sourceSlots.length === 0) return;

    const weekdays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const newSlots = slots.filter(s => !weekdays.includes(s.dayOfWeek) || s.dayOfWeek === sourceDay);

    weekdays.forEach(day => {
      if (day !== sourceDay) {
        sourceSlots.forEach(sourceSlot => {
          newSlots.push({
            ...sourceSlot,
            id: undefined, // Remove ID for new slots
            dayOfWeek: day,
          });
        });
      }
    });

    handleSlotsChange(newSlots);
  };

  const toggleDay = (day: DayOfWeek) => {
    const daySlots = slots.filter(s => s.dayOfWeek === day);
    if (daySlots.length > 0) {
      // Toggle all slots for this day
      const allActive = daySlots.every(s => s.isActive);
      const newSlots = slots.map(s =>
        s.dayOfWeek === day ? { ...s, isActive: !allActive } : s
      );
      handleSlotsChange(newSlots);
    } else {
      // Add default slot if none exist
      addSlot(day);
    }
  };

  const groupedSlots = dayOrder.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<DayOfWeek, AvailabilitySlot[]>);

  const dayLabelsShort: Record<DayOfWeek, string> = {
    MONDAY: '월',
    TUESDAY: '화',
    WEDNESDAY: '수',
    THURSDAY: '목',
    FRIDAY: '금',
    SATURDAY: '토',
    SUNDAY: '일',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            예약 가능 시간 설정
            <span className="text-red-500 ml-1">*</span>
          </h3>
        </div>
        <p className="text-sm text-gray-500">요일별로 예약 가능한 시간대를 설정하세요</p>
      </div>

      {/* 요일 선택 가로 배치 */}
      <div className="flex gap-2 justify-center mb-6">
        {dayOrder.map((day) => {
          const daySlots = groupedSlots[day];
          const hasSlots = daySlots.length > 0;
          const isActive = hasSlots && daySlots.some(s => s.isActive);

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
              }`}
            >
              {dayLabelsShort[day]}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {dayOrder.map((day) => {
          const daySlots = groupedSlots[day];
          const hasSlots = daySlots.length > 0;
          const isActive = hasSlots && daySlots.some(s => s.isActive);
          const slotIndices = slots
            .map((s, i) => (s.dayOfWeek === day ? i : -1))
            .filter(i => i !== -1);

          if (!isActive) return null;

          return (
            <div key={day} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {dayLabels[day]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasSlots && (
                    <button
                      type="button"
                      onClick={() => copyToAllWeekdays(day)}
                      className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1 transition-colors"
                      title="평일 전체에 복사"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">평일 복사</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => addSlot(day)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">시간 추가</span>
                  </button>
                </div>
              </div>

              {hasSlots && (
                <div className="space-y-2 mt-3">
                  {slotIndices.map((slotIndex) => {
                    const slot = slots[slotIndex];
                    return (
                      <div key={slotIndex} className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slotIndex, { startTime: e.target.value })}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <span className="text-gray-500">~</span>

                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slotIndex, { endTime: e.target.value })}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeSlot(slotIndex)}
                          className="ml-auto p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!hasSlots && (
                <p className="text-sm text-gray-400 text-center py-2">
                  이 요일은 예약을 받지 않습니다
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 휴식 시간 설정 */}
      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">휴식 시간 설정</h3>
          </div>
          <span className="text-xs text-gray-500">(선택사항)</span>
        </div>

        <div className="space-y-4">
          {/* 점심시간 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={restTimeSettings.enableLunchBreak}
                  onChange={(e) => handleRestTimeSettingsChange({
                    ...restTimeSettings,
                    enableLunchBreak: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>

              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">점심시간 제외</div>
                <p className="text-sm text-gray-600 mb-3">
                  활성화하면 모든 활성 요일에 점심시간이 예약 불가능 시간으로 설정됩니다
                </p>

                {restTimeSettings.enableLunchBreak && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={restTimeSettings.lunchStartTime}
                      onChange={(e) => handleRestTimeSettingsChange({
                        ...restTimeSettings,
                        lunchStartTime: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="time"
                      value={restTimeSettings.lunchEndTime}
                      onChange={(e) => handleRestTimeSettingsChange({
                        ...restTimeSettings,
                        lunchEndTime: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 저녁시간 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={restTimeSettings.enableDinnerBreak}
                  onChange={(e) => handleRestTimeSettingsChange({
                    ...restTimeSettings,
                    enableDinnerBreak: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>

              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">저녁시간 제외</div>
                <p className="text-sm text-gray-600 mb-3">
                  활성화하면 모든 활성 요일에 저녁시간이 예약 불가능 시간으로 설정됩니다
                </p>

                {restTimeSettings.enableDinnerBreak && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={restTimeSettings.dinnerStartTime}
                      onChange={(e) => handleRestTimeSettingsChange({
                        ...restTimeSettings,
                        dinnerStartTime: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="time"
                      value={restTimeSettings.dinnerEndTime}
                      onChange={(e) => handleRestTimeSettingsChange({
                        ...restTimeSettings,
                        dinnerEndTime: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            <strong>💡 안내:</strong> 휴식 시간은 모든 활성화된 요일에 자동으로 적용됩니다.
            예약 시스템에서 해당 시간대는 예약 불가능한 시간으로 표시됩니다.
          </p>
        </div>
      </div>

      {/* 공휴일 상담 설정 */}
      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">공휴일 상담 설정</h3>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                checked={holidaySettings.acceptHolidayConsultations}
                onChange={(e) => handleHolidaySettingsChange({
                  ...holidaySettings,
                  acceptHolidayConsultations: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>

            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">
                공휴일에도 상담 가능
              </div>
              <p className="text-sm text-gray-600 mb-3">
                활성화하면 국경일 및 공휴일에도 예약을 받을 수 있습니다
              </p>

              {holidaySettings.acceptHolidayConsultations && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공휴일 상담 안내 메시지 (선택)
                  </label>
                  <textarea
                    value={holidaySettings.holidayNote || ''}
                    onChange={(e) => handleHolidaySettingsChange({
                      ...holidaySettings,
                      holidayNote: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="예: 공휴일에는 오후 시간대만 상담 가능합니다."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    공휴일 예약 시 고객에게 표시될 안내 메시지입니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-800">
          <strong>💡 팁:</strong> 각 요일에 여러 시간대를 추가할 수 있습니다.
          예: 오전 9시-12시, 오후 2시-6시
        </p>
      </div>
    </div>
  );
}
