'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import ToggleSwitch from './ToggleSwitch';
import TextareaField from './TextareaField';
import SaveButton from './SaveButton';
import { CommunitySettings as CommunitySettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function CommunitySettings() {
  const [settings, setSettings] = useState<Partial<CommunitySettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/community');
      const settingsData: Partial<CommunitySettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof CommunitySettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load community settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/community', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof CommunitySettingsType>(
    key: K,
    value: CommunitySettingsType[K]
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
        title="커뮤니티 기본 설정"
        description="커뮤니티 기능 활성화 및 기본 정책"
      >
        <ToggleSwitch
          label="커뮤니티 활성화"
          checked={settings.enableCommunity !== false}
          onChange={(checked) => updateSetting('enableCommunity', checked)}
          description="사용자가 커뮤니티 게시판을 이용할 수 있습니다"
        />

        <ToggleSwitch
          label="게시물 사전 승인"
          checked={settings.postApprovalRequired || false}
          onChange={(checked) => updateSetting('postApprovalRequired', checked)}
          description="새 게시물을 관리자가 승인 후 게시합니다"
        />

        <ToggleSwitch
          label="익명 게시 허용"
          checked={settings.allowAnonymousPosts || false}
          onChange={(checked) => updateSetting('allowAnonymousPosts', checked)}
          description="사용자가 익명으로 게시물을 작성할 수 있습니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="게시물 제한 설정"
        description="게시물 작성 제한 및 규칙"
      >
        <InputField
          label="최대 게시물 길이"
          type="number"
          value={settings.maxPostLength || 5000}
          onChange={(value) => updateSetting('maxPostLength', parseInt(value))}
          suffix="자"
          min={100}
          max={50000}
          helpText="게시물 본문의 최대 글자 수"
        />

        <InputField
          label="하루 게시물 제한"
          type="number"
          value={settings.dailyPostLimit || 10}
          onChange={(value) => updateSetting('dailyPostLimit', parseInt(value))}
          suffix="개"
          min={1}
          max={100}
          helpText="사용자당 하루 최대 게시물 수"
        />

        <InputField
          label="최대 이미지 개수"
          type="number"
          value={settings.maxImagesPerPost || 5}
          onChange={(value) => updateSetting('maxImagesPerPost', parseInt(value))}
          suffix="개"
          min={0}
          max={20}
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="콘텐츠 필터링"
        description="부적절한 콘텐츠 차단 설정"
      >
        <TextareaField
          label="금지 단어 목록"
          value={Array.isArray(settings.bannedWords) ? settings.bannedWords.join(', ') : ''}
          onChange={(value) => updateSetting('bannedWords', value.split(',').map(w => w.trim()).filter(w => w))}
          placeholder="욕설1, 욕설2, 비속어..."
          rows={4}
          helpText="쉼표로 구분하여 입력하세요"
        />

        <ToggleSwitch
          label="자동 필터링 활성화"
          checked={settings.enableAutoModeration !== false}
          onChange={(checked) => updateSetting('enableAutoModeration', checked)}
          description="금지 단어가 포함된 게시물을 자동으로 차단합니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="신고 및 관리"
        description="게시물 신고 처리 정책"
      >
        <InputField
          label="자동 숨김 신고 수"
          type="number"
          value={settings.reportThreshold || 5}
          onChange={(value) => updateSetting('reportThreshold', parseInt(value))}
          suffix="회"
          min={1}
          max={50}
          helpText="이 수 이상 신고되면 게시물이 자동으로 숨겨집니다"
        />

        <ToggleSwitch
          label="신고자 익명성 보장"
          checked={settings.anonymousReporting !== false}
          onChange={(checked) => updateSetting('anonymousReporting', checked)}
          description="신고자 정보를 게시자에게 공개하지 않습니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="상호작용 설정"
        description="댓글, 좋아요 등 상호작용 기능"
      >
        <ToggleSwitch
          label="댓글 기능"
          checked={settings.enableComments !== false}
          onChange={(checked) => updateSetting('enableComments', checked)}
        />

        <ToggleSwitch
          label="게시물 반응 (좋아요)"
          checked={settings.enablePostReactions !== false}
          onChange={(checked) => updateSetting('enablePostReactions', checked)}
        />

        <ToggleSwitch
          label="게시물 공유"
          checked={settings.enableSharing !== false}
          onChange={(checked) => updateSetting('enableSharing', checked)}
        />

        <InputField
          label="댓글 최대 깊이"
          type="number"
          value={settings.maxCommentDepth || 3}
          onChange={(value) => updateSetting('maxCommentDepth', parseInt(value))}
          suffix="단계"
          min={1}
          max={10}
          helpText="대댓글의 최대 깊이"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
