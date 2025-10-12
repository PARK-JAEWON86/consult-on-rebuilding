'use client'

import React from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Step6CompleteProps {
  email: string
}

export default function Step6Complete({ email }: Step6CompleteProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>

      {/* 메인 메시지 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          신청이 완료되었습니다!
        </h2>
        <p className="text-gray-600">
          전문가 등록 신청이 성공적으로 접수되었습니다.
        </p>
      </div>

      {/* 안내 사항 */}
      <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          다음 단계 안내
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[60px]">검수 기간:</span>
            <span>평균 1~3 영업일 소요됩니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[60px]">결과 안내:</span>
            <span>검수 완료 후 등록하신 이메일({email})로 결과를 안내드립니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[60px]">추가 서류:</span>
            <span>필요 시 자격증 또는 경력 증빙 서류를 요청드릴 수 있습니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[60px]">승인 후:</span>
            <span>전문가로 승인되면 바로 상담 서비스를 시작하실 수 있습니다.</span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
        >
          홈으로 돌아가기
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
        >
          대시보드로 이동
        </button>
      </div>
    </div>
  )
}
