'use client'

import { useState } from 'react'

interface ApplicationData {
  id: number
  categoryName: string
  specialty: string
  submittedAt: Date
  bio?: string
  keywords?: string[]
  consultationTypes?: string[]
}

interface ApplicationSummaryCardProps {
  applicationData: ApplicationData
  onViewDetails?: () => void
}

export default function ApplicationSummaryCard({
  applicationData,
  onViewDetails,
}: ApplicationSummaryCardProps) {
  const [showFullDetails, setShowFullDetails] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <h3 className="font-semibold text-gray-900 mb-4">신청 정보</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">지원 분야</span>
          <span className="font-medium text-gray-900">
            {applicationData.categoryName}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">세부 전문 분야</span>
          <span className="font-medium text-gray-900">
            {applicationData.specialty}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">신청 일시</span>
          <span className="font-medium text-gray-900">
            {formatDate(applicationData.submittedAt)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">신청 번호</span>
          <span className="font-mono text-sm text-gray-900">
            #{applicationData.id?.toString().padStart(6, '0')}
          </span>
        </div>

        {/* 확장 정보 */}
        {showFullDetails && (
          <div className="pt-3 border-t border-blue-200 space-y-3 animate-fadeIn">
            {applicationData.keywords && applicationData.keywords.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">
                  전문 키워드
                </span>
                <div className="flex flex-wrap gap-2">
                  {applicationData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {applicationData.consultationTypes &&
              applicationData.consultationTypes.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">
                    상담 방식
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {applicationData.consultationTypes.map((type, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                      >
                        {type === 'video'
                          ? '화상'
                          : type === 'voice'
                          ? '음성'
                          : '채팅'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {applicationData.bio && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">
                  자기소개
                </span>
                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">
                  {applicationData.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowFullDetails(!showFullDetails)}
        className="w-full mt-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        {showFullDetails ? '간단히 보기' : '신청 내역 전체 보기'}
      </button>
    </div>
  )
}
