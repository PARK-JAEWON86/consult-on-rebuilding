'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { XCircle } from 'lucide-react';

function FailContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [failInfo, setFailInfo] = useState({ code: '', message: '', orderId: '' });

  useEffect(() => {
    setFailInfo({
      code: sp.get('code') || '알 수 없는 오류',
      message: sp.get('message') || '결제에 실패했습니다.',
      orderId: sp.get('orderId') || '',
    });
  }, [sp]);

  return (
    <Card className="text-center py-12">
      <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
      <p className="text-gray-600 mb-6">{failInfo.message}</p>
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        {failInfo.orderId && (
          <p className="text-gray-600 mb-2">주문번호: <span className="font-mono">{failInfo.orderId}</span></p>
        )}
        <p className="text-gray-600">오류 코드: <span className="font-mono text-red-600">{failInfo.code}</span></p>
      </div>
      <div className="space-y-3">
        <Button onClick={() => router.push('/credits')} className="w-full">
          다시 시도하기
        </Button>
        <Button onClick={() => router.push('/dashboard')} variant="ghost" className="w-full">
          대시보드로 돌아가기
        </Button>
      </div>
    </Card>
  );
}

export default function FailPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={
        <Card className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </Card>
      }>
        <FailContent />
      </Suspense>
    </main>
  );
}
