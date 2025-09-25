import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardUserView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout variant="user">
      {children}
    </DashboardLayout>
  );
}