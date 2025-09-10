'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { confirmPayment } from '@/lib/payments';

export default function ConfirmTestPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get('orderId') || '';
  const amount = parseInt(sp.get('amount') || '0', 10);

  const [paymentKey, setPaymentKey] = useState('');
  const [msg, setMsg] = useState('');

  const doConfirm = async () => {
    setMsg('');
    try {
      await confirmPayment({ paymentKey, orderId, amount });
      setMsg('결제 확정 성공');
      // 실제 플로우에서는 여기서 /credits/success 같은 페이지로 이동
    } catch (e: any) {
      setMsg('결제 확정 실패');
      console.error(e);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">결제 확인(개발용)</h1>
      <div className="text-sm text-gray-700">
        <div>orderId: <b>{orderId}</b></div>
        <div>amount: <b>{amount}</b></div>
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-600">paymentKey</label>
        <input
          value={paymentKey}
          onChange={(e) => setPaymentKey(e.target.value)}
          className="mt-1 w-full max-w-md rounded-xl border px-3 py-2"
          placeholder="(샌드박스에서는 테스트용 paymentKey 사용)"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={doConfirm} className="rounded-xl border px-4 py-2">Confirm</button>
        <button onClick={() => router.push('/credits')} className="rounded-xl border px-4 py-2">돌아가기</button>
      </div>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
