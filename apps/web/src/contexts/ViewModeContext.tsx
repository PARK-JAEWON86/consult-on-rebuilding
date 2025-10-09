'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export type ViewMode = 'user' | 'expert';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  switchToExpertMode: () => void;
  switchToUserMode: () => void;
  isExpertMode: boolean;
  isUserMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>('user');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // 초기 로드 및 사용자 변경 시 viewMode 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedViewMode = localStorage.getItem('consulton-viewMode');
      const isExpertUser = user?.roles?.includes('EXPERT');

      // 전문가 사용자이고 인증된 경우, 항상 expert 모드로 시작
      if (isAuthenticated && isExpertUser) {
        setViewModeState('expert');
        // localStorage에 저장된 값이 없거나 'user'인 경우에만 업데이트
        if (storedViewMode !== '"expert"') {
          localStorage.setItem('consulton-viewMode', JSON.stringify('expert'));
        }
      } else if (storedViewMode) {
        // 일반 사용자는 저장된 값 사용
        setViewModeState(JSON.parse(storedViewMode));
      }
    }
  }, [user, isAuthenticated]);

  // URL 기반으로 viewMode 자동 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (pathname.startsWith('/dashboard/expert')) {
        setViewModeState('expert');
        localStorage.setItem('consulton-viewMode', JSON.stringify('expert'));
      } else if (pathname.startsWith('/dashboard')) {
        setViewModeState('user');
        localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
      } else {
        // 다른 경로에서는 저장된 viewMode 사용
        const storedViewMode = localStorage.getItem('consulton-viewMode');
        if (storedViewMode) {
          setViewModeState(JSON.parse(storedViewMode));
        }
      }
    }
  }, [pathname]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('consulton-viewMode', JSON.stringify(mode));
    }

    // 다른 컴포넌트에 변경사항 알림
    window.dispatchEvent(new CustomEvent('viewModeChanged', {
      detail: { mode }
    }));
  };

  const switchToExpertMode = () => {
    setViewMode('expert');
    router.push('/dashboard/expert');
  };

  const switchToUserMode = () => {
    setViewMode('user');
    router.push('/dashboard');
  };

  const value: ViewModeContextType = {
    viewMode,
    setViewMode,
    switchToExpertMode,
    switchToUserMode,
    isExpertMode: viewMode === 'expert',
    isUserMode: viewMode === 'user',
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}