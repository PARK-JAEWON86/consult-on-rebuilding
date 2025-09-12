"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LayoutProps, AppState } from "@/types/layout";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function Layout({ 
  children, 
  showSidebar = false, 
  showFooter = true,
  className = ""
}: LayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    currentCredits: 0,
  });

  // 인증 상태 동기화
  useEffect(() => {
    setAppState({
      isAuthenticated,
      user: user || null,
      currentCredits: user?.credits || 0,
    });
  }, [isAuthenticated, user]);

  const handleAppStateChange = (newState: AppState) => {
    setAppState(newState);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <Navbar />

      <div className="flex min-h-screen">
        {/* 사이드바 (인증된 사용자만) */}
        {showSidebar && appState.isAuthenticated && (
          <Sidebar
            appState={appState}
            onAppStateChange={handleAppStateChange}
          />
        )}

        {/* 메인 콘텐츠 영역 */}
        <div className={`flex-1 flex flex-col ${showSidebar ? 'lg:ml-64' : ''}`}>
          <main className={`flex-1 ${className}`}>
            {children}
          </main>

          {/* 푸터 */}
          {showFooter && <Footer />}
        </div>
      </div>
    </div>
  );
}
