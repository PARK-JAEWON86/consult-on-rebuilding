'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Msg = { id: string; uid: string; text: string; ts: number };

export function useRtmChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const channelRef = useRef<any>(null);
  const clientRef = useRef<any>(null);

  const bind = useCallback((client: any, channel: any) => {
    clientRef.current = client;
    channelRef.current = channel;
    channel.on('ChannelMessage', (msg: any, memberId: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), uid: memberId, text: msg.text, ts: Date.now() },
      ]);
    });
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    await channelRef.current?.sendMessage({ text });
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), uid: 'me', text, ts: Date.now() },
    ]);
  }, []);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, bind, send, reset };
}
