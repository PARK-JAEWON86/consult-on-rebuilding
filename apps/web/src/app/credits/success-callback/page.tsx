'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmPayment } from '@/lib/payments';
import Card from '@/components/ui/Card';

function CallbackContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [paymentKey, setPaymentKey] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [msg, setMsg] = useState('결제 확인 중…');

  useEffect(() => {
    try {
      const paymentKeyParam = sp.get('paymentKey') || '';
      const orderIdParam = sp.get('orderId') || '';
      const amountParam = parseInt(sp.get('amount') || '0', 10);
      setPaymentKey(paymentKeyParam);
      setOrderId(orderIdParam);
      setAmount(amountParam);
      setIsReady(true);
    } catch (error) {
      console.error('Error parsing search params:', error);
      setIsReady(true);
    }
  }, [sp]);

  useEffect(() => {
    if (!isReady) return;
    
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
  }, [paymentKey, orderId, amount, router, isReady]);

  if (!isReady) {
    return (
      <Card className="text-center py-12">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

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
