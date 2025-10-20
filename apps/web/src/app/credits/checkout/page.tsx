'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import './checkout.css';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';

// 랜덤 customerKey 생성 (샘플 코드 참고)
function generateRandomString() {
  return typeof window !== 'undefined'
    ? window.btoa(Math.random().toString()).slice(0, 20)
    : '';
}

function CheckoutContent() {
  const sp = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState({ currency: 'KRW', value: 0 });
  const [isReady, setIsReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState<any>(null);
  const [customerKey] = useState(() => generateRandomString());

  // URL 파라미터에서 orderId와 amount 가져오기
  useEffect(() => {
    try {
      const orderIdParam = sp.get('orderId') || '';
      const amountParam = parseInt(sp.get('amount') || '0', 10);
      setOrderId(orderIdParam);
      setAmount({ currency: 'KRW', value: amountParam });
      setIsReady(true);
    } catch (error) {
      console.error('Error parsing search params:', error);
      setIsReady(true);
    }
  }, [sp]);

  // ------ 결제위젯 초기화 ------
  useEffect(() => {
    async function fetchPaymentWidgets() {
      if (!isReady || !customerKey || !clientKey) {
        console.log('Missing required data:', { isReady, customerKey, hasClientKey: !!clientKey });
        return;
      }

      if (amount.value === 0) {
        console.log('Amount is 0, waiting...');
        return;
      }

      try {
        console.log('Initializing Toss Payments with:', { clientKey, customerKey, amount });
        const tossPayments = await loadTossPayments(clientKey);

        // 회원 결제
        const widgets = tossPayments.widgets({ customerKey });
        setWidgets(widgets);
        console.log('Widgets loaded successfully');
      } catch (error) {
        console.error('Error loading Toss Payments:', error);
        alert('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    }

    fetchPaymentWidgets();
  }, [isReady, customerKey, amount.value]);

  // ------ 결제 UI 렌더링 ------
  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }

      try {
        console.log('Starting to render payment widgets with amount:', amount);

        // DOM 요소가 준비될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        // DOM 요소 존재 확인
        const paymentMethodEl = document.querySelector('#payment-method');
        const agreementEl = document.querySelector('#agreement');

        if (!paymentMethodEl || !agreementEl) {
          console.error('DOM elements not found:', {
            paymentMethodEl: !!paymentMethodEl,
            agreementEl: !!agreementEl
          });
          // 재시도
          setTimeout(() => renderPaymentWidgets(), 200);
          return;
        }

        console.log('DOM elements found, proceeding with render');

        // ------ 주문의 결제 금액 설정 ------
        await widgets.setAmount(amount);
        console.log('Amount set successfully');

        await Promise.all([
          // ------  결제 UI 렌더링 ------
          widgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          }),
          // ------  이용약관 UI 렌더링 ------
          widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          }),
        ]);

        setReady(true);
        console.log('Payment widgets rendered successfully');
      } catch (error) {
        console.error('Error rendering payment widgets:', error);
        // 에러가 발생해도 ready를 true로 설정하여 UI가 표시되도록 함
        setReady(true);
      }
    }

    renderPaymentWidgets();
  }, [widgets]); // amount 의존성 제거 - 무한 루프 방지

  const handlePayment = async () => {
    if (!widgets || !ready) return;

    try {
      // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
      // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
      // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
      await widgets.requestPayment({
        orderId,
        orderName: '크레딧 충전',
        successUrl: `${window.location.origin}/credits/checkout/success`,
        failUrl: `${window.location.origin}/credits/checkout/fail`,
      });
    } catch (error) {
      // 에러 처리하기
      console.error('Payment request failed:', error);
    }
  };

  if (!isReady) {
    return (
      <Card className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!orderId || !amount.value) {
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

  // 현재 날짜 및 시간 포맷팅
  const now = new Date();
  const paymentDate = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const paymentTime = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">크레딧 충전 결제</h1>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-gray-600 mb-2">주문번호: <span className="font-mono">{orderId}</span></p>
          <p className="text-gray-600 mb-2">결제 날짜: <span className="font-medium">{paymentDate} {paymentTime}</span></p>
          <p className="text-gray-900 text-xl font-bold">결제 금액: {amount.value.toLocaleString()}원</p>
        </div>
      </Card>

      {/* 로딩 오버레이 */}
      {!ready && (
        <Card className="text-center py-12">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">결제 화면을 준비하고 있습니다...</p>
        </Card>
      )}

      {/* 결제 수단 선택 - 항상 렌더링 (위젯이 주입될 컨테이너) */}
      <div id="payment-method" className="w-full" style={{ display: ready ? 'block' : 'none' }} />

      {/* 이용약관 - 항상 렌더링 (위젯이 주입될 컨테이너) */}
      <div id="agreement" className="w-full" style={{ display: ready ? 'block' : 'none' }} />

      {/* 결제 버튼 */}
      {ready && (
        <>
          <Card>
            <Button
              onClick={handlePayment}
              disabled={!ready}
              className="w-full py-4 text-lg font-semibold"
            >
              {amount.value.toLocaleString()}원 결제하기
            </Button>
          </Card>

          <div className="text-center">
            <Link href="/credits">
              <Button variant="ghost">취소</Button>
            </Link>
          </div>
        </>
      )}
    </div>
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
