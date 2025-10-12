'use client'

import React from 'react'
import { FileCheck2, Info, CheckCircle2 } from 'lucide-react'

interface Step5ReviewProps {
  onPrevious: () => void
  onSubmit: () => void
}

export default function Step5Review({
  onPrevious,
  onSubmit,
}: Step5ReviewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">검수 안내</h4>
            <p className="mt-1 text-sm text-gray-600">
              제출하신 정보는 자격/경력 기준에 따라 검수되며, 평균
              1~3영업일 소요됩니다. 필요 시 추가 증빙을 요청드릴 수
              있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          제출 전 확인사항
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>모든 필수 정보가 정확하게 입력되었는지 확인해주세요.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>검수 기간 동안 추가 서류 요청 시 이메일로 안내드립니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>승인 완료 후 등록하신 이메일로 결과를 안내드립니다.</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          onClick={onSubmit}
          className="px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
        >
          신청 제출
        </button>
      </div>
    </div>
  )
}
