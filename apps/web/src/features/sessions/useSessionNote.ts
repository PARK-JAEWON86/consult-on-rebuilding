'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMySessionNote, saveMySessionNote } from '@/lib/sessions';

export function useSessionNote(displayId: string, userId: number) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 로컬 스토리지 키
  const localKey = `note-${displayId}-${userId}`;

  // 초기 로드: 서버 → 로컬 병합 (서버 우선)
  useEffect(() => {
    const loadNote = async () => {
      try {
        const serverNote = await getMySessionNote(displayId, userId);
        const localNote = localStorage.getItem(localKey) || '';
        
        // 서버 내용이 있으면 서버 우선, 없으면 로컬
        const finalContent = serverNote.content || localNote;
        setContent(finalContent);
      } catch (error) {
        // 서버 오류 시 로컬 내용 사용
        const localNote = localStorage.getItem(localKey) || '';
        setContent(localNote);
      }
    };

    loadNote();
  }, [displayId, userId, localKey]);

  // 저장 함수
  const save = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      // 서버 저장
      await saveMySessionNote(displayId, userId, newContent);
      
      // 로컬 자동 저장
      localStorage.setItem(localKey, newContent);
      
      setContent(newContent);
    } catch (error) {
      // 서버 저장 실패해도 로컬은 저장
      localStorage.setItem(localKey, newContent);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [displayId, userId, localKey]);

  // 실시간 로컬 저장 (타이핑 중)
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    localStorage.setItem(localKey, newContent);
  }, [localKey]);

  return { content, updateContent, save, saving };
}
