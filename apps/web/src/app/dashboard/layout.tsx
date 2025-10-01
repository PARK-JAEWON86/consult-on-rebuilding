'use client';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Expert dashboard에서는 렌더링하지 않음 (nested layout 방지)
  if (pathname.startsWith('/dashboard/expert')) {
    return <>{children}</>;
  }

  // Import DashboardUserView only when needed
  const DashboardUserView = require('@/components/dashboard/user/DashboardUserView').default;

  return <DashboardUserView>{children}</DashboardUserView>;
}