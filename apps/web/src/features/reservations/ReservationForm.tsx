'use client';
import { useState } from 'react';
import dayjs from 'dayjs';

type Props = {
  expertId: number;
  defaultMinutes?: number;
  onSubmit: (v: { startAtISO: string; endAtISO: string; note?: string }) => Promise<void>|void;
  onClose: () => void;
};

export default function ReservationForm({ expertId, defaultMinutes = 30, onSubmit, onClose }: Props) {
  const [startLocal, setStartLocal] = useState<string>('');
  const [minutes, setMinutes] = useState<number>(defaultMinutes);
  const [note, setNote] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const submit = async () => {
    setErr('');
    if (!startLocal) { setErr('시작 시간을 선택하세요'); return; }
    const start = dayjs(startLocal);
    const end = start.add(minutes, 'minute');
    if (!end.isAfter(start)) { setErr('종료 시간이 시작 이후여야 합니다'); return; }
    await onSubmit({ startAtISO: start.toDate().toISOString(), endAtISO: end.toDate().toISOString(), note: note || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold">예약 만들기</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-600">시작 (local)</span>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">길이(분)</span>
            <input
              type="number"
              min={15}
              step={15}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value || '0', 10))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">메모(선택)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              rows={3}
            />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">취소</button>
          <button onClick={submit} className="rounded-xl border bg-black px-4 py-2 text-white">예약</button>
        </div>
      </div>
    </div>
  );
}
