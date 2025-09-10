'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchExperts } from '@/lib/experts';
import Link from 'next/link';

export default function ExpertsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['experts', { q, page }],
    queryFn: () => fetchExperts({ q, page, size: 12, sort: 'rating' }),
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">전문가 찾기</h1>

      <div className="mb-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="이름/직함/소개 검색"
          className="input input-bordered w-full rounded-xl border px-3 py-2"
        />
        <button
          onClick={() => setPage(1)}
          className="rounded-xl border px-4 py-2"
        >
          검색
        </button>
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">로드 에러</p>}
      {data && (
        <>
          {data.items.length === 0 && <p>검색 결과가 없습니다.</p>}
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((e) => (
              <li key={e.displayId} className="rounded-2xl border p-4 hover:shadow">
                <Link href={`/experts/${e.displayId}`} className="block">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-200" />
                    <div>
                      <div className="font-semibold">
                        {e.name} <span className="text-gray-500">· {e.title ?? ''}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ⭐ {e.ratingAvg.toFixed(1)} ({e.reviewCount})
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {e.categories.join(', ')}
                      </div>
                    </div>
                  </div>
                  {e.bio && <p className="mt-3 line-clamp-2 text-sm text-gray-700">{e.bio}</p>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              페이지 {page} / {Math.max(1, Math.ceil(data.total / data.size))}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.size)}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </>
      )}
    </main>
  );
}