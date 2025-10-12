'use client'

import React from 'react'
import { Info, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface Step2PhoneVerificationProps {
  phoneNumber: string
  phoneVerified: boolean
  onOpenAuthModal: () => void
  onPrevious: () => void
  onNext: () => void
  canGoNext: boolean
}

export default function Step2PhoneVerification({
  phoneNumber,
  phoneVerified,
  onOpenAuthModal,
  onPrevious,
  onNext,
  canGoNext,
}: Step2PhoneVerificationProps) {
  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              본인인증 안내
            </h4>
            <p className="text-sm text-blue-800">
              전문가 신뢰도 확보를 위해 간편인증을 진행해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 간편인증 버튼 */}
      <div className="max-w-md mx-auto text-center py-12">
        {!phoneVerified ? (
          <div>
            <ShieldCheck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">본인인증이 필요합니다</h3>
            <p className="text-sm text-gray-600 mb-6">
              전문가 신뢰도 확보를 위해 간편인증을 진행해주세요
            </p>
            <button
              onClick={onOpenAuthModal}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              간편인증 시작하기
            </button>
          </div>
        ) : (
          <div>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">본인인증이 완료되었습니다</h3>
            <p className="text-sm text-gray-600">
              {phoneNumber}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-5 py-2 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          disabled={!canGoNext}
          onClick={onNext}
          className={`px-5 py-2 rounded-lg text-white font-medium ${canGoNext ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          다음
        </button>
      </div>
    </div>
  )
}
