'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listReservationsByUser, cancelReservation } from '@/features/reservations/api';

export default function MyReservationsPage() {
  const userId = 1; // TODO: Auth 연동 시 교체
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['reservations', { userId }],
    queryFn: () => listReservationsByUser(userId),
  });

  const cancelMut = useMutation({
    mutationFn: (displayId: string) => cancelReservation(displayId),
    onMutate: async (displayId: string) => {
      const key = ['reservations', { userId }];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      qc.setQueryData<any>(key, (old: any) =>
        (old || []).map((r: any) => r.displayId === displayId ? { ...r, status: 'CANCELED' } : r)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['reservations', { userId }], ctx.prev);
      alert('취소 중 오류가 발생했습니다.');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations', { userId }] });
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">내 예약</h1>
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">로드 에러</p>}
      {data?.length === 0 && <p>예약이 없습니다.</p>}
      <ul className="space-y-3">
        {data?.map((r) => (
          <li key={r.displayId} className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <div className="text-sm text-gray-600">{r.startAt} ~ {r.endAt}</div>
              <div className="text-xs text-gray-500">상태: {r.status}</div>
            </div>
            <button
              disabled={r.status === 'CANCELED'}
              onClick={() => cancelMut.mutate(r.displayId)}
              className="rounded-xl border px-3 py-2 disabled:opacity-50"
            >
              취소
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
