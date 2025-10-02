'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import SelectField from './SelectField';
import ToggleSwitch from './ToggleSwitch';
import TextareaField from './TextareaField';
import SaveButton from './SaveButton';
import { GeneralSettings as GeneralSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function GeneralSettings() {
  const [settings, setSettings] = useState<Partial<GeneralSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/general');

      // Convert API response to settings object
      const settingsData: Partial<GeneralSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof GeneralSettingsType] = setting.value;
      });

      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load general settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/general', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof GeneralSettingsType>(
    key: K,
    value: GeneralSettingsType[K]
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
      {/* Platform Information */}
      <SettingSection
        title="플랫폼 정보"
        description="기본 플랫폼 정보를 설정합니다"
      >
        <InputField
          label="플랫폼 이름"
          value={settings.platformName || ''}
          onChange={(value) => updateSetting('platformName', value)}
          placeholder="Consult On"
          required
        />

        <InputField
          label="플랫폼 태그라인"
          value={settings.platformTagline || ''}
          onChange={(value) => updateSetting('platformTagline', value)}
          placeholder="전문가 상담 플랫폼"
        />

        <InputField
          label="고객 지원 이메일"
          type="email"
          value={settings.contactEmail || ''}
          onChange={(value) => updateSetting('contactEmail', value)}
          placeholder="support@consulton.com"
          required
        />

        <InputField
          label="고객 지원 전화"
          type="tel"
          value={settings.supportPhone || ''}
          onChange={(value) => updateSetting('supportPhone', value)}
          placeholder="+82-10-xxxx-xxxx"
        />

        <TextareaField
          label="사업자 주소"
          value={settings.businessAddress || ''}
          onChange={(value) => updateSetting('businessAddress', value)}
          rows={2}
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      {/* System Configuration */}
      <SettingSection
        title="시스템 설정"
        description="고급 시스템 설정을 관리합니다"
      >
        <SelectField
          label="시간대"
          value={settings.timezone || 'Asia/Seoul'}
          onChange={(value) => updateSetting('timezone', value)}
          options={[
            { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
            { value: 'America/New_York', label: 'America/New_York (EST)' },
            { value: 'Europe/London', label: 'Europe/London (GMT)' },
            { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
          ]}
        />

        <SelectField
          label="기본 언어"
          value={settings.defaultLanguage || 'ko'}
          onChange={(value) => updateSetting('defaultLanguage', value)}
          options={[
            { value: 'ko', label: '한국어 (Korean)' },
            { value: 'en', label: 'English' },
          ]}
        />

        <ToggleSwitch
          label="유지보수 모드"
          checked={settings.maintenanceMode || false}
          onChange={(checked) => updateSetting('maintenanceMode', checked)}
          description="활성화 시 사용자의 플랫폼 접근을 차단합니다"
        />

        {settings.maintenanceMode && (
          <TextareaField
            label="유지보수 메시지"
            value={settings.maintenanceMessage || ''}
            onChange={(value) => updateSetting('maintenanceMessage', value)}
            placeholder="시스템 점검 중입니다. 잠시 후 다시 시도해주세요."
            rows={3}
          />
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      {/* File Upload Settings */}
      <SettingSection
        title="파일 업로드 설정"
        description="파일 업로드 제한을 설정합니다"
      >
        <InputField
          label="최대 업로드 크기"
          type="number"
          value={settings.maxUploadSize || 10}
          onChange={(value) => updateSetting('maxUploadSize', parseInt(value))}
          suffix="MB"
          min={1}
          max={100}
          helpText="최대 파일 업로드 크기 (메가바이트)"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            허용된 파일 형식
          </label>
          <div className="flex flex-wrap gap-2">
            {['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  const current = settings.allowedFileTypes || [];
                  if (current.includes(type)) {
                    updateSetting('allowedFileTypes', current.filter(t => t !== type));
                  } else {
                    updateSetting('allowedFileTypes', [...current, type]);
                  }
                }}
                className={`
                  px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${(settings.allowedFileTypes || []).includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
