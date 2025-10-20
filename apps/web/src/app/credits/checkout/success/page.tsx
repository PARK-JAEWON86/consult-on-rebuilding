'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { confirmPayment } from '@/lib/payments';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, Loader2 } from 'lucide-react';

function SuccessContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      setIsConfirming(false);
    },
    onError: (err: any) => {
      setIsConfirming(false);
      // API 에러 응답 구조에 맞게 처리
      const errorMessage = err?.response?.data?.error?.message || err.message || '결제 확인에 실패했습니다.';
      setError(errorMessage);
    },
  });

  useEffect(() => {
    const paymentKey = sp.get('paymentKey');
    const orderId = sp.get('orderId');
    const amount = sp.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setError('잘못된 결제 정보입니다.');
      setIsConfirming(false);
      return;
    }

    // 결제 승인 요청
    confirmMutation.mutate({
      paymentKey,
      orderId,
      amount: parseInt(amount, 10),
    });
  }, [sp]);

  if (isConfirming) {
    return (
      <Card className="text-center py-12">
        <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 확인 중</h1>
        <p className="text-gray-600">잠시만 기다려주세요...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">결제 확인 실패</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.push('/credits')}>크레딧 페이지로 돌아가기</Button>
      </Card>
    );
  }

  return (
    <Card className="text-center py-12">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다</h1>
      <p className="text-gray-600 mb-6">크레딧이 충전되었습니다.</p>
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-gray-600 mb-2">주문번호: <span className="font-mono">{sp.get('orderId')}</span></p>
        <p className="text-gray-600">결제 금액: <span className="font-semibold">{parseInt(sp.get('amount') || '0').toLocaleString()}원</span></p>
      </div>
      <Button onClick={() => router.push('/dashboard')}>대시보드로 이동</Button>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={
        <Card className="text-center py-12">
          <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">로딩 중...</p>
        </Card>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
