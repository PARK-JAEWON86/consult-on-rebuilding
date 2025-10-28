'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import ExpertProfileDetail from '@/components/experts/ExpertProfileDetail';

export default function ExpertDetailPage() {
  const params = useParams();
  const displayId = params.id as string;

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [displayId]);

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