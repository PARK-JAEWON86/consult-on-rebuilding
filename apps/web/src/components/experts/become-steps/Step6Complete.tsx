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
    <div className="py-8 space-y-8">
      {/* 상단: 성공 아이콘 및 메인 메시지 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            신청이 완료되었습니다!
          </h2>
          <p className="text-gray-600">
            전문가 등록 신청이 성공적으로 접수되었습니다.
          </p>
        </div>
      </div>

      {/* 중앙: 2단 레이아웃 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 왼쪽: 알림설정 및 예상 검수기간 */}
        <div className="lg:w-1/3 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center text-sm">
              <Info className="w-4 h-4 mr-2" />
              다음 단계 안내
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[70px]">검수 기간:</span>
                <span>평균 1~3 영업일 소요됩니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[70px]">결과 안내:</span>
                <span>검수 완료 후 등록하신 이메일({email})로 결과를 안내드립니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[70px]">추가 서류:</span>
                <span>필요 시 자격증 또는 경력 증빙 서류를 요청드릴 수 있습니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[70px]">승인 후:</span>
                <span>전문가로 승인되면 바로 상담 서비스를 시작하실 수 있습니다.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 진행상황 */}
        <div className="lg:w-2/3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">
              진행 상황
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">신청 접수 완료</p>
                  <p className="text-sm text-gray-600">전문가 등록 신청이 성공적으로 접수되었습니다</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">서류 검수 진행 중</p>
                  <p className="text-sm text-gray-600">평균 1~3 영업일 소요됩니다</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-500">검수 완료 및 결과 안내</p>
                  <p className="text-sm text-gray-500">이메일로 결과를 안내드립니다</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-500">전문가 활동 시작</p>
                  <p className="text-sm text-gray-500">승인 후 상담 서비스를 시작하실 수 있습니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 액션 버튼 */}
      <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          홈으로 돌아가기
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors shadow-md hover:shadow-lg"
        >
          대시보드로 이동
        </button>
      </div>
    </div>
  )
}
