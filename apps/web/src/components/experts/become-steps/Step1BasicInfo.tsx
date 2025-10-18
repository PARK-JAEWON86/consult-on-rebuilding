'use client'

import React from 'react'
import { Info } from 'lucide-react'

interface Step1BasicInfoProps {
  fullName: string
  email: string
  phoneNumber: string
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneNumberChange: (value: string) => void
  onNext: () => void
  canGoNext: boolean
}

export default function Step1BasicInfo({
  fullName,
  email,
  phoneNumber,
  onFullNameChange,
  onEmailChange,
  onPhoneNumberChange,
  onNext,
  canGoNext,
}: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              기본 정보 안내
            </h4>
            <p className="text-sm text-blue-800">
              이름, 이메일, 전화번호는 로그인한 계정 정보가 자동으로 입력되며, 수정 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 기본 정보: 이름, 이메일, 전화번호 */}
      <div className="max-w-full">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-gray-500 text-xs">(본명)</span>
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
              <span className="text-gray-400 ml-1 text-xs">(선택)</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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
