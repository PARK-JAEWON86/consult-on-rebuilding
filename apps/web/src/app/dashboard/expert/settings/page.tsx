'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Bell,
  Lock,
  Eye,
  Save,
  AlertCircle,
  DollarSign,
  Shield
} from 'lucide-react';

export default function ExpertSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);



  // 알림 설정
  const [notificationSettings, setNotificationSettings] = useState({
    newBookingRequests: true,
    bookingConfirmations: true,
    cancellations: true,
    paymentNotifications: true,
    reviewNotifications: true,
    systemUpdates: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  // 개인정보 및 공개 설정
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showPersonalInfo: true,
    allowSearchEngines: true,
    showReviews: true,
    showRating: true,
  });

  // 정산 설정
  const [payoutSettings, setPayoutSettings] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    taxId: '',
    payoutSchedule: 'weekly',
    minimumPayout: 50000,
  });

  // 비밀번호 변경
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });



  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // API 호출
      setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: '알림 설정 저장 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setLoading(true);
    try {
      // API 호출
      setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'notifications', name: '알림', icon: Bell },
    { id: 'privacy', name: '공개 설정', icon: Eye },
    { id: 'payout', name: '정산', icon: DollarSign },
    { id: 'security', name: '보안', icon: Lock },
    { id: 'account', name: '계정 관리', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전문가 설정</h1>
          <p className="mt-2 text-gray-600">전문가 프로필 및 상담 설정을 관리하세요</p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 md:space-x-8 px-3 md:px-6 overflow-x-auto" aria-label="탭">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center md:justify-start py-4 px-2 md:px-1 border-b-2 font-medium text-sm whitespace-nowrap min-w-[44px] md:min-w-0 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={tab.name}
                  >
                    <Icon className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">


            {/* 알림 탭 */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">알림 설정</h3>
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {key === 'newBookingRequests' && '새 예약 요청'}
                            {key === 'bookingConfirmations' && '예약 확정'}
                            {key === 'cancellations' && '예약 취소'}
                            {key === 'paymentNotifications' && '결제 알림'}
                            {key === 'reviewNotifications' && '리뷰 알림'}
                            {key === 'systemUpdates' && '시스템 업데이트'}
                            {key === 'emailNotifications' && '이메일 알림'}
                            {key === 'pushNotifications' && '푸시 알림'}
                            {key === 'smsNotifications' && 'SMS 알림'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {key === 'newBookingRequests' && '새로운 상담 예약 요청을 받을 때'}
                            {key === 'bookingConfirmations' && '예약이 확정될 때'}
                            {key === 'cancellations' && '예약이 취소될 때'}
                            {key === 'paymentNotifications' && '결제 관련 알림'}
                            {key === 'reviewNotifications' && '새로운 리뷰가 등록될 때'}
                            {key === 'systemUpdates' && '시스템 업데이트 및 공지사항'}
                            {key === 'emailNotifications' && '중요한 알림을 이메일로 받습니다'}
                            {key === 'pushNotifications' && '브라우저 푸시 알림을 받습니다'}
                            {key === 'smsNotifications' && 'SMS로 알림을 받습니다'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 공개 설정 탭 */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">프로필 공개 설정</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">프로필 공개 범위</label>
                      <select
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          profileVisibility: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="public">전체 공개</option>
                        <option value="members">회원만 공개</option>
                        <option value="private">비공개</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">리뷰 표시</label>
                        <input
                          type="checkbox"
                          checked={privacySettings.showReviews}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            showReviews: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">평점 표시</label>
                        <input
                          type="checkbox"
                          checked={privacySettings.showRating}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            showRating: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">개인정보 표시</label>
                        <input
                          type="checkbox"
                          checked={privacySettings.showPersonalInfo}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            showPersonalInfo: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">검색엔진 노출 허용</label>
                        <input
                          type="checkbox"
                          checked={privacySettings.allowSearchEngines}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            allowSearchEngines: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 정산 탭 */}
            {activeTab === 'payout' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">정산 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                      <input
                        type="text"
                        value={payoutSettings.bankName}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="KB국민은행"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                      <input
                        type="text"
                        value={payoutSettings.accountNumber}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, accountNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123-456-789012"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">예금주</label>
                      <input
                        type="text"
                        value={payoutSettings.accountHolder}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, accountHolder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">정산 주기</label>
                      <select
                        value={payoutSettings.payoutSchedule}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, payoutSchedule: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="biweekly">격주</option>
                        <option value="monthly">매월</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">최소 정산 금액 (원)</label>
                    <input
                      type="number"
                      value={payoutSettings.minimumPayout}
                      onChange={(e) => setPayoutSettings({ ...payoutSettings, minimumPayout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 보안 탭 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {loading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 계정 관리 탭 */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">전문가 계정 관리</h3>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">전문가 계정 비활성화</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            일시적으로 전문가 활동을 중단합니다. 프로필이 숨겨지고 새로운 예약을 받지 않습니다.
                          </p>
                          <button className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">
                            계정 비활성화
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800">전문가 계정 삭제</h4>
                          <p className="text-sm text-red-700 mt-1">
                            전문가 계정을 삭제하면 모든 전문가 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                            진행 중인 상담이 있는 경우 완료 후 삭제하시기 바랍니다.
                          </p>
                          <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                            전문가 계정 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}