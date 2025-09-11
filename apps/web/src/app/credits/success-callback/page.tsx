'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { confirmPayment } from '@/lib/payments';
import Card from '@/components/ui/Card';

function CallbackContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const paymentKey = sp.get('paymentKey') || '';
  const orderId = sp.get('orderId') || '';
  const amount = parseInt(sp.get('amount') || '0', 10);
  const [msg, setMsg] = useState('결제 확인 중…');

  useEffect(() => {
    async function run() {
      try {
        await confirmPayment({ paymentKey, orderId, amount });
        router.replace('/credits/success'); // 최종 성공 화면
      } catch (e) {
        console.error(e);
        setMsg('결제 확인 실패');
        router.replace('/credits/fail');
      }
    }
    if (paymentKey && orderId && amount > 0) run();
  }, [paymentKey, orderId, amount, router]);

  return (
    <Card className="text-center py-12">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-900">{msg}</h1>
    </Card>
  );
}

export default function SuccessCallback() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={
        <Card className="text-center py-12">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">로딩 중...</h1>
        </Card>
      }>
        <CallbackContent />
      </Suspense>
    </main>
  );
}
