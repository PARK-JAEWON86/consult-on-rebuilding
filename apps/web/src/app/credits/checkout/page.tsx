'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

function CheckoutContent() {
  const sp = useSearchParams();
  const orderId = sp.get('orderId') || '';
  const amount = parseInt(sp.get('amount') || '0', 10);

  if (!orderId || !amount) {
    return (
      <Card className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">잘못된 요청입니다</h1>
        <p className="text-gray-600 mb-6">올바르지 않은 결제 요청입니다.</p>
        <Link href="/credits">
          <Button>크레딧 페이지로 돌아가기</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">결제 기능 준비 중</h1>
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-gray-600 mb-2">주문번호: <span className="font-mono">{orderId}</span></p>
        <p className="text-gray-600">결제 금액: <span className="font-semibold">{amount.toLocaleString()}원</span></p>
      </div>
      <div className="bg-yellow-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-yellow-800">
          Toss Payment SDK 기능은 임시로 비활성화되었습니다.
        </p>
      </div>
      <Link href="/credits">
        <Button variant="ghost">크레딧 페이지로 돌아가기</Button>
      </Link>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={
        <Card className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </Card>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
