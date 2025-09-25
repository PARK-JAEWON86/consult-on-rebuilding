'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant: 'user' | 'expert';
}

export default function DashboardLayout({ children, variant }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        variant={variant}
      />

      <div
        className="absolute inset-0 pt-16 overflow-auto"
        style={{
          left: isLargeScreen ? '256px' : '0',
          marginLeft: 0
        }}
      >
        <div className="w-full px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}