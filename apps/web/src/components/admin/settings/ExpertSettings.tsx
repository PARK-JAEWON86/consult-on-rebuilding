'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import ToggleSwitch from './ToggleSwitch';
import SaveButton from './SaveButton';
import { ExpertSettings as ExpertSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function ExpertSettings() {
  const [settings, setSettings] = useState<Partial<ExpertSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/expert');
      const settingsData: Partial<ExpertSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof ExpertSettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load expert settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/expert', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof ExpertSettingsType>(
    key: K,
    value: ExpertSettingsType[K]
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
        title="전문가 지원 설정"
        description="전문가 지원 승인 규칙을 설정합니다"
        alert={{
          type: 'warning',
          message: '자동 승인을 활성화하면 모든 지원서가 검토 없이 자동으로 승인됩니다'
        }}
      >
        <ToggleSwitch
          label="지원서 자동 승인"
          checked={settings.autoApproveApplications || false}
          onChange={(checked) => updateSetting('autoApproveApplications', checked)}
        />

        <InputField
          label="최소 경력 년수"
          type="number"
          value={settings.minExperienceYears || 1}
          onChange={(value) => updateSetting('minExperienceYears', parseInt(value))}
          min={0}
          max={30}
        />

        <ToggleSwitch
          label="자격증 필수 제출"
          checked={settings.requireCertifications !== false}
          onChange={(checked) => updateSetting('requireCertifications', checked)}
        />

        <ToggleSwitch
          label="프로필 검토 필수"
          checked={settings.profileReviewRequired !== false}
          onChange={(checked) => updateSetting('profileReviewRequired', checked)}
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="시간당 요금 설정"
        description="전문가의 시간당 요금 범위를 설정합니다"
      >
        <div className="grid grid-cols-3 gap-4">
          <InputField
            label="최소 시간당 요금"
            type="number"
            value={settings.minHourlyRate || 30000}
            onChange={(value) => updateSetting('minHourlyRate', parseInt(value))}
            suffix="원"
            step={1000}
          />

          <InputField
            label="기본 요금"
            type="number"
            value={settings.defaultHourlyRate || 60000}
            onChange={(value) => updateSetting('defaultHourlyRate', parseInt(value))}
            suffix="원"
            step={1000}
          />

          <InputField
            label="최대 요금"
            type="number"
            value={settings.maxHourlyRate || 500000}
            onChange={(value) => updateSetting('maxHourlyRate', parseInt(value))}
            suffix="원"
            step={1000}
          />
        </div>

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="플랫폼 수수료 설정"
        description="거래 수수료율을 설정합니다"
      >
        <InputField
          label="플랫폼 수수료율"
          type="number"
          value={settings.commissionRate || 15}
          onChange={(value) => updateSetting('commissionRate', parseInt(value))}
          suffix="%"
          min={0}
          max={50}
          helpText="각 거래에서 플랫폼이 가져가는 수수료 비율"
        />

        <ToggleSwitch
          label="비활성 전문가 자동 비활성화"
          checked={settings.autoDeactivateInactive || false}
          onChange={(checked) => updateSetting('autoDeactivateInactive', checked)}
        />

        {settings.autoDeactivateInactive && (
          <InputField
            label="비활성 기간"
            type="number"
            value={settings.inactivityPeriodDays || 90}
            onChange={(value) => updateSetting('inactivityPeriodDays', parseInt(value))}
            suffix="일"
          />
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
