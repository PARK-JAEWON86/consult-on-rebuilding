'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import AvailabilityScheduleEditor, { AvailabilitySlot, HolidaySettings } from './AvailabilityScheduleEditor';
import { api } from '@/lib/api';

interface AvailabilitySettingsProps {
  displayId: string;
}

export default function AvailabilitySettings({ displayId }: AvailabilitySettingsProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [holidaySettings, setHolidaySettings] = useState<HolidaySettings>({
    acceptHolidayConsultations: false,
    holidayNote: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [displayId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/experts/${displayId}/availability`);

      if (response.success && response.data) {
        setSlots(response.data.slots || response.data);
        if (response.data.holidaySettings) {
          setHolidaySettings(response.data.holidaySettings);
        }
      }
    } catch (error: any) {
      console.error('예약 가능 시간 로드 실패:', error);
      // 로드 실패 시 빈 배열로 시작
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await api.put(`/experts/${displayId}/availability`, {
        slots,
        holidaySettings
      });

      if (response.success) {
        setMessage({ type: 'success', text: '예약 가능 시간이 성공적으로 저장되었습니다.' });
        // 저장 후 데이터 새로고침
        await loadAvailability();
      } else {
        throw new Error(response.error?.message || '저장 실패');
      }
    } catch (error: any) {
      console.error('예약 가능 시간 저장 실패:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || '예약 가능 시간 저장 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">예약 가능 시간 로드 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <AvailabilityScheduleEditor
        initialSlots={slots}
        initialHolidaySettings={holidaySettings}
        onChange={(newSlots, newHolidaySettings) => {
          setSlots(newSlots);
          setHolidaySettings(newHolidaySettings);
        }}
      />

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>저장</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
