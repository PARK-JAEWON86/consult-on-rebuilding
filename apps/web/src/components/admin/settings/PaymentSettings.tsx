'use client';

import { useState, useEffect } from 'react';
import SettingSection from './SettingSection';
import InputField from './InputField';
import SelectField from './SelectField';
import ToggleSwitch from './ToggleSwitch';
import SaveButton from './SaveButton';
import { PaymentSettings as PaymentSettingsType } from '@/types/admin/settings';
import { api } from '@/lib/api';

export default function PaymentSettings() {
  const [settings, setSettings] = useState<Partial<PaymentSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/payment');
      const settingsData: Partial<PaymentSettingsType> = {};
      Object.entries(response.data).forEach(([key, setting]: [string, any]) => {
        settingsData[key as keyof PaymentSettingsType] = setting.value;
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings/payment', settings);
      alert('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof PaymentSettingsType>(
    key: K,
    value: PaymentSettingsType[K]
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
        title="결제 서비스 설정"
        description="외부 결제 서비스 연동 설정"
        alert={{
          type: 'warning',
          message: 'API 키는 안전하게 보관되며 마스킹 처리됩니다'
        }}
      >
        <SelectField
          label="결제 서비스 제공자"
          value={settings.paymentProvider || 'toss'}
          onChange={(value) => updateSetting('paymentProvider', value)}
          options={[
            { value: 'toss', label: '토스페이먼츠' },
            { value: 'stripe', label: 'Stripe' },
            { value: 'iamport', label: '아임포트' },
          ]}
        />

        <InputField
          label="토스페이먼츠 API 키"
          type="password"
          value={settings.tossApiKey || ''}
          onChange={(value) => updateSetting('tossApiKey', value)}
          placeholder="test_ak_*****************"
        />

        <InputField
          label="토스페이먼츠 시크릿 키"
          type="password"
          value={settings.tossSecretKey || ''}
          onChange={(value) => updateSetting('tossSecretKey', value)}
          placeholder="test_sk_*****************"
        />

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="크레딧 시스템"
        description="플랫폼 내 크레딧 시스템 설정"
      >
        <InputField
          label="크레딧-원화 환율"
          type="number"
          value={settings.creditToKrwRatio || 100}
          onChange={(value) => updateSetting('creditToKrwRatio', parseInt(value))}
          suffix="원 = 1 크레딧"
          helpText="1 크레딧 당 원화 가치"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            충전 보너스 등급
          </label>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>10,000원 충전</span>
              <span className="font-medium text-blue-600">+5% 보너스</span>
            </div>
            <div className="flex justify-between">
              <span>50,000원 충전</span>
              <span className="font-medium text-blue-600">+10% 보너스</span>
            </div>
            <div className="flex justify-between">
              <span>100,000원 충전</span>
              <span className="font-medium text-blue-600">+15% 보너스</span>
            </div>
          </div>
        </div>

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>

      <SettingSection
        title="수수료 및 환불 정책"
        description="거래 수수료와 환불 규정 설정"
      >
        <InputField
          label="플랫폼 수수료"
          type="number"
          value={settings.platformFee || 15}
          onChange={(value) => updateSetting('platformFee', parseInt(value))}
          suffix="%"
          min={0}
          max={50}
          helpText="각 거래에 대한 플랫폼 수수료"
        />

        <InputField
          label="환불 가능 기간"
          type="number"
          value={settings.refundPolicyPeriodDays || 7}
          onChange={(value) => updateSetting('refundPolicyPeriodDays', parseInt(value))}
          suffix="일"
          min={1}
          max={30}
          helpText="상담 후 환불 요청 가능 기간"
        />

        <ToggleSwitch
          label="자동 정산"
          checked={settings.autoSettlement !== false}
          onChange={(checked) => updateSetting('autoSettlement', checked)}
          description="전문가에게 자동으로 수익을 정산합니다"
        />

        {settings.autoSettlement !== false && (
          <InputField
            label="정산 주기"
            type="number"
            value={settings.settlementCycleDays || 7}
            onChange={(value) => updateSetting('settlementCycleDays', parseInt(value))}
            suffix="일"
            min={1}
            max={30}
          />
        )}

        <SaveButton onClick={handleSave} loading={saving}>
          💾 저장
        </SaveButton>
      </SettingSection>
    </div>
  );
}
