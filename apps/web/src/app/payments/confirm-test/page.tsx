'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { confirmPayment } from '@/lib/payments';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function ConfirmTestContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get('orderId') || '';
  const amount = parseInt(sp.get('amount') || '0', 10);

  const [paymentKey, setPaymentKey] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const doConfirm = async () => {
    setMsg('');
    setIsLoading(true);
    try {
      await confirmPayment({ paymentKey, orderId, amount });
      setMsg('결제 확정 성공');
      // 실제 플로우에서는 여기서 /credits/success 같은 페이지로 이동
    } catch (e: any) {
      setMsg('결제 확정 실패');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제 확인 (개발용)</h1>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="text-sm space-y-2">
          <div>주문번호: <span className="font-mono font-semibold">{orderId}</span></div>
          <div>결제 금액: <span className="font-semibold">{amount.toLocaleString()}원</span></div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Key
        </label>
        <input
          value={paymentKey}
          onChange={(e) => setPaymentKey(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="샌드박스에서는 테스트용 paymentKey 사용"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <Button onClick={doConfirm} loading={isLoading} className="flex-1">
          결제 확인
        </Button>
        <Button variant="ghost" onClick={() => router.push('/credits')} className="flex-1">
          돌아가기
        </Button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${
          msg.includes('성공') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {msg}
        </div>
      )}
    </Card>
  );
}

export default function ConfirmTestPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={
        <Card>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-20 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </Card>
      }>
        <ConfirmTestContent />
      </Suspense>
    </main>
  );
}
