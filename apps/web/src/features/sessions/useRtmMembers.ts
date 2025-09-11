'use client';

import { useCallback, useRef, useState } from 'react';

export function useRtmMembers() {
  const [members, setMembers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);

  const bindMemberEvents = useCallback((channel: any) => {
    channelRef.current = channel;
    
    // 현재 멤버 목록 가져오기
    channel.getMembers().then((memberList: string[]) => {
      setMembers(memberList);
    }).catch(() => {
      // 에러 시 빈 배열
      setMembers([]);
    });

    // 멤버 입장/퇴장 이벤트
    channel.on('MemberJoined', (memberId: string) => {
      setMembers(prev => prev.includes(memberId) ? prev : [...prev, memberId]);
    });

    channel.on('MemberLeft', (memberId: string) => {
      setMembers(prev => prev.filter(id => id !== memberId));
    });
  }, []);

  const reset = useCallback(() => setMembers([]), []);

  return { members, bindMemberEvents, reset };
}
