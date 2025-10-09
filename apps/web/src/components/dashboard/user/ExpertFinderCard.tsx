'use client';

import { useRouter } from 'next/navigation';

export function ExpertFinderCard() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 ml-3">전문가 찾기</h3>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        다양한 분야의 전문가와 상담을 예약하세요
      </p>
      <button
        onClick={() => router.push('/experts')}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        전문가 보기
      </button>
    </div>
  );
}
