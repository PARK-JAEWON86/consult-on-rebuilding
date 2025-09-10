'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { confirmPayment } from '@/lib/payments';

export default function SuccessCallback() {
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
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{msg}</h1>
    </main>
  );
}
