'use client';

import React from 'react';

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  alert?: {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
  };
}

export default function SettingSection({
  title,
  description,
  children,
  alert
}: SettingSectionProps) {
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const alertIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {alert && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${alertStyles[alert.type]}`}>
          <span className="text-lg">{alertIcons[alert.type]}</span>
          <p className="text-sm flex-1">{alert.message}</p>
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
