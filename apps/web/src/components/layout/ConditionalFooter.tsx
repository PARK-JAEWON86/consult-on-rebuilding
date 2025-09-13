'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // 랜딩페이지에서만 푸터 표시
  const shouldShowFooter = pathname === '/';
  
  if (!shouldShowFooter) {
    return null;
  }
  
  return <Footer />;
}
