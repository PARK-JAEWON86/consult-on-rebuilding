'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Camera,
  Star,
  Award,
  Clock,
  DollarSign,
  FileText,
  BookOpen
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 기본 프로필 설정 (사용자 공통)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    birthDate: user?.birthDate || '',
    avatarUrl: user?.avatarUrl || '',
  });

  // 전문가 전용 프로필 설정
  const [expertProfile, setExpertProfile] = useState({
    specialty: '',
    experience: '',
    education: '',
    certifications: '',
    languages: ['한국어'],
    hourlyRate: 50000,
    consultationTypes: ['video', 'voice', 'chat'],
    achievements: '',
    workingHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'Asia/Seoul'
    }
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'expert' ? '/api/v1/experts/profile' : '/api/v1/users/profile';
      const data = viewMode === 'expert' ? { ...profileData, ...expertProfile } : profileData;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '프로필이 성공적으로 업데이트되었습니다.' });
      } else {
        throw new Error('프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '프로필 업데이트 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 업로드 로직 구현
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({ ...profileData, avatarUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === 'expert' ? '전문가 프로필' : '프로필'}
          </h1>
          <p className="mt-2 text-gray-600">
            {viewMode === 'expert'
              ? '전문가 프로필 정보를 관리하고 클라이언트에게 보여질 정보를 설정하세요'
              : '개인 프로필 정보를 관리하세요'
            }
          </p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* 프로필 이미지 섹션 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">프로필 사진</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {profileData.avatarUrl ? (
                    <img
                      src={profileData.avatarUrl}
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-2xl">
                      {(profileData.name || profileData.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{profileData.name || '이름 없음'}</h3>
                <p className="text-gray-500">{profileData.email}</p>
                {viewMode === 'expert' && (
                  <p className="text-blue-600 font-medium">{expertProfile.specialty || '전문 분야 미설정'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 기본 정보 섹션 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  이름
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  이메일
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  전화번호
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  위치
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={viewMode === 'expert' ? '전문 분야, 경력, 상담 스타일 등을 간단히 소개해주세요' : '간단한 자기소개를 작성해주세요'}
              />
            </div>
          </div>

          {/* 전문가 전용 정보 섹션 */}
          {viewMode === 'expert' && (
            <>
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">전문가 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Award className="w-4 h-4 inline mr-2" />
                      전문 분야
                    </label>
                    <input
                      type="text"
                      value={expertProfile.specialty}
                      onChange={(e) => setExpertProfile({ ...expertProfile, specialty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 심리상담, 법률자문, 재무설계"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      경력 (연)
                    </label>
                    <input
                      type="number"
                      value={expertProfile.experience}
                      onChange={(e) => setExpertProfile({ ...expertProfile, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      시간당 상담료 (원)
                    </label>
                    <input
                      type="number"
                      value={expertProfile.hourlyRate}
                      onChange={(e) => setExpertProfile({ ...expertProfile, hourlyRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상담 가능 언어</label>
                    <input
                      type="text"
                      value={expertProfile.languages.join(', ')}
                      onChange={(e) => setExpertProfile({
                        ...expertProfile,
                        languages: e.target.value.split(',').map(lang => lang.trim())
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="한국어, 영어"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    학력 및 교육
                  </label>
                  <textarea
                    value={expertProfile.education}
                    onChange={(e) => setExpertProfile({ ...expertProfile, education: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="학력, 전공, 추가 교육 과정 등을 입력해주세요"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    자격증 및 인증
                  </label>
                  <textarea
                    value={expertProfile.certifications}
                    onChange={(e) => setExpertProfile({ ...expertProfile, certifications: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="관련 자격증, 인증서, 면허 등을 입력해주세요"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Star className="w-4 h-4 inline mr-2" />
                    주요 성과 및 경력사항
                  </label>
                  <textarea
                    value={expertProfile.achievements}
                    onChange={(e) => setExpertProfile({ ...expertProfile, achievements: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="주요 프로젝트, 수상 경력, 출간 도서 등을 입력해주세요"
                  />
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">상담 방식</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expertProfile.consultationTypes.includes('video')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: [...expertProfile.consultationTypes, 'video']
                          });
                        } else {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: expertProfile.consultationTypes.filter(type => type !== 'video')
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">화상 상담</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expertProfile.consultationTypes.includes('voice')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: [...expertProfile.consultationTypes, 'voice']
                          });
                        } else {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: expertProfile.consultationTypes.filter(type => type !== 'voice')
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">음성 상담</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expertProfile.consultationTypes.includes('chat')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: [...expertProfile.consultationTypes, 'chat']
                          });
                        } else {
                          setExpertProfile({
                            ...expertProfile,
                            consultationTypes: expertProfile.consultationTypes.filter(type => type !== 'chat')
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">채팅 상담</label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 저장 버튼 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}