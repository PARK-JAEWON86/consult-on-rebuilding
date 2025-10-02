'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import ToggleSwitch from './ToggleSwitch';
import TextareaField from './TextareaField';
import SaveButton from './SaveButton';
import { SecuritySettings as SecuritySettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function SecuritySettings() {
  const [settings, setSettings] = useState<Partial<SecuritySettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/security');
      const settingsData: Partial<SecuritySettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof SecuritySettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/security', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SecuritySettingsType>(
    key: K,
    value: SecuritySettingsType[K]
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
        title="인증 보안 설정"
        description="로그인 및 세션 보안 정책"
        alert={{
          type: 'warning',
          message: '보안 설정 변경 시 모든 사용자가 영향을 받을 수 있습니다'
        }}
      >
        <InputField
          label="세션 타임아웃"
          type="number"
          value={settings.sessionTimeoutMinutes || 60}
          onChange={(value) => updateSetting('sessionTimeoutMinutes', parseInt(value))}
          suffix="분"
          min={5}
          max={1440}
          helpText="사용자 세션 만료 시간"
        />

        <InputField
          label="최소 비밀번호 길이"
          type="number"
          value={settings.passwordMinLength || 8}
          onChange={(value) => updateSetting('passwordMinLength', parseInt(value))}
          suffix="자"
          min={6}
          max={32}
        />

        <ToggleSwitch
          label="비밀번호 복잡도 요구"
          checked={settings.passwordRequireComplex !== false}
          onChange={(checked) => updateSetting('passwordRequireComplex', checked)}
          description="대문자, 소문자, 숫자, 특수문자 조합 필수"
        />

        <InputField
          label="로그인 실패 제한"
          type="number"
          value={settings.maxLoginAttempts || 5}
          onChange={(value) => updateSetting('maxLoginAttempts', parseInt(value))}
          suffix="회"
          min={3}
          max={10}
          helpText="계정 잠금 전 최대 로그인 시도 횟수"
        />

        <InputField
          label="계정 잠금 시간"
          type="number"
          value={settings.accountLockoutMinutes || 30}
          onChange={(value) => updateSetting('accountLockoutMinutes', parseInt(value))}
          suffix="분"
          min={5}
          max={1440}
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="2단계 인증 (2FA)"
        description="이중 인증 보안 설정"
      >
        <ToggleSwitch
          label="2단계 인증 활성화"
          checked={settings.enable2fa !== false}
          onChange={(checked) => updateSetting('enable2fa', checked)}
          description="사용자가 2단계 인증을 설정할 수 있습니다"
        />

        {settings.enable2fa !== false && (
          <>
            <ToggleSwitch
              label="관리자 2FA 필수"
              checked={settings.require2faForAdmins !== false}
              onChange={(checked) => updateSetting('require2faForAdmins', checked)}
              description="관리자 계정은 2단계 인증을 필수로 설정"
            />

            <ToggleSwitch
              label="전문가 2FA 권장"
              checked={settings.recommend2faForExperts !== false}
              onChange={(checked) => updateSetting('recommend2faForExperts', checked)}
              description="전문가 계정에 2단계 인증을 권장"
            />
          </>
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="접근 제어"
        description="IP 화이트리스트 및 접근 제한"
      >
        <ToggleSwitch
          label="IP 화이트리스트 활성화"
          checked={settings.enableIpWhitelist || false}
          onChange={(checked) => updateSetting('enableIpWhitelist', checked)}
          description="관리자 페이지 접근을 특정 IP로 제한"
        />

        {settings.enableIpWhitelist && (
          <TextareaField
            label="허용된 IP 주소"
            value={settings.allowedIpAddresses?.join('\n') || ''}
            onChange={(value) => updateSetting('allowedIpAddresses', value.split('\n').filter(ip => ip.trim()))}
            placeholder="192.168.1.1&#10;10.0.0.1"
            rows={5}
            helpText="한 줄에 하나씩 IP 주소를 입력하세요"
          />
        )}

        <InputField
          label="API 요청 제한"
          type="number"
          value={settings.rateLimitPerMinute || 60}
          onChange={(value) => updateSetting('rateLimitPerMinute', parseInt(value))}
          suffix="회/분"
          min={10}
          max={1000}
          helpText="분당 최대 API 요청 횟수"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="감사 로그"
        description="시스템 활동 기록 및 모니터링"
      >
        <ToggleSwitch
          label="감사 로그 활성화"
          checked={settings.enableAuditLogging !== false}
          onChange={(checked) => updateSetting('enableAuditLogging', checked)}
          description="모든 중요한 시스템 활동을 기록합니다"
        />

        {settings.enableAuditLogging !== false && (
          <>
            <InputField
              label="로그 보관 기간"
              type="number"
              value={settings.auditLogRetentionDays || 90}
              onChange={(value) => updateSetting('auditLogRetentionDays', parseInt(value))}
              suffix="일"
              min={30}
              max={365}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                기록 대상 활동
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>관리자 로그인/로그아웃</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>설정 변경</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>사용자 권한 변경</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>데이터 삭제</span>
                </div>
              </div>
            </div>
          </>
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="데이터 보호"
        description="개인정보 및 민감 데이터 보호 설정"
      >
        <ToggleSwitch
          label="민감 데이터 암호화"
          checked={settings.encryptSensitiveData !== false}
          onChange={(checked) => updateSetting('encryptSensitiveData', checked)}
          description="데이터베이스에 저장되는 민감 정보를 암호화"
        />

        <ToggleSwitch
          label="자동 백업"
          checked={settings.enableAutoBackup !== false}
          onChange={(checked) => updateSetting('enableAutoBackup', checked)}
          description="정기적으로 데이터베이스를 자동 백업"
        />

        {settings.enableAutoBackup !== false && (
          <InputField
            label="백업 주기"
            type="number"
            value={settings.backupFrequencyHours || 24}
            onChange={(value) => updateSetting('backupFrequencyHours', parseInt(value))}
            suffix="시간"
            min={1}
            max={168}
          />
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
