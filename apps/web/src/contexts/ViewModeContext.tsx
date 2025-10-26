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

      // localStorage에 저장된 사용자 선택을 최우선으로 존중
      if (storedViewMode) {
        const mode = JSON.parse(storedViewMode) as ViewMode;

        // 보안 검증: 전문가가 아닌 사용자가 expert 모드에 있으면 user 모드로 수정
        if (mode === 'expert' && !isExpertUser) {
          setViewModeState('user');
          localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
        } else {
          // 유효한 모드면 그대로 사용
          setViewModeState(mode);
        }
      } else if (isAuthenticated && isExpertUser) {
        // 저장된 값이 없는 경우에만: 전문가는 기본값으로 expert 모드
        setViewModeState('expert');
        localStorage.setItem('consulton-viewMode', JSON.stringify('expert'));
      } else if (isAuthenticated) {
        // 저장된 값이 없는 경우에만: 일반 사용자는 기본값으로 user 모드
        setViewModeState('user');
        localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
      }
    }
  }, [user, isAuthenticated]);

  // URL 기반으로 viewMode 자동 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isExpertUser = user?.roles?.includes('EXPERT');

      if (pathname.startsWith('/dashboard/expert')) {
        // 보안 검증: 전문가 대시보드는 전문가만 접근 가능
        if (isAuthenticated && isExpertUser) {
          setViewModeState('expert');
          localStorage.setItem('consulton-viewMode', JSON.stringify('expert'));
        } else if (isAuthenticated) {
          // 전문가가 아닌 사용자가 전문가 대시보드 접근 시도 → user 모드로 전환
          setViewModeState('user');
          localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
        }
      } else if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/expert')) {
        setViewModeState('user');
        localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
      }
      // 다른 경로(/experts, /community 등)에서는 viewMode를 변경하지 않음
      // 현재 상태가 자동으로 유지되어 사용자 선택을 존중함
    }
  }, [pathname, user, isAuthenticated]);

  const setViewMode = (mode: ViewMode) => {
    // 보안 검증: expert 모드로 전환 시 권한 확인
    if (mode === 'expert') {
      const isExpertUser = user?.roles?.includes('EXPERT');
      if (!isExpertUser) {
        console.warn('[ViewMode] Cannot set expert mode: User does not have EXPERT role');
        // 권한이 없으면 user 모드로 강제 설정
        setViewModeState('user');
        if (typeof window !== 'undefined') {
          localStorage.setItem('consulton-viewMode', JSON.stringify('user'));
        }
        return;
      }
    }

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
    // 보안 검증: 전문가 권한이 있는 사용자만 expert 모드로 전환 가능
    const isExpertUser = user?.roles?.includes('EXPERT');
    if (!isExpertUser) {
      console.warn('[ViewMode] Expert mode switch blocked: User does not have EXPERT role');
      return;
    }

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