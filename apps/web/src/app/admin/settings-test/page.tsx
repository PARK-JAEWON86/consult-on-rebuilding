'use client';

import { useState } from 'react';

export default function SettingsTestPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정 테스트</h1>
        <p className="text-sm text-gray-600 mt-1">
          최소 테스트 페이지
        </p>
      </div>

      <div className="bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-4 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            일반
          </button>
        </div>
      </div>

      <div className="min-h-[600px] bg-white p-6">
        <p>테스트 컨텐츠: {activeTab}</p>
      </div>
    </div>
  );
}
