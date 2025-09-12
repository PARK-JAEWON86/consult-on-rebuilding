export interface User {
  id: string;
  email: string;
  name?: string;
  roles: ('USER' | 'EXPERT' | 'ADMIN')[];
  createdAt: string;
  updatedAt: string;
  credits?: number;
  avatarUrl?: string;
  title?: string;
  bio?: string;
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  currentCredits: number;
  viewMode?: "user" | "expert";
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
  isExternal?: boolean;
  children?: NavigationItem[];
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  appState?: AppState;
  onAppStateChange?: (newState: AppState) => void;
}

export interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  className?: string;
}
