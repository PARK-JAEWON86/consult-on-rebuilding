'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function ExpertDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        variant="expert"
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="lg:ml-64">
        {children}
      </div>
    </div>
  );
}
