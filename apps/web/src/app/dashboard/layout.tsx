import DashboardUserView from '@/components/dashboard/user/DashboardUserView';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardUserView>{children}</DashboardUserView>;
}