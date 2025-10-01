"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useViewMode } from "@/contexts/ViewModeContext";

// expertDataService는 서버 사이드에서만 사용
// import PasswordChangeModal from "@/components/settings/PasswordChangeModal";

import {
  Home,
  MessageCircle,
  Users,
  FileText,
  Star,
  CreditCard,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Phone,
  Video,
  TrendingUp,
} from "lucide-react";



interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  variant?: "user" | "expert"; // 명시적으로 강제 가능
  updateCSSVariable?: boolean; // CSS 변수 업데이트 제어
}

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface ContextMenu {
  show: boolean;
  x: number;
  y: number;
  item: string;
}

interface EditingItem {
  id: string;
  title: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  onToggle,
  variant,
  updateCSSVariable = true,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { viewMode } = useViewMode();

  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    show: false,
    x: 0,
    y: 0,
    item: ""
  });
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [summaryNotificationCount, setSummaryNotificationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [nextSettlementDate, setNextSettlementDate] = useState<Date>(new Date());
  const [daysUntilSettlement, setDaysUntilSettlement] = useState<number>(0);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);


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
    return `${n.toLocaleString()} 크레딧`;
  };

  // 알림 개수 로드
  const loadNotificationCount = async () => {
    try {
      // 임시 전문가 ID (실제로는 인증 시스템에서 가져와야 함)
      const expertId = 'expert_1';
      
      const response = await fetch(`/api/notifications?userId=${expertId}&isRead=false`);
      const result = await response.json();
      
      if (result.success) {
        setNotificationCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('알림 개수 로드 실패:', error);
    }
  };

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

      // 임시 정산 예정액 (실제로는 API에서 가져와야 함)
      setSettlementAmount(75000);
    }
  }, [pathname, isAuthenticated, user]);

  // 알림 개수 로드
  useEffect(() => {
    loadNotificationCount();
    
    // 주기적으로 알림 개수 업데이트 (30초마다)
    const interval = setInterval(loadNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 뷰 모드는 이제 Context에서 관리됩니다

  // 유저 역할/저장된 뷰 모드 기반으로 variant 결정
  
  // 상담 요약 알림 개수 가져오기
  useEffect(() => {
    const fetchSummaryNotificationCount = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch('/api/consultation-summaries?status=expert_reviewed');
          const result = await response.json();
          if (result.success) {
            // 방문한 상담 요약은 제외
            const visitedSummaries = JSON.parse(localStorage.getItem('visited-consultation-summaries') || '[]');
            const unvisitedCount = result.data.filter((summary: any) => !visitedSummaries.includes(summary.id)).length;
            setSummaryNotificationCount(unvisitedCount);
          }
        } catch (error) {
          console.error('상담 요약 알림 개수 조회 실패:', error);
        }
      }
    };

    fetchSummaryNotificationCount();
  }, [isAuthenticated, user]);

  // 상담 요약 방문 이벤트 감지하여 알림 개수 업데이트
  useEffect(() => {
    const handleSummaryVisited = (event: CustomEvent) => {
      if (event.detail.action === 'markVisited') {
        // 방문한 상담 요약이 추가되었으므로 알림 개수 감소
        setSummaryNotificationCount(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('summaryVisited', handleSummaryVisited as EventListener);
    
    return () => {
      window.removeEventListener('summaryVisited', handleSummaryVisited as EventListener);
    };
  }, []);
  
  // 하이드레이션 완료 상태 체크
  const [isHydrated, setIsHydrated] = useState(false);

  // 하이드레이션 완료 체크
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ViewMode 변경 이벤트 감지
  useEffect(() => {
    const handleViewModeChange = (event: CustomEvent) => {
      console.log('ViewMode 변경 이벤트 감지:', event.detail);
      // 강제로 리렌더링을 위해 state 업데이트
      setIsHydrated(prev => !prev);
      setTimeout(() => setIsHydrated(prev => !prev), 10);
    };

    window.addEventListener('viewModeChanged', handleViewModeChange as EventListener);

    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
    };
  }, []);

  const effectiveVariant: "user" | "expert" = useMemo(() => {
    console.log('effectiveVariant 계산:', { variant, pathname, isHydrated, viewMode, userRoles: user?.roles, isAuthenticated });

    // 1. URL 경로 기반으로 판단 (가장 우선순위)
    if (pathname.startsWith("/dashboard/expert")) {
      console.log('URL 기반으로 expert 모드 결정');
      return "expert";
    }
    if (pathname.startsWith("/dashboard")) {
      console.log('URL 기반으로 user 모드 결정');
      return "user";
    }

    // 2. ViewModeContext의 viewMode 사용
    if (viewMode && isAuthenticated) {
      console.log('ViewModeContext viewMode 사용:', viewMode);
      return viewMode;
    }

    // 3. 명시적으로 전달된 variant 사용
    if (variant) {
      console.log('명시적 variant 사용:', variant);
      return variant;
    }

    // 4. 하이드레이션이 완료되지 않았으면 URL 기반으로 판단
    if (!isHydrated) {
      if (pathname.startsWith("/dashboard/expert")) return "expert";
      return "user";
    }

    // 5. 사용자 roles에 따라 결정 (로그인 직후 자동 결정)
    if (user?.roles?.includes('EXPERT')) {
      console.log('사용자 roles 기반으로 expert 모드 결정');
      return "expert";
    }
    if (user?.roles?.includes('USER') || user?.roles?.includes('ADMIN')) {
      console.log('사용자 roles 기반으로 user 모드 결정');
      return "user";
    }

    // 6. 기본값
    console.log('기본값 user 모드 사용');
    return "user";
  }, [variant, pathname, isHydrated, viewMode, user?.roles, isAuthenticated]);

  // 사이드바 축소 상태를 CSS 변수로 설정 (전문가 모드에서는 IconOnlySidebar가 관리)
  useEffect(() => {
    if (updateCSSVariable && effectiveVariant !== "expert" && typeof window !== "undefined") {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isCollapsed ? '64px' : '256px'
      );
    }
  }, [isCollapsed, updateCSSVariable, effectiveVariant]);

  // 모든 페이지에서 DashboardLayout의 IconOnlySidebar 사용하도록 완전 비활성화
  // 기존 Sidebar는 더 이상 사용하지 않음
  return null;

  // 하이드레이션 완료 체크 - 초기값이 true로 설정되어 있으므로 추가 로직 불필요

  // viewMode는 Context에서 자동으로 동기화됩니다





  // 채팅 기록 초기화 - 로컬 스토리지에서 세션 로드
  useEffect(() => {
    console.log('사이드바: 채팅 기록 초기화 useEffect 실행', { isAuthenticated, pathname, isActivePath: isActivePath("/chat") });

    if (isAuthenticated && isActivePath("/chat")) {
      console.log('사이드바: AI 채팅 메뉴 활성화, 로컬 스토리지에서 세션 로드');

      // 로컬 스토리지에서 채팅 세션 로드
      const loadLocalChatSessions = () => {
        try {
          const stored = localStorage.getItem('chat-sessions');
          if (stored) {
            const sessions = JSON.parse(stored);
            setChatHistory(sessions);
            console.log('사이드바: 로컬 스토리지에서 채팅 세션 로드 완료:', sessions.length, '개');
          } else {
            setChatHistory([]);
          }
        } catch (error) {
          console.error('사이드바: 로컬 스토리지에서 채팅 세션 로드 실패:', error);
          setChatHistory([]);
        }
      };

      loadLocalChatSessions();
    } else {
      console.log('사이드바: AI 채팅 메뉴 비활성화 또는 인증되지 않음');
    }
  }, [isAuthenticated, pathname]);

  // 채팅 세션 업데이트 이벤트 리스너
  useEffect(() => {
    console.log('사이드바: 채팅 세션 업데이트 이벤트 리스너 등록 시작');

    const handleChatSessionsUpdate = (event: CustomEvent) => {
      console.log('사이드바: chatSessionsUpdated 이벤트 수신:', event.detail);
      const { sessions } = event.detail;
      setChatHistory(sessions);
    };

    // 커스텀 이벤트 리스너 등록
    console.log('사이드바: chatSessionsUpdated 이벤트 리스너 등록');
    window.addEventListener('chatSessionsUpdated', handleChatSessionsUpdate as EventListener);

    return () => {
      console.log('사이드바: chatSessionsUpdated 이벤트 리스너 제거');
      window.removeEventListener('chatSessionsUpdated', handleChatSessionsUpdate as EventListener);
    };
  }, []);

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, show: false }));
    };

    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    // 간단한 테마 토글 (class 전략)
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("consulton-theme", theme);
    }
  }, [theme]);

  // 메뉴 정의: 전문가/클라이언트 대시보드 연동
  const primaryMenu: MenuItem[] = useMemo(() => {
    console.log('메뉴 재계산:', { effectiveVariant, user, isAuthenticated, viewMode });
    
    if ((effectiveVariant as string) === "expert") {
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

    // 클라이언트 모드 메뉴 - 로그인 상태에 따라 다르게 표시
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

    clientMenu.push(
      {
        id: "billing",
        name: "결제 및 크레딧",
        icon: CreditCard,
        path: "/credits",
      }
    );

    return clientMenu;
  }, [effectiveVariant, user, isAuthenticated, viewMode]);



  const isActivePath = (itemPath: string) => {
    if (itemPath === "/") return pathname === "/";
    if (itemPath === "/summary") {
      return pathname === "/summary" || pathname.startsWith("/summary/");
    }
    // 전문가 대시보드 루트는 정확히 일치할 때만 활성화
    if (itemPath === "/dashboard/expert") {
      return pathname === "/dashboard/expert";
    }
    // 클라이언트 대시보드 루트도 동일
    if (itemPath === "/dashboard") {
      return pathname === "/dashboard";
    }
    // 대시보드 하위 경로들 처리
    if (itemPath.startsWith("/dashboard/")) {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const handleNavigate = (item: MenuItem) => {
    console.log('메뉴 클릭:', { item: item.id, isAuthenticated, user, pathname, effectiveVariant });
    
    // 전문가 찾기 메뉴만 로그인 없이도 접근 가능
    if (item.id === "experts") {
      console.log(`${item.name} 메뉴 클릭 - 현재 상태:`, { isAuthenticated, user });
      
      // 로그인된 사용자인 경우 바로 이동
      if (isAuthenticated && user) {
        console.log(`로그인된 사용자 - ${item.name} 페이지로 이동`);
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }
      
      // 로그인되지 않은 사용자도 전문가 찾기 페이지로 이동 가능
      console.log(`비로그인 사용자 - ${item.name} 페이지로 이동`);
      router.push(item.path as any);
      if (onClose) onClose();
      return;
    }
    
    // AI채팅 상담 메뉴는 로그인 필요
    if (item.id === "chat") {
      console.log('AI채팅 상담 메뉴 클릭 - 현재 상태:', { isAuthenticated, user });
      
      if (pathname === "/chat") {
        sessionStorage.setItem("showQuickChatModal", "true");
        window.location.reload();
        return;
      }
      
      // 로그인된 사용자인 경우 바로 이동
      if (isAuthenticated && user) {
        console.log('로그인된 사용자 - AI채팅 상담 페이지로 이동');
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }
      
      // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
      console.log('비로그인 사용자 - 로그인 페이지로 리다이렉트');
      router.push(`/auth/login?redirect=${encodeURIComponent(item.path)}`);
      if (onClose) onClose();
      return;
    }
    
    // 로그아웃 상태에서 다른 메뉴 클릭 시 로그인 페이지로 이동
    if (!isAuthenticated) {
      console.log('비로그인 사용자 - 로그인 페이지로 리다이렉트:', item.path);
      router.push(`/auth/login?redirect=${encodeURIComponent(item.path)}` as any);
      if (onClose) onClose();
      return;
    }
    
    // 로그인된 사용자의 경우 추가 검증
    if (isAuthenticated && user) {
      console.log('로그인된 사용자 메뉴 클릭:', { item: item.id, userRoles: user.roles, effectiveVariant });
      
      // 전문가 모드에서 전문가 전용 메뉴 클릭 시
      if ((effectiveVariant as string) === "expert" && user.roles?.includes("EXPERT")) {
        console.log('전문가 모드에서 전문가 메뉴 클릭:', item.id);
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }

      // 클라이언트 모드에서 일반 사용자 메뉴 클릭 시
      if ((effectiveVariant as string) === "user" && (user.roles?.includes("USER") || user.roles?.includes("ADMIN"))) {
        console.log('클라이언트 모드에서 일반 사용자 메뉴 클릭:', item.id);
        router.push(item.path as any);
        if (onClose) onClose();
        return;
      }
    }
    
    if (pathname === "/chat" && item.id !== "chat") {
      // AI채팅 상담 중 다른 메뉴 클릭 시 바로 이동 (확인 메시지 없음)
      console.log('AI채팅 상담 중 다른 메뉴로 이동:', item.name);
    }

    console.log('정상 메뉴 이동:', item.path);
    router.push(item.path as any);
    if (onClose) onClose();
  };

  // 전문가 상담 일정 데이터 (예시)
  const upcomingConsultations = useMemo(() => {
    const consultations: {
      id: string;
      expertAvatar: string;
      expertName: string;
      topic: string;
      scheduledTime: string;
      duration: number;
      consultationType: "chat" | "voice" | "video";
    }[] = [
      {
        id: "1",
        expertAvatar: "박",
        expertName: "박지영",
        topic: "스트레스 관리 및 불안감 치료",
        scheduledTime: "2024-01-15T14:00:00",
        duration: 60,
        consultationType: "video",
      },
      {
        id: "2",
        expertAvatar: "이",
        expertName: "이민수",
        topic: "계약서 검토 및 법적 자문",
        scheduledTime: "2024-01-15T16:00:00",
        duration: 45,
        consultationType: "voice",
      },
      {
        id: "3",
        expertAvatar: "이",
        expertName: "이소연",
        topic: "투자 포트폴리오 구성",
        scheduledTime: "2024-01-16T10:00:00",
        duration: 90,
        consultationType: "chat",
      },
    ];
    return consultations;
  }, []);

  const handleConsultationClick = (consultation: {
    id: string;
    expertAvatar: string;
    expertName: string;
    topic: string;
    scheduledTime: string;
    duration: number;
    consultationType: "chat" | "voice" | "video";
  }) => {
    console.log("전문가 상담 일정 클릭:", consultation);
    // 전문가 상담 페이지로 이동
    router.push("/expert-consultation");
    if (onClose) onClose();
  };

  const formatConsultationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit" 
    }).replace(/\. /g, "/").replace(".", "");
  };

  const formatConsultationTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  };

  return (
    <>
      {/* 컨텍스트 메뉴 */}
      {contextMenu.show && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            onClick={() => {
              // 공유하기 기능
              if (navigator.share) {
                navigator.share({
                  title: contextMenu.item,
                  text: `AI채팅 상담 기록: ${contextMenu.item}`
                });
              } else {
                // 클립보드에 복사
                navigator.clipboard.writeText(`AI채팅 상담 기록: ${contextMenu.item}`);
              }
              setContextMenu(prev => ({ ...prev, show: false }));
            }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            공유하기
          </button>
          <button
            onClick={() => {
              // 이름 바꾸기 기능 - 인라인 편집 모드 활성화
              const chatItem = chatHistory.find(item => item.title === contextMenu.item);
              if (chatItem) {
                setEditingItem({ id: chatItem.id, title: chatItem.title });
              }
              setContextMenu(prev => ({ ...prev, show: false }));
            }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            이름 바꾸기
          </button>
          <button
            onClick={async () => {
              // 삭제 기능
              if (confirm(`"${contextMenu.item}"을(를) 삭제하시겠습니까?`)) {
                const chatItem = chatHistory.find(item => item.title === contextMenu.item);
                if (chatItem) {
                  // 로컬 상태 업데이트
                  const updatedSessions = chatHistory.filter(item => item.id !== chatItem.id);
                  setChatHistory(updatedSessions);

                  // 로컬 스토리지 업데이트
                  localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));

                  // 채팅 페이지에 삭제 알림
                  const event = new CustomEvent('chatSessionDeleted', {
                    detail: { sessionId: chatItem.id, sessions: updatedSessions }
                  });
                  window.dispatchEvent(event);
                }
              }
              setContextMenu(prev => ({ ...prev, show: false }));
            }}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>
        </div>
      )}

      <button
        onClick={onToggle}
        className="fixed top-20 left-4 z-50 lg:hidden p-2 bg-white rounded-md shadow border border-gray-200"
      >
        <PanelLeft className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-30 ${
          (effectiveVariant as string) === "expert"
            ? "bg-gradient-to-b from-blue-50 to-indigo-50 border-r border-blue-200"
            : "bg-white border-r border-gray-200"
        } transform transition-all duration-300 lg:translate-x-0 ${
          isCollapsed ? "w-16" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 네비게이션 바 높이만큼 상단 여백 */}
          <div className="h-16 flex-shrink-0" />



          {/* 메인 컨텐츠 영역 */}
          <div className="flex-1 flex flex-col min-h-0 px-3 py-4">
            {/* 접기 버튼 */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-2 text-gray-600 hover:text-gray-800 transition-colors ${
                  isCollapsed ? 'mx-auto' : ''
                }`}
                title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* 고정 메뉴 영역 */}
            <nav className="space-y-1 flex-shrink-0 mb-4">
              {!isHydrated ? (
                // 로딩 상태의 메뉴 스켈레톤
                Array.from({ length: (effectiveVariant as string) === "expert" ? 7 : 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2"
                  >
                    <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse flex-1 max-w-24"></div>
                  </div>
                ))
              ) : (
                // 실제 메뉴
                primaryMenu.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.path);
                  // 전문가 찾기 메뉴는 로그인 없이도 접근 가능, 나머지는 로그인 필요
                  const isDisabled = item.id === "experts" ? false : !isAuthenticated;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item)}
                      disabled={isDisabled}
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                      } rounded-md py-2 text-sm font-medium transition-colors ${
                        isDisabled
                          ? "text-gray-400 cursor-not-allowed opacity-60"
                          : active
                          ? (effectiveVariant as string) === "expert"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-gray-100 text-gray-900"
                          : (effectiveVariant as string) === "expert"
                            ? "text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      title={isDisabled ? "로그인이 필요합니다" : item.name}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isDisabled 
                            ? "text-gray-400" 
                            : active 
                            ? (effectiveVariant as string) === "expert" 
                              ? "text-blue-900" 
                              : "text-gray-900"
                            : (effectiveVariant as string) === "expert"
                              ? "text-blue-600"
                              : "text-gray-500"
                        }`}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                      {/* 상담 요약 알림 표시 */}
                      {!isCollapsed && item.id === "summary" && summaryNotificationCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                          {summaryNotificationCount}
                        </span>
                      )}
                      {/* 일반 알림 표시 */}
                      {!isCollapsed && item.id === "notifications" && notificationCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                          {notificationCount}
                        </span>
                      )}
                      {!isCollapsed && isDisabled && (
                        <span className="ml-auto text-xs text-gray-400">로그인 필요</span>
                      )}
                    </button>
                  );
                })
              )}
            </nav>

            {/* 스크롤 가능한 채팅 기록 영역 - AI 상담 메뉴 선택 시에만 표시 */}
            {!isCollapsed && isAuthenticated && isActivePath("/chat") && (
              <div className="mt-16 flex-1 overflow-y-auto min-h-0">
                <p className="px-3 text-xs font-semibold text-gray-400 mb-3">
                  AI 채팅 상담
                </p>
                <ul className="space-y-1">
                  {chatHistory.map((chatItem) => (
                    <li
                      key={chatItem.id}
                      className="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer relative group"
                      onClick={() => {
                        // 채팅 세션 선택 이벤트 발송
                        const event = new CustomEvent('chatSessionSelected', {
                          detail: { sessionId: chatItem.id }
                        });
                        window.dispatchEvent(event);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ show: true, x: e.clientX, y: e.clientY, item: chatItem.title });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          {editingItem?.id === chatItem.id ? (
                            <input
                              type="text"
                              value={editingItem?.title || ''}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && editingItem) {
                                  // 로컬 상태 업데이트
                                  const updatedSessions = chatHistory.map(item =>
                                    item.id === chatItem.id
                                      ? { ...item, title: editingItem.title }
                                      : item
                                  );
                                  setChatHistory(updatedSessions);

                                  // 로컬 스토리지 업데이트
                                  localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));

                                  // 채팅 페이지에 업데이트 알림
                                  const event = new CustomEvent('chatSessionsUpdated', {
                                    detail: { sessions: updatedSessions }
                                  });
                                  window.dispatchEvent(event);

                                  setEditingItem(null);
                                } else if (e.key === 'Escape') {
                                  // 취소
                                  setEditingItem(null);
                                }
                              }}
                              onBlur={async () => {
                                if (editingItem) {
                                  // 로컬 상태 업데이트
                                  const updatedSessions = chatHistory.map(item =>
                                    item.id === chatItem.id
                                      ? { ...item, title: editingItem.title }
                                      : item
                                  );
                                  setChatHistory(updatedSessions);

                                  // 로컬 스토리지 업데이트
                                  localStorage.setItem('chat-sessions', JSON.stringify(updatedSessions));

                                  // 채팅 페이지에 업데이트 알림
                                  const event = new CustomEvent('chatSessionsUpdated', {
                                    detail: { sessions: updatedSessions }
                                  });
                                  window.dispatchEvent(event);

                                  setEditingItem(null);
                                }
                              }}
                              className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <span className="truncate block">{chatItem.title}</span>
                          )}
                        </div>
                        <button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded flex-shrink-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({ show: true, x: e.clientX, y: e.clientY, item: chatItem.title });
                          }}
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 스크롤 가능한 전문가 상담 일정 영역 - 전문가 상담 메뉴 선택 시에만 표시 */}
            {!isCollapsed && isAuthenticated && isActivePath("/expert-consultation") && (
              <div className="mt-16 flex-1 overflow-y-auto min-h-0">
                <p className="px-3 text-xs font-semibold text-gray-400 mb-3">
                  다가오는 상담 일정
                </p>
                <ul className="space-y-1">
                  {upcomingConsultations.map((consultation) => (
                    <li
                      key={consultation.id}
                      className="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer relative group"
                      onClick={() => handleConsultationClick(consultation)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {consultation.expertName} 전문가
                          </span>
                          <span className="text-xs text-gray-500">
                            {consultation.duration}분
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {consultation.topic}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatConsultationDate(consultation.scheduledTime)}</span>
                          <span>{formatConsultationTime(consultation.scheduledTime)}</span>
                          {consultation.consultationType === "chat" && (
                            <MessageCircle className="h-3 w-3 text-gray-400" />
                          )}
                          {consultation.consultationType === "voice" && (
                            <Phone className="h-3 w-3 text-gray-400" />
                          )}
                          {consultation.consultationType === "video" && (
                            <Video className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 크레딧/정산 정보 표시 - 하단 고정 */}
          {isAuthenticated && user && (
            <div className={`border-t p-3 flex-shrink-0 ${
              (effectiveVariant as string) === "expert"
                ? "border-blue-200"
                : "border-gray-200"
            }`}>
              {(effectiveVariant as string) === "expert" ? (
                // 전문가 모드: 정산 정보 표시
                <div className="bg-blue-50 rounded-md px-3 py-2">
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} mb-2`}>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {!isCollapsed && (
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
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">정산 예정액</span>
                      <span className="text-sm font-bold text-blue-700">
                        {formatCredits(settlementAmount)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // 사용자 모드: 기존 크레딧 표시
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-md px-3 py-2 bg-gray-50`}>
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        보유 크레딧
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {user?.credits?.toLocaleString() || 0} 크레딧
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </aside>

      {/* 비밀번호 변경 모달 */}
      {/* <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      /> */}
    </>
  );
};

export default Sidebar;
