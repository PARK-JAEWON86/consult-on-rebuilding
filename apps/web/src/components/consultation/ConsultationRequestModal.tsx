"use client";

import { useState } from 'react';
import { X, Calendar, Clock, MessageCircle, Video, Phone } from 'lucide-react';
import { ConsultationType } from '@/types';

export interface ConsultationRequestData {
  consultationType: ConsultationType;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  topic: string;
  note: string;
}

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  expertName: string;
  expertSpecialty: string;
  expertConsultationTypes: ConsultationType[];
  onSubmit: (data: ConsultationRequestData) => void;
}

export default function ConsultationRequestModal({
  isOpen,
  onClose,
  expertName,
  expertSpecialty,
  expertConsultationTypes,
  onSubmit
}: ConsultationRequestModalProps) {
  const [formData, setFormData] = useState<ConsultationRequestData>({
    consultationType: expertConsultationTypes[0] || 'video',
    preferredDate: '',
    preferredTime: '',
    duration: 60,
    topic: '',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getTypeIcon = (type: ConsultationType) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ConsultationType) => {
    switch (type) {
      case 'video':
        return '화상 상담';
      case 'voice':
        return '음성 상담';
      case 'chat':
        return '채팅 상담';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">상담 신청</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{expertName} 전문가</h3>
            <p className="text-sm text-gray-600">{expertSpecialty} 전문가와의 상담을 신청합니다.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              상담 방식
            </label>
            <div className="space-y-2">
              {expertConsultationTypes.map((type) => (
                <label key={type} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="consultationType"
                    value={type}
                    checked={formData.consultationType === type}
                    onChange={(e) => setFormData({ ...formData, consultationType: e.target.value as ConsultationType })}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    {getTypeIcon(type)}
                    <span className="ml-2">{getTypeLabel(type)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망 날짜
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망 시간
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 시간
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30분</option>
              <option value={60}>60분</option>
              <option value={90}>90분</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 주제
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="상담받고 싶은 주제를 간단히 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 요청사항
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="전문가에게 미리 알리고 싶은 내용이 있다면 입력해주세요 (선택사항)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              신청하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}