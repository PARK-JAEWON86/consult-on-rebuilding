'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import ToggleSwitch from './ToggleSwitch';
import SelectField from './SelectField';
import SaveButton from './SaveButton';
import { AnalyticsSettings as AnalyticsSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function AnalyticsSettings() {
  const [settings, setSettings] = useState<Partial<AnalyticsSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/analytics');
      const settingsData: Partial<AnalyticsSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof AnalyticsSettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load analytics settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/analytics', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AnalyticsSettingsType>(
    key: K,
    value: AnalyticsSettingsType[K]
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
        title="분석 도구 연동"
        description="외부 분석 서비스 설정"
      >
        <ToggleSwitch
          label="분석 기능 활성화"
          checked={settings.enableAnalytics !== false}
          onChange={(checked) => updateSetting('enableAnalytics', checked)}
          description="플랫폼 사용 데이터를 수집하고 분석합니다"
        />

        {settings.enableAnalytics !== false && (
          <>
            <InputField
              label="Google Analytics ID"
              value={settings.googleAnalyticsId || ''}
              onChange={(value) => updateSetting('googleAnalyticsId', value)}
              placeholder="G-XXXXXXXXXX"
              helpText="Google Analytics 4 측정 ID"
            />

            <ToggleSwitch
              label="사용자 행동 추적"
              checked={settings.trackUserBehavior !== false}
              onChange={(checked) => updateSetting('trackUserBehavior', checked)}
              description="클릭, 스크롤 등 사용자 행동을 추적합니다"
            />
          </>
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="대시보드 설정"
        description="관리자 대시보드 표시 옵션"
      >
        <InputField
          label="대시보드 새로고침 주기"
          type="number"
          value={settings.dashboardRefreshRate || 30}
          onChange={(value) => updateSetting('dashboardRefreshRate', parseInt(value))}
          suffix="초"
          min={10}
          max={300}
          helpText="실시간 데이터 업데이트 주기"
        />

        <SelectField
          label="기본 기간 범위"
          value={settings.defaultDateRange || '7days'}
          onChange={(value) => updateSetting('defaultDateRange', value)}
          options={[
            { value: '1day', label: '최근 1일' },
            { value: '7days', label: '최근 7일' },
            { value: '30days', label: '최근 30일' },
            { value: '90days', label: '최근 90일' },
          ]}
        />

        <ToggleSwitch
          label="실시간 데이터 표시"
          checked={settings.showRealTimeData !== false}
          onChange={(checked) => updateSetting('showRealTimeData', checked)}
          description="대시보드에 실시간 활동 현황을 표시합니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="리포트 자동 생성"
        description="정기 리포트 생성 및 전송 설정"
      >
        <ToggleSwitch
          label="자동 리포트 생성"
          checked={settings.autoGenerateReports || false}
          onChange={(checked) => updateSetting('autoGenerateReports', checked)}
          description="정기적으로 분석 리포트를 자동 생성합니다"
        />

        {settings.autoGenerateReports && (
          <>
            <SelectField
              label="리포트 생성 주기"
              value={settings.reportFrequency || 'weekly'}
              onChange={(value) => updateSetting('reportFrequency', value)}
              options={[
                { value: 'daily', label: '매일' },
                { value: 'weekly', label: '매주' },
                { value: 'monthly', label: '매월' },
              ]}
            />

            <InputField
              label="리포트 수신 이메일"
              type="email"
              value={settings.reportEmailRecipients || ''}
              onChange={(value) => updateSetting('reportEmailRecipients', value)}
              placeholder="admin@consulton.com"
              helpText="여러 주소는 쉼표로 구분하세요"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                리포트 포함 항목
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>사용자 증가 통계</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>상담 건수 및 매출</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>전문가 활동 현황</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked readOnly />
                  <span>인기 카테고리 분석</span>
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
        title="데이터 수집 범위"
        description="추적할 데이터 유형 선택"
      >
        <div className="space-y-3">
          <ToggleSwitch
            label="페이지뷰 추적"
            checked={settings.trackPageViews !== false}
            onChange={(checked) => updateSetting('trackPageViews', checked)}
          />

          <ToggleSwitch
            label="이벤트 추적"
            checked={settings.trackEvents !== false}
            onChange={(checked) => updateSetting('trackEvents', checked)}
            description="버튼 클릭, 폼 제출 등 사용자 행동"
          />

          <ToggleSwitch
            label="전환 추적"
            checked={settings.trackConversions !== false}
            onChange={(checked) => updateSetting('trackConversions', checked)}
            description="회원가입, 상담 완료 등 주요 전환"
          />

          <ToggleSwitch
            label="성능 메트릭"
            checked={settings.trackPerformance !== false}
            onChange={(checked) => updateSetting('trackPerformance', checked)}
            description="페이지 로딩 속도, 응답 시간 등"
          />

          <ToggleSwitch
            label="오류 추적"
            checked={settings.trackErrors !== false}
            onChange={(checked) => updateSetting('trackErrors', checked)}
            description="JavaScript 오류 및 API 실패"
          />
        </div>

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="데이터 보관 정책"
        description="분석 데이터 보관 기간 설정"
      >
        <InputField
          label="원시 데이터 보관 기간"
          type="number"
          value={settings.rawDataRetentionDays || 90}
          onChange={(value) => updateSetting('rawDataRetentionDays', parseInt(value))}
          suffix="일"
          min={30}
          max={730}
          helpText="상세 로그 데이터 보관 기간"
        />

        <InputField
          label="집계 데이터 보관 기간"
          type="number"
          value={settings.aggregatedDataRetentionDays || 365}
          onChange={(value) => updateSetting('aggregatedDataRetentionDays', parseInt(value))}
          suffix="일"
          min={90}
          max={1825}
          helpText="일/월 단위 통계 보관 기간"
        />

        <ToggleSwitch
          label="자동 데이터 정리"
          checked={settings.autoCleanupOldData !== false}
          onChange={(checked) => updateSetting('autoCleanupOldData', checked)}
          description="보관 기간이 지난 데이터를 자동으로 삭제합니다"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
