'use client';

import { useEffect, useRef, useState } from 'react';

export function useDynamicAgora() {
  const rtcRef = useRef<any>(null);
  const rtmRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    return () => {
      // 안전한 정리
      try {
        const c = rtcRef.current;
        if (c && typeof c.removeAllListeners === 'function') {
          c.removeAllListeners();
        }
      } catch (e) {
        console.warn('RTC cleanup error:', e);
      }
      try {
        const c = rtmRef.current;
        if (c && typeof c.removeAllListeners === 'function') {
          c.removeAllListeners();
        }
      } catch (e) {
        console.warn('RTM cleanup error:', e);
      }
    };
  }, []);

  const loadRtc = async () => {
    if (rtcRef.current) return rtcRef.current;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 동적 import를 try-catch로 감싸서 안전하게 처리
      const AgoraRTC = await import('agora-rtc-sdk-ng').catch(() => {
        throw new Error('Agora RTC SDK를 로드할 수 없습니다.');
      });
      
      rtcRef.current = AgoraRTC.default || AgoraRTC;
      return rtcRef.current;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'RTC SDK 로드 실패';
      setError(errorMessage);
      console.error('RTC SDK 로드 오류:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadRtm = async () => {
    if (rtmRef.current) return rtmRef.current;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 동적 import를 try-catch로 감싸서 안전하게 처리
      const AgoraRTM = await import('agora-rtm-sdk').catch(() => {
        throw new Error('Agora RTM SDK를 로드할 수 없습니다.');
      });
      
      rtmRef.current = AgoraRTM.default || AgoraRTM;
      return rtmRef.current;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'RTM SDK 로드 실패';
      setError(errorMessage);
      console.error('RTM SDK 로드 오류:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rtcRef,
    rtmRef,
    isClient,
    isLoading,
    error,
    loadRtc,
    loadRtm,
  };
}
