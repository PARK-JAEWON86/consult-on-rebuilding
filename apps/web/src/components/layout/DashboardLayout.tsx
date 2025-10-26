'use client';

import { useState, useEffect } from 'react';
import IconOnlySidebar from '@/components/layout/IconOnlySidebar';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: 'user' | 'expert'; // Optional: when not provided, IconOnlySidebar uses viewMode from context
}

export default function DashboardLayout({ children, variant }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg'>('lg');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const prevSize = screenSize;

      if (width >= 1024) {
        setScreenSize('lg'); // 큰 화면: 확장/축소 토글 가능
        // md에서 lg로 전환 시에만 자동 펼침
        if (prevSize === 'md') {
          setSidebarExpanded(true);
        }
      } else if (width >= 768) {
        setScreenSize('md'); // 중간 화면: 토글 가능, 기본은 아이콘 모드
        // lg에서 md로 전환 시에만 자동 축소
        if (prevSize === 'lg') {
          setSidebarExpanded(false);
        }
      } else {
        setScreenSize('sm'); // 작은 화면: 숨김 + 햄버거 버튼
        setSidebarOpen(false); // 작은 화면에서는 기본적으로 숨김
        setSidebarExpanded(false); // 작은 화면에서는 아이콘 모드로 열림
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [screenSize]);

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

      {/* 토글 버튼 - 모든 화면 크기에서 동일한 디자인 */}
      {screenSize === 'lg' || screenSize === 'md' ? (
        // 큰 화면 & 중간 화면: 사이드바 오른쪽에 배치
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
      ) : (
        // 작은 화면: 동일한 디자인, 아이콘 사이드바 옆에 배치
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed top-20 z-50 p-2 bg-white border border-gray-200 rounded-r-md transition-all duration-300 ${
            variant === 'expert'
              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-l-blue-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={{
            left: sidebarOpen ? '64px' : '0px'  // 아이콘 사이드바(64px) 옆에 붙음
          }}
          title={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      )}

      <div
        className={`absolute inset-0 pt-16 overflow-auto transition-all duration-300`}
        style={{
          left: screenSize === 'lg'
            ? (sidebarExpanded ? '256px' : '64px')  // 큰 화면: 확장/축소에 따라
            : screenSize === 'md'
              ? '64px'  // 중간 화면: 아이콘 모드 고정
              : '0',    // 작은 화면: 여백 없음
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