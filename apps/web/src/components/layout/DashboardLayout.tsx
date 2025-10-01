'use client';

import { useState, useEffect } from 'react';
import IconOnlySidebar from '@/components/layout/IconOnlySidebar';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant: 'user' | 'expert';
}

export default function DashboardLayout({ children, variant }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50">
      <IconOnlySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        variant={variant}
        onExpandedChange={setSidebarExpanded}
        showToggleButton={false}
        isExpanded={sidebarExpanded}
      />

      {/* 외부 토글 버튼 */}
      {isLargeScreen && (
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={`fixed top-20 z-50 p-2 bg-white border border-gray-200 rounded-r-md transition-all duration-300 ${
            variant === 'expert'
              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-l-blue-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={{
            left: sidebarExpanded ? '256px' : '64px'
          }}
          title={sidebarExpanded ? '사이드바 접기' : '사이드바 펼치기'}
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      )}

      <div
        className={`absolute inset-0 pt-16 overflow-auto transition-all duration-300`}
        style={{
          left: isLargeScreen ? (sidebarExpanded ? '256px' : '64px') : '0',
          marginLeft: 0
        }}
      >
        <div className="w-full px-10 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}