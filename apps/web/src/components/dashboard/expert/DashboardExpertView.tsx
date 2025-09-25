import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardExpertView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout variant="expert">
      {children}
    </DashboardLayout>
  );
}