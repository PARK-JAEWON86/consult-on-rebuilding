'use client';

import { useState } from 'react';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import ExpertSettings from '@/components/admin/settings/ExpertSettings';
import PaymentSettings from '@/components/admin/settings/PaymentSettings';
import AiChatSettings from '@/components/admin/settings/AiChatSettings';
import CommunitySettings from '@/components/admin/settings/CommunitySettings';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import AnalyticsSettings from '@/components/admin/settings/AnalyticsSettings';

type TabId = 'general' | 'expert' | 'payment' | 'aiChat' | 'community' | 'notification' | 'security' | 'analytics';

interface Tab {
  id: TabId;
  label: string;
  description: string;
}

const TABS: Tab[] = [
  { id: 'general', label: '일반', description: '플랫폼 기본 설정' },
  { id: 'expert', label: '전문가', description: '전문가 관리' },
  { id: 'payment', label: '결제', description: '결제 처리' },
  { id: 'aiChat', label: 'AI 상담', description: 'AI 상담 설정' },
  { id: 'community', label: '커뮤니티', description: '커뮤니티 관리' },
  { id: 'notification', label: '알림', description: '알림 시스템' },
  { id: 'security', label: '보안', description: '보안 정책' },
  { id: 'analytics', label: '분석', description: '분석 및 리포트' },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'expert':
        return <ExpertSettings />;
      case 'payment':
        return <PaymentSettings />;
      case 'aiChat':
        return <AiChatSettings />;
      case 'community':
        return <CommunitySettings />;
      case 'notification':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'analytics':
        return <AnalyticsSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-sm text-gray-600 mt-1">
            플랫폼 설정 및 환경 설정을 관리합니다
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
}
