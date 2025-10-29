'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import CategorySelector from './CategorySelector';
import {
  Heart,
  Video,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';

interface MatchingProfile {
  interestedCategories: string[];
  preferredConsultationType: string[];
  ageGroup: string;
  budgetRange: { min: number; max: number };
  consultationGoals: string;
  preferredTimes: string[];
}

interface UserMatchingPreferencesProps {
  onProfileChange?: (profile: { interestedCategories: any[]; preferredConsultationType: any[]; preferredTimes: any[] }) => void;
}

export default function UserMatchingPreferences({ onProfileChange }: UserMatchingPreferencesProps = {}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<MatchingProfile>({
    interestedCategories: [],
    preferredConsultationType: [],
    ageGroup: '',
    budgetRange: { min: 30000, max: 100000 },
    consultationGoals: '',
    preferredTimes: [],
  });

  useEffect(() => {
    loadMatchingProfile();
  }, []);

  useEffect(() => {
    // 매칭 프로필 데이터를 부모에게 전달
    onProfileChange?.({
      interestedCategories: profile.interestedCategories,
      preferredConsultationType: profile.preferredConsultationType,
      preferredTimes: profile.preferredTimes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadMatchingProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/matching-profile');

      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('매칭 프로필 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  return (
    <>
      {message && (
        <div className={`mb-6 rounded-xl border-2 p-4 flex items-start ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-300'
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* 기본 선호도 카드 */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            관심 상담 분야 <span className="text-red-500">*</span><span className="text-gray-500 text-sm font-normal ml-2">(최대 3개)</span>
          </h3>
          <p className="text-xs text-gray-500">
            선호도를 작성하면 맞춤 전문가를 추천받을 수 있습니다
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 관심 상담 분야 */}
          <div className="md:col-span-2">
            <CategorySelector
              selected={profile.interestedCategories}
              onChange={(categories) => setProfile({ ...profile, interestedCategories: categories })}
              maxSelection={3}
            />
          </div>
        </div>
      </div>

      {/* 시간 선호도 카드 */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          선호 상담 시간대
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 'morning', label: '오전', time: '09:00-12:00', icon: Sunrise, color: 'amber' },
            { value: 'afternoon', label: '오후', time: '12:00-18:00', icon: Sun, color: 'yellow' },
            { value: 'evening', label: '저녁', time: '18:00-22:00', icon: Sunset, color: 'orange' },
            { value: 'night', label: '밤', time: '22:00-24:00', icon: Moon, color: 'indigo' },
          ].map(({ value, label, time, icon: Icon, color }) => {
            const isSelected = profile.preferredTimes.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setProfile({
                      ...profile,
                      preferredTimes: profile.preferredTimes.filter(t => t !== value)
                    });
                  } else {
                    setProfile({
                      ...profile,
                      preferredTimes: [...profile.preferredTimes, value]
                    });
                  }
                }}
                className={`relative px-4 py-4 rounded-xl text-sm font-medium
                           transition-all border-2 ${
                  isSelected
                    ? color === 'amber' ? 'bg-amber-50 border-amber-300 shadow-md transform scale-105' :
                      color === 'yellow' ? 'bg-yellow-50 border-yellow-300 shadow-md transform scale-105' :
                      color === 'orange' ? 'bg-orange-50 border-orange-300 shadow-md transform scale-105' :
                      'bg-indigo-50 border-indigo-300 shadow-md transform scale-105'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${
                  isSelected
                    ? color === 'amber' ? 'text-amber-600' :
                      color === 'yellow' ? 'text-yellow-600' :
                      color === 'orange' ? 'text-orange-600' :
                      'text-indigo-600'
                    : 'text-gray-400'
                }`} />
                <div className={`font-bold ${
                  isSelected
                    ? color === 'amber' ? 'text-amber-900' :
                      color === 'yellow' ? 'text-yellow-900' :
                      color === 'orange' ? 'text-orange-900' :
                      'text-indigo-900'
                    : 'text-gray-900'
                }`}>
                  {label}
                </div>
                <div className={`text-xs mt-1 ${
                  isSelected
                    ? color === 'amber' ? 'text-amber-700' :
                      color === 'yellow' ? 'text-yellow-700' :
                      color === 'orange' ? 'text-orange-700' :
                      'text-indigo-700'
                    : 'text-gray-500'
                }`}>
                  {time}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className={`h-5 w-5 ${
                      color === 'amber' ? 'text-amber-600' :
                      color === 'yellow' ? 'text-yellow-600' :
                      color === 'orange' ? 'text-orange-600' :
                      'text-indigo-600'
                    }`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
