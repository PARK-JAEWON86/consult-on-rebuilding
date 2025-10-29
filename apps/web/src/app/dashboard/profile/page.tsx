'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import UserMatchingPreferences from '@/components/profile/matching/UserMatchingPreferences';
import ProfileCompletionModal from '@/components/profile/ProfileCompletionModal';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import {
  User,
  Mail,
  Phone,
  Save,
  Camera,
  Star,
  Award,
  Clock,
  DollarSign,
  FileText,
  BookOpen,
  Target,
  Search,
  HelpCircle,
  MapPin,
  Gift,
  CheckCircle,
  Brain,
  Calendar,
  MessageSquare,
  Video
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // 완성 모달
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewardData, setRewardData] = useState({ amount: 0, newBalance: 0 });
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);

  // 기본 프로필 설정 (사용자 공통)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    bio: (user as any)?.bio || '',
    location: (user as any)?.location || '',
    birthDate: (user as any)?.birthDate || '',
    avatarUrl: user?.avatarUrl || '',
    ageGroup: (user as any)?.ageGroup || '',
    mbti: (user as any)?.mbti || '',
  });

  // 매칭 프로필 데이터
  const [matchingProfile, setMatchingProfile] = useState<{
    interestedCategories: any[];
    preferredConsultationType: any[];
    preferredTimes: any[];
  }>({
    interestedCategories: [],
    preferredConsultationType: [],
    preferredTimes: [],
  });

  // user 정보가 로드되면 프로필 데이터 자동 기입
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: (user as any)?.phone || prev.phone,
        bio: (user as any)?.bio || prev.bio,
        location: (user as any)?.location || prev.location,
        birthDate: (user as any)?.birthDate || prev.birthDate,
        avatarUrl: user.avatarUrl || prev.avatarUrl,
        ageGroup: (user as any)?.ageGroup || prev.ageGroup,
        mbti: (user as any)?.mbti || prev.mbti,
      }));
    }
  }, [user]);

  // 완성도 계산
  useEffect(() => {
    const completion = calculateProfileCompletion({
      name: profileData.name,
      bio: profileData.bio,
      ageGroup: profileData.ageGroup,
      mbti: (profileData as any).mbti,
      interestedCategories: matchingProfile.interestedCategories,
      preferredConsultationType: matchingProfile.preferredConsultationType,
      preferredTimes: matchingProfile.preferredTimes,
    });
    setCompletionPercentage(completion);
  }, [profileData, matchingProfile]);

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

  const handleClaimReward = async () => {
    if (rewardClaimed || claimingReward) return;

    setClaimingReward(true);
    try {
      const rewardResponse: any = await api.post('/users/claim-profile-reward', {});
      if (rewardResponse.success) {
        setRewardData({
          amount: rewardResponse.amount || 300,
          newBalance: rewardResponse.newBalance || 0,
        });
        setRewardClaimed(true);
        setShowCompletionModal(true);
      }
    } catch (rewardError: any) {
      // 이미 지급받은 경우
      if (rewardError?.message?.includes('이미 지급')) {
        setRewardClaimed(true);
        setMessage({ type: 'error', text: '이미 보상을 받으셨습니다.' });
      } else {
        setMessage({ type: 'error', text: '보상 받기에 실패했습니다.' });
      }
    } finally {
      setClaimingReward(false);
    }
  };

  const handlePhotoUploadComplete = (photoUrl: string) => {
    setProfileData({ ...profileData, avatarUrl: photoUrl });
    setMessage({ type: 'success', text: '프로필 사진이 업데이트되었습니다!' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      {/* 헤더 */}
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

      {viewMode === 'user' ? (
        /* 사용자 모드 - 새로운 좌우 배치 레이아웃 */
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* 프로필 카드 (통합) */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* 좌측: 프로필 이미지 */}
                <div className="flex-shrink-0 mx-auto md:mx-0 w-full md:w-auto">
                  <PhotoUpload
                    currentPhoto={profileData.avatarUrl}
                    userName={profileData.name}
                    onUploadComplete={handlePhotoUploadComplete}
                  />
                </div>

                {/* 우측: 모든 정보 */}
                <div className="flex-1 min-w-0 w-full space-y-4">
                  {/* 이름과 배지 */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{profileData.name || '이름 없음'}</h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <User className="w-4 h-4 mr-1" />
                      사용자
                    </span>
                  </div>

                  {/* 기본 정보 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        이메일
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        disabled
                      />
                    </div>
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
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Brain className="w-4 h-4 inline mr-2" />
                        MBTI
                      </label>
                      <select
                        value={(profileData as any).mbti || ''}
                        onChange={(e) => setProfileData({ ...profileData, mbti: e.target.value } as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="ISTJ">ISTJ</option>
                        <option value="ISFJ">ISFJ</option>
                        <option value="INFJ">INFJ</option>
                        <option value="INTJ">INTJ</option>
                        <option value="ISTP">ISTP</option>
                        <option value="ISFP">ISFP</option>
                        <option value="INFP">INFP</option>
                        <option value="INTP">INTP</option>
                        <option value="ESTP">ESTP</option>
                        <option value="ESFP">ESFP</option>
                        <option value="ENFP">ENFP</option>
                        <option value="ENTP">ENTP</option>
                        <option value="ESTJ">ESTJ</option>
                        <option value="ESFJ">ESFJ</option>
                        <option value="ENFJ">ENFJ</option>
                        <option value="ENTJ">ENTJ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        연령대
                      </label>
                      <select
                        value={(profileData as any).ageGroup || ''}
                        onChange={(e) => setProfileData({ ...profileData, ageGroup: e.target.value } as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="teen">10대</option>
                        <option value="twenties">20대</option>
                        <option value="thirties">30대</option>
                        <option value="forties">40대</option>
                        <option value="fifties">50대</option>
                        <option value="sixties">60대 이상</option>
                      </select>
                    </div>
                  </div>

                  {/* 자기소개 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      자기소개
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="간단한 자기소개를 작성해주세요"
                    />
                  </div>

                  {/* 선호 상담 방식 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Video className="w-4 h-4 inline mr-2" />
                      선호 상담 방식 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { value: 'video', label: '화상 상담', icon: Video, color: 'blue' },
                        { value: 'voice', label: '음성 상담', icon: Phone, color: 'orange' },
                        { value: 'chat', label: '채팅 상담', icon: MessageSquare, color: 'green' },
                      ].map(({ value, label, icon: Icon, color }) => {
                        const isSelected = matchingProfile.preferredConsultationType.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setMatchingProfile({
                                  ...matchingProfile,
                                  preferredConsultationType: matchingProfile.preferredConsultationType.filter(t => t !== value)
                                });
                              } else {
                                setMatchingProfile({
                                  ...matchingProfile,
                                  preferredConsultationType: [...matchingProfile.preferredConsultationType, value]
                                });
                              }
                            }}
                            className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium
                                       transition-all border-2 ${
                              isSelected
                                ? color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' :
                                  color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-sm' :
                                  'bg-green-50 text-green-700 border-green-300 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-5 w-5 mr-2" />
                            {label}
                            {isSelected && <CheckCircle className="h-5 w-5 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 사용자 매칭 프로필 */}
            <UserMatchingPreferences
              onProfileChange={(profile) => setMatchingProfile(profile)}
            />
          </div>

          {/* 사이드바 */}
          <aside className="w-full lg:w-72 space-y-6">
            {/* 완성도 위젯 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
              <div className="text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">프로필 완성도</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {completionPercentage}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                {completionPercentage === 100 ? (
                  <div className="mt-3">
                    {!rewardClaimed ? (
                      <button
                        onClick={handleClaimReward}
                        disabled={claimingReward}
                        className="w-full p-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 font-semibold shadow-md transition-all flex items-center justify-center"
                      >
                        {claimingReward ? (
                          '받는 중...'
                        ) : (
                          <>
                            <Gift className="w-5 h-5 mr-2" />
                            300 크레딧 보상 받기
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 text-center flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          보상 받기 완료
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 mt-2">
                    {completionPercentage < 25 && "프로필을 작성해주세요"}
                    {completionPercentage >= 25 && completionPercentage < 50 && "좋아요! 계속 작성해주세요"}
                    {completionPercentage >= 50 && completionPercentage < 80 && "잘하고 계세요!"}
                    {completionPercentage >= 80 && "거의 다 왔어요! 100% 달성 시 300 크레딧 지급"}
                  </p>
                )}
              </div>
            </div>

            {/* 액션 버튼 영역 */}
            <div className="space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? '저장 중...' : '프로필 저장'}
              </button>

              <button
                onClick={() => router.push('/experts')}
                disabled={completionPercentage < 25}
                className="w-full flex items-center justify-center px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                맞춤 전문가 찾기
              </button>

              {completionPercentage < 25 && (
                <p className="text-xs text-gray-500 text-center">
                  💡 최소 25% 이상 작성해야 전문가를 찾을 수 있습니다
                </p>
              )}
            </div>

            {/* 도움말 카드 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 mr-2" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    프로필 작성 팁
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1.5">
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>이름과 자기소개를 작성하세요</span>
                    </li>
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>MBTI와 연령대를 선택하세요</span>
                    </li>
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>관심 상담 분야를 최대 3개 선택하세요</span>
                    </li>
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>선호하는 상담 방식을 선택하세요</span>
                    </li>
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>선호 상담 시간대를 지정하세요</span>
                    </li>
                    <li className="flex items-start -ml-0">
                      <span className="text-blue-600 mr-1.5">•</span>
                      <span>100% 완성 시 300 크레딧을 받으세요!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* 전문가 모드 - 기존 레이아웃 유지 */
        <div className="space-y-6">
          {/* 프로필 이미지 섹션 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">프로필 사진</h2>
            <PhotoUpload
              currentPhoto={profileData.avatarUrl}
              userName={profileData.name}
              onUploadComplete={handlePhotoUploadComplete}
            />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                자기소개
              </label>
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
      )}

      {/* 프로필 완성 모달 */}
      <ProfileCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        creditAmount={rewardData.amount}
        newBalance={rewardData.newBalance}
      />
    </div>
  );
}
