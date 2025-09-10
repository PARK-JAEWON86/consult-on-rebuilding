'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const sp = useSearchParams();
  const orderId = sp.get('orderId') || '';
  const amount = parseInt(sp.get('amount') || '0', 10);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function run() {
      try {
        // 동적 로드 (SSR 회피)
        // 공식 SDK: @tosspayments/payment-widget-sdk
        const mod: any = await import('@tosspayments/payment-widget-sdk');
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
        const customerKey = orderId; // 데모: orderId를 임시 사용 (실제는 로그인 유저 ID 등)
        const paymentWidget = mod.loadPaymentWidget(clientKey, customerKey);

        // 간단 결제창: 카드
        await paymentWidget.requestPayment({
          orderId,
          orderName: 'Consult On 크레딧 충전',
          successUrl: `${process.env.NEXT_PUBLIC_APP_BASE}/credits/success-callback`,
          failUrl: `${process.env.NEXT_PUBLIC_APP_BASE}/credits/fail`,
          amount,
          // customerName, customerEmail 등은 후속 단계에서 추가 가능
        });
      } catch (e: any) {
        console.error(e);
        setErr('결제창 호출에 실패했습니다.');
      }
    }
    if (orderId && amount > 0) run();
  }, [orderId, amount]);

  if (!orderId || !amount) {
    return <main className="container mx-auto px-4 py-8">잘못된 요청입니다.</main>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">결제 준비 중…</h1>
      <p className="mt-2 text-gray-600">주문번호: {orderId}, 금액: {amount.toLocaleString()}원</p>
      {err && <p className="mt-4 text-red-600">{err}</p>}
    </main>
  );
}
