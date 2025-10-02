'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import ToggleSwitch from './ToggleSwitch';
import SaveButton from './SaveButton';
import { NotificationSettings as NotificationSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function NotificationSettings() {
  const [settings, setSettings] = useState<Partial<NotificationSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/notification');
      const settingsData: Partial<NotificationSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof NotificationSettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/notification', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingSection
        title="이메일 알림 설정"
        description="이메일 알림 서비스 설정"
      >
        <ToggleSwitch
          label="이메일 알림 활성화"
          checked={settings.enableEmailNotifications !== false}
          onChange={(checked) => updateSetting('enableEmailNotifications', checked)}
          description="사용자에게 이메일 알림을 발송합니다"
        />

        {settings.enableEmailNotifications !== false && (
          <>
            <InputField
              label="SMTP 호스트"
              value={settings.smtpHost || ''}
              onChange={(value) => updateSetting('smtpHost', value)}
              placeholder="smtp.gmail.com"
            />

            <InputField
              label="SMTP 포트"
              type="number"
              value={settings.smtpPort || 587}
              onChange={(value) => updateSetting('smtpPort', parseInt(value))}
            />

            <InputField
              label="발신자 이메일"
              type="email"
              value={settings.emailFrom || ''}
              onChange={(value) => updateSetting('emailFrom', value)}
              placeholder="noreply@consulton.com"
            />

            <InputField
              label="발신자 이름"
              value={settings.emailFromName || ''}
              onChange={(value) => updateSetting('emailFromName', value)}
              placeholder="Consult On"
            />
          </>
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="푸시 알림 설정"
        description="모바일 및 웹 푸시 알림 설정"
      >
        <ToggleSwitch
          label="푸시 알림 활성화"
          checked={settings.enablePushNotifications !== false}
          onChange={(checked) => updateSetting('enablePushNotifications', checked)}
          description="사용자에게 푸시 알림을 발송합니다"
        />

        {settings.enablePushNotifications !== false && (
          <>
            <InputField
              label="Firebase 서버 키"
              type="password"
              value={settings.firebaseServerKey || ''}
              onChange={(value) => updateSetting('firebaseServerKey', value)}
              placeholder="AAAA****************"
              helpText="Firebase Cloud Messaging 서버 키"
            />

            <InputField
              label="Firebase 프로젝트 ID"
              value={settings.firebaseProjectId || ''}
              onChange={(value) => updateSetting('firebaseProjectId', value)}
              placeholder="consulton-12345"
            />
          </>
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="알림 유형별 설정"
        description="각 알림 유형의 활성화 여부"
      >
        <div className="space-y-3">
          <ToggleSwitch
            label="새 상담 요청 알림"
            checked={settings.notifyNewConsultation !== false}
            onChange={(checked) => updateSetting('notifyNewConsultation', checked)}
          />

          <ToggleSwitch
            label="상담 완료 알림"
            checked={settings.notifyConsultationComplete !== false}
            onChange={(checked) => updateSetting('notifyConsultationComplete', checked)}
          />

          <ToggleSwitch
            label="결제 완료 알림"
            checked={settings.notifyPaymentComplete !== false}
            onChange={(checked) => updateSetting('notifyPaymentComplete', checked)}
          />

          <ToggleSwitch
            label="환불 처리 알림"
            checked={settings.notifyRefund !== false}
            onChange={(checked) => updateSetting('notifyRefund', checked)}
          />

          <ToggleSwitch
            label="전문가 승인 알림"
            checked={settings.notifyExpertApproval !== false}
            onChange={(checked) => updateSetting('notifyExpertApproval', checked)}
          />

          <ToggleSwitch
            label="리뷰 작성 알림"
            checked={settings.notifyNewReview !== false}
            onChange={(checked) => updateSetting('notifyNewReview', checked)}
          />
        </div>

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="알림 보관 정책"
        description="알림 기록 보관 기간 설정"
      >
        <InputField
          label="알림 보관 기간"
          type="number"
          value={settings.notificationRetentionDays || 30}
          onChange={(value) => updateSetting('notificationRetentionDays', parseInt(value))}
          suffix="일"
          min={1}
          max={365}
          helpText="알림 기록을 보관할 기간"
        />

        <ToggleSwitch
          label="자동 삭제"
          checked={settings.autoDeleteOldNotifications !== false}
          onChange={(checked) => updateSetting('autoDeleteOldNotifications', checked)}
          description="보관 기간이 지난 알림을 자동으로 삭제합니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
