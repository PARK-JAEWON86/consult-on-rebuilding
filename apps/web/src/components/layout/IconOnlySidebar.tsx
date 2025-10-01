"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useViewMode } from "@/contexts/ViewModeContext";

import {
  Home,
  MessageCircle,
  Users,
  FileText,
  Settings,
  Bell,
  Star,
  CreditCard,
  Calendar,
  Phone,
  Video,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
}

interface IconOnlySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  variant?: "user" | "expert";
  onExpandedChange?: (expanded: boolean) => void;
  showToggleButton?: boolean;
  isExpanded?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const IconOnlySidebar: React.FC<IconOnlySidebarProps> = ({
  isOpen = false,
  onClose,
  onToggle,
  variant,
  onExpandedChange,
  showToggleButton = true,
  isExpanded: externalIsExpanded,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { viewMode } = useViewMode();

  const [internalIsExpanded, setInternalIsExpanded] = useState(true);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [summaryNotificationCount, setSummaryNotificationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [nextSettlementDate, setNextSettlementDate] = useState<Date>(new Date());
  const [daysUntilSettlement, setDaysUntilSettlement] = useState<number>(0);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);

  // 정산 정보 계산 함수들
  const getNextSettlementDate = (): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    if (currentDay >= 5) {
      return new Date(currentYear, currentMonth + 1, 5);
    } else {
      return new Date(currentYear, currentMonth, 5);
    }
  };

  const getDaysUntilSettlement = (): number => {
    const today = new Date();
    const nextSettlement = getNextSettlementDate();
    const diffTime = nextSettlement.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatCredits = (n: number): string => {
    return `${n.toLocaleString()}`;
  };

  // 하이드레이션 완료 체크
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 확장 상태 변경을 부모에게 알림 및 CSS 변수 업데이트
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }

    // CSS 변수 업데이트
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isExpanded ? '256px' : '64px'
      );
    }
  }, [isExpanded, onExpandedChange]);

  // 하이드레이션 완료 후 테마 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("consulton-theme");
      setTheme(stored === "dark" ? "dark" : "light");
    }
  }, []);

  // 정산 정보 초기화 (전문가 모드에서만)
  useEffect(() => {
    if (pathname.startsWith("/dashboard/expert") && isAuthenticated && user?.roles?.includes('EXPERT')) {
      const nextDate = getNextSettlementDate();
      const daysLeft = getDaysUntilSettlement();
      setNextSettlementDate(nextDate);
      setDaysUntilSettlement(daysLeft);
      setSettlementAmount(75000);
    }
  }, [pathname, isAuthenticated, user]);

  const effectiveVariant: "user" | "expert" = useMemo(() => {
    console.log('IconOnlySidebar effectiveVariant 계산:', {
      variant,
      pathname,
      isAuthenticated,
      userRoles: user?.roles,
      viewMode,
      isHydrated
    });

    // 1. 명시적으로 전달된 variant가 있으면 우선 사용
    if (variant) {
      console.log('→ variant prop 사용:', variant);
      return variant;
    }

    // 2. URL 경로 기반으로 판단하되, 사용자 역할도 확인
    if (pathname.startsWith("/dashboard/expert")) {
      // 전문가 경로에 있지만 전문가 역할이 없으면 user 모드로
      if (isAuthenticated && user && !user.roles?.includes('EXPERT')) {
        console.log('→ 전문가 경로이지만 전문가 역할 없음, user 모드 사용');
        return "user";
      }
      console.log('→ 전문가 경로, expert 모드 사용');
      return "expert";
    }
    if (pathname.startsWith("/dashboard")) {
      console.log('→ 대시보드 경로, user 모드 사용');
      return "user";
    }

    // 3. ViewModeContext의 viewMode 사용
    if (viewMode && isAuthenticated) {
      console.log('→ ViewModeContext 사용:', viewMode);
      return viewMode;
    }

    // 4. 하이드레이션이 완료되지 않았으면 URL 기반으로 판단
    if (!isHydrated) {
      if (pathname.startsWith("/dashboard/expert")) {
        console.log('→ 하이드레이션 전, 전문가 경로');
        return "expert";
      }
      console.log('→ 하이드레이션 전, user 모드');
      return "user";
    }

    // 5. 사용자 roles에 따라 결정
    if (user?.roles?.includes('EXPERT')) {
      console.log('→ 사용자 역할 기반, expert 모드');
      return "expert";
    }
    if (user?.roles?.includes('USER') || user?.roles?.includes('ADMIN')) {
      console.log('→ 사용자 역할 기반, user 모드');
      return "user";
    }

    console.log('→ 기본값, user 모드');
    return "user";
  }, [variant, pathname, isHydrated, viewMode, user?.roles, isAuthenticated, user]);

  // 메뉴 정의
  const primaryMenu: MenuItem[] = useMemo(() => {
    if (effectiveVariant === "expert") {
      return [
        { id: "home", name: "대시보드", icon: Home, path: "/dashboard/expert" },
        {
          id: "consultation-requests",
          name: "예약 요청 관리",
          icon: MessageCircle,
          path: "/dashboard/expert/reservation-requests",
        },
        {
          id: "consultation-sessions",
          name: "상담 세션",
          icon: Video,
          path: "/dashboard/expert/consultation-sessions",
        },
        {
          id: "consultations",
          name: "상담 내역",
          icon: FileText,
          path: "/dashboard/expert/consultations",
        },
        {
          id: "reviews",
          name: "리뷰 관리",
          icon: Star,
          path: "/dashboard/expert/reviews",
        },
        {
          id: "payouts",
          name: "정산/출금",
          icon: CreditCard,
          path: "/dashboard/expert/payouts",
        },
      ];
    }

    // 클라이언트 모드 메뉴
    const clientMenu = [
      { id: "home", name: "대시보드", icon: Home, path: "/dashboard" },
      { id: "experts", name: "전문가 찾기", icon: Users, path: "/experts" },
      { id: "expert-consultation", name: "전문가 상담", icon: Calendar, path: "/expert-consultation" },
      { id: "chat", name: "AI채팅 상담", icon: MessageCircle, path: "/chat" },
    ];

    // 로그인된 사용자에게만 추가 메뉴 표시
    if (user && isAuthenticated) {
      clientMenu.push(
        { id: "consultations", name: "상담 내역", icon: FileText, path: "/dashboard/consultations" },
        { id: "my-reservations", name: "내 예약", icon: Calendar, path: "/dashboard/reservations" },
        { id: "my-reviews", name: "내 리뷰", icon: Star, path: "/dashboard/reviews" }
      );
    }

    clientMenu.push({
      id: "billing",
      name: "결제 및 크레딧",
      icon: CreditCard,
      path: "/credits",
    });

    return clientMenu;
  }, [effectiveVariant, user, isAuthenticated, viewMode]);

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/") return pathname === "/";
    if (itemPath === "/summary") {
      return pathname === "/summary" || pathname.startsWith("/summary/");
    }
    if (itemPath === "/dashboard/expert") {
      return pathname === "/dashboard/expert";
    }
    if (itemPath === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (itemPath.startsWith("/dashboard/")) {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const handleNavigate = (item: MenuItem) => {
    // 전문가 찾기 메뉴만 로그인 없이도 접근 가능
    if (item.id === "experts") {
      if (isAuthenticated && user) {
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }
      router.push(item.path as any);
      if (onClose) onClose();
      return;
    }

    // AI채팅 상담 메뉴는 로그인 필요
    if (item.id === "chat") {
      if (pathname === "/chat") {
        sessionStorage.setItem("showQuickChatModal", "true");
        window.location.reload();
        return;
      }

      if (isAuthenticated && user) {
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }

      router.push(`/auth/login?redirect=${encodeURIComponent(item.path)}`);
      if (onClose) onClose();
      return;
    }

    // 로그아웃 상태에서 다른 메뉴 클릭 시 로그인 페이지로 이동
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(item.path)}` as any);
      if (onClose) onClose();
      return;
    }

    // 로그인된 사용자의 경우 추가 검증
    if (isAuthenticated && user) {
      if (effectiveVariant === "expert" && user.roles?.includes("EXPERT")) {
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }

      if (effectiveVariant === "user" && (user.roles?.includes("USER") || user.roles?.includes("ADMIN"))) {
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }
    }

    router.push(item.path as any);
    if (onClose) onClose();
  };

  return (
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 ${
          effectiveVariant === "expert"
            ? "bg-gradient-to-b from-blue-50 to-indigo-50 border-r border-blue-100"
            : "bg-white border-r border-gray-200"
        } transform transition-all duration-300 lg:translate-x-0 ${
          isExpanded ? "w-64" : "w-16"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
      <div className="flex flex-col h-full">
        {/* 네비게이션 바 높이만큼 상단 여백 */}
        <div className={`h-16 flex-shrink-0 flex items-center justify-center px-3 border-b ${
          effectiveVariant === "expert"
            ? "bg-blue-50 border-blue-200"
            : "bg-white border-gray-100"
        }`}>
          {isExpanded && (
            <div className="text-xl font-bold text-blue-600">
              Consult On
            </div>
          )}
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-4">
          {/* 접기 버튼 - 조건부 렌더링 */}
          {showToggleButton && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  if (externalIsExpanded !== undefined && onExpandedChange) {
                    onExpandedChange(!isExpanded);
                  } else {
                    setInternalIsExpanded(!isExpanded);
                  }
                }}
                className={`p-2 text-gray-600 hover:text-gray-800 transition-colors ${
                  !isExpanded ? 'mx-auto' : ''
                }`}
                title={isExpanded ? '사이드바 접기' : '사이드바 펼치기'}
              >
                {isExpanded ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* 메뉴 영역 */}
          <nav className="space-y-1 flex-shrink-0">
            {!isHydrated ? (
              // 로딩 상태의 메뉴 스켈레톤
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full flex items-center gap-3 rounded-md px-3 py-2"
                >
                  <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                  <div className={`h-4 bg-gray-300 rounded flex-1 max-w-24 animate-pulse transition-opacity duration-300 ${
                    isExpanded ? "opacity-100" : "opacity-0"
                  }`}></div>
                </div>
              ))
            ) : (
              // 실제 메뉴
              primaryMenu.map((item, index) => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                const isDisabled = item.id === "experts" ? false : !isAuthenticated;

                return (
                  <div
                    key={item.id}
                    className="relative transform transition-all duration-300 ease-out opacity-100"
                    style={{
                      transitionDelay: `${index * 30}ms`
                    }}
                  >
                    <button
                      onClick={() => handleNavigate(item)}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative group ${
                        isDisabled
                          ? "text-gray-400 cursor-not-allowed opacity-60"
                          : active
                          ? effectiveVariant === "expert"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-gray-100 text-gray-900"
                          : effectiveVariant === "expert"
                            ? "text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      title={isDisabled ? "로그인이 필요합니다" : item.name}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          isDisabled
                            ? "text-gray-400"
                            : active
                            ? effectiveVariant === "expert"
                              ? "text-blue-900"
                              : "text-gray-900"
                            : effectiveVariant === "expert"
                              ? "text-blue-600"
                              : "text-gray-500"
                        }`}
                      />
                      <span className={`transition-opacity duration-300 whitespace-nowrap ${
                        isExpanded ? "opacity-100" : "opacity-0"
                      }`}>
                        {item.name}
                      </span>
                      {/* 상담 요약 알림 표시 */}
                      {item.id === "summary" && summaryNotificationCount > 0 && (
                        <span className={`ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center transition-opacity duration-300 ${
                          isExpanded ? "opacity-100" : "opacity-0"
                        }`}>
                          {summaryNotificationCount}
                        </span>
                      )}
                      {/* 일반 알림 표시 */}
                      {item.id === "notifications" && notificationCount > 0 && (
                        <span className={`ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center transition-opacity duration-300 ${
                          isExpanded ? "opacity-100" : "opacity-0"
                        }`}>
                          {notificationCount}
                        </span>
                      )}
                    </button>

                    {/* 알림 점 표시 (아이콘만 모드일 때) */}
                    {!isExpanded && (
                      <>
                        {item.id === "summary" && summaryNotificationCount > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        {item.id === "notifications" && notificationCount > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </nav>

        </div>

        {/* 크레딧/정산 정보 표시 - 하단 고정 */}
        {isAuthenticated && user && (
          <div className={`border-t p-3 flex-shrink-0 ${
            effectiveVariant === "expert"
              ? "border-blue-200"
              : "border-gray-200"
          }`}>
            {effectiveVariant === "expert" ? (
              // 전문가 모드: 정산 정보 표시
              <div className={`bg-blue-50 rounded-md ${isExpanded ? 'px-3 py-2' : 'px-0 py-2'}`}>
                {isExpanded ? (
                  <>
                    <div className="flex items-center gap-3 mb-2 px-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          다음 정산일
                        </div>
                        <div className="text-xs text-blue-600">
                          {nextSettlementDate.toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })} ({daysUntilSettlement}일 후)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3">
                      <span className="text-xs text-gray-600">정산 예정액</span>
                      <span className="text-sm font-bold text-blue-700">
                        {formatCredits(settlementAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
            ) : (
              // 사용자 모드: 기존 크레딧 표시
              <div className={`bg-gray-50 rounded-md ${isExpanded ? 'px-3 py-2' : 'px-0 py-2'}`}>
                {isExpanded ? (
                  <div className="flex items-center gap-3 px-3">
                    <CreditCard className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        보유 크레딧
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {user.credits?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </aside>
  );
};

export default IconOnlySidebar;