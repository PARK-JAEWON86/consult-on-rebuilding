'use client';

import { useEffect, useRef } from 'react';

export function useDynamicAgora() {
  const rtcRef = useRef<any>(null);
  const rtmRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // 안전한 정리
      try {
        const c = rtcRef.current;
        if (c) c.removeAllListeners?.();
      } catch {}
      try {
        const c = rtmRef.current;
        if (c) c.removeAllListeners?.();
      } catch {}
    };
  }, []);

  return {
    rtcRef,
    rtmRef,
    loadRtc: async () => (await import('agora-rtc-sdk-ng')).default,
    loadRtm: async () => (await import('agora-rtm-sdk')),
  };
}
