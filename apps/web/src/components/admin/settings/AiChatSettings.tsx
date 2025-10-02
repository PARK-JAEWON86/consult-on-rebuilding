'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import SelectField from './SelectField';
import ToggleSwitch from './ToggleSwitch';
import TextareaField from './TextareaField';
import SaveButton from './SaveButton';
import { AIChatSettings as AiChatSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function AiChatSettings() {
  const [settings, setSettings] = useState<Partial<AiChatSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/aiChat');
      const settingsData: Partial<AiChatSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof AiChatSettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load AI chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/aiChat', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AiChatSettingsType>(
    key: K,
    value: AiChatSettingsType[K]
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
        title="AI 상담 기본 설정"
        description="AI 상담 서비스 활성화 및 제공자 설정"
      >
        <ToggleSwitch
          label="AI 상담 서비스 활성화"
          checked={settings.enableAiChat !== false}
          onChange={(checked) => updateSetting('enableAiChat', checked)}
          description="사용자가 AI 상담 기능을 사용할 수 있도록 합니다"
        />

        <SelectField
          label="AI 서비스 제공자"
          value={settings.aiProvider || 'openai'}
          onChange={(value) => updateSetting('aiProvider', value)}
          options={[
            { value: 'openai', label: 'OpenAI (GPT-4)' },
            { value: 'anthropic', label: 'Anthropic (Claude)' },
            { value: 'google', label: 'Google (Gemini)' },
          ]}
        />

        <InputField
          label="OpenAI API 키"
          type="password"
          value={settings.openaiApiKey || ''}
          onChange={(value) => updateSetting('openaiApiKey', value)}
          placeholder="sk-*********************************"
          helpText="API 키는 암호화되어 저장됩니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="사용량 제한 설정"
        description="사용자별 AI 상담 사용량 제한"
      >
        <InputField
          label="월간 무료 토큰 수"
          type="number"
          value={settings.freeTokensPerMonth || 10000}
          onChange={(value) => updateSetting('freeTokensPerMonth', parseInt(value))}
          suffix="토큰"
          min={0}
          helpText="매월 사용자에게 제공되는 무료 토큰 수"
        />

        <InputField
          label="요청당 최대 토큰 수"
          type="number"
          value={settings.maxTokensPerRequest || 2000}
          onChange={(value) => updateSetting('maxTokensPerRequest', parseInt(value))}
          suffix="토큰"
          min={100}
          max={10000}
          helpText="단일 AI 상담 요청에서 사용할 수 있는 최대 토큰 수"
        />

        <InputField
          label="일일 요청 제한"
          type="number"
          value={settings.dailyRequestLimit || 50}
          onChange={(value) => updateSetting('dailyRequestLimit', parseInt(value))}
          suffix="회"
          min={1}
          max={1000}
          helpText="사용자당 하루 최대 AI 상담 요청 횟수"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="AI 프롬프트 및 동작 설정"
        description="AI의 응답 방식과 시스템 프롬프트 설정"
      >
        <TextareaField
          label="시스템 프롬프트"
          value={settings.systemPrompt || ''}
          onChange={(value) => updateSetting('systemPrompt', value)}
          placeholder="당신은 Consult On의 전문 상담 AI입니다..."
          rows={8}
          helpText="AI가 모든 대화에서 따를 기본 지침"
        />

        <SelectField
          label="응답 톤"
          value={settings.responseStyle || 'professional'}
          onChange={(value) => updateSetting('responseStyle', value)}
          options={[
            { value: 'professional', label: '전문적' },
            { value: 'friendly', label: '친근한' },
            { value: 'concise', label: '간결한' },
            { value: 'detailed', label: '상세한' },
          ]}
        />

        <ToggleSwitch
          label="대화 컨텍스트 유지"
          checked={settings.enableConversationMemory !== false}
          onChange={(checked) => updateSetting('enableConversationMemory', checked)}
          description="이전 대화 내용을 기억하여 연속적인 상담 제공"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="데이터 보관 정책"
        description="AI 상담 데이터 보관 기간 설정"
      >
        <InputField
          label="대화 기록 보관 기간"
          type="number"
          value={settings.dataRetentionDays || 90}
          onChange={(value) => updateSetting('dataRetentionDays', parseInt(value))}
          suffix="일"
          min={1}
          max={365}
          helpText="AI 상담 대화 기록을 보관할 기간"
        />

        <ToggleSwitch
          label="자동 데이터 삭제"
          checked={settings.autoDeleteOldData !== false}
          onChange={(checked) => updateSetting('autoDeleteOldData', checked)}
          description="보관 기간이 지난 대화 기록을 자동으로 삭제합니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
