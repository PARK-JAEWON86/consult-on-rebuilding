import DashboardExpertView from '@/components/dashboard/expert/DashboardExpertView';

export default function ExpertDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardExpertView>{children}</DashboardExpertView>;
}