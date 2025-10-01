'use client';

import { useParams } from 'next/navigation';
import ExpertProfileDetail from '@/components/experts/ExpertProfileDetail';

export default function ExpertDetailPage() {
  const params = useParams();
  const displayId = params.id as string;

  return (
    <ExpertProfileDetail
      displayId={displayId}
      isOwner={false}
      showEditMode={false}
      hideSidebar={true}
      hideBackButton={false}
      hideActions={false}
    />
  );
}