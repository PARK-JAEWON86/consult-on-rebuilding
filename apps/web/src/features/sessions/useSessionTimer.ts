'use client';

import { useEffect, useState } from 'react';

type Phase = 'WAIT' | 'OPEN' | 'CLOSED';

export function useSessionTimer(startAt: string | null, endAt: string | null) {
  const [phase, setPhase] = useState<Phase>('WAIT');
  const [timeLeft, setTimeLeft] = useState({ mm: '00', ss: '00' });

  useEffect(() => {
    if (!startAt || !endAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = new Date(startAt).getTime();
      const endTime = new Date(endAt).getTime();
      const waitEndTime = startTime - 5 * 60 * 1000; // 5분 전
      const sessionEndTime = endTime + 10 * 60 * 1000; // 10분 후

      if (now < waitEndTime) {
        // 대기실 단계
        setPhase('WAIT');
        const diff = waitEndTime - now;
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          mm: minutes.toString().padStart(2, '0'),
          ss: seconds.toString().padStart(2, '0')
        });
      } else if (now <= sessionEndTime) {
        // 입장 가능 단계
        setPhase('OPEN');
        setTimeLeft({ mm: '00', ss: '00' });
      } else {
        // 세션 종료
        setPhase('CLOSED');
        setTimeLeft({ mm: '00', ss: '00' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startAt, endAt]);

  return { phase, timeLeft };
}
