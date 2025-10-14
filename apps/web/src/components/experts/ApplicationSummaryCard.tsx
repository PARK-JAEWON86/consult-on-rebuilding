'use client'

import { useState } from 'react'

interface ApplicationData {
  id: number
  displayId?: string
  categoryName: string
  specialty: string
  submittedAt: Date
  bio?: string
  keywords?: string[]
  consultationTypes?: string[]
  name?: string
  email?: string
  phoneNumber?: string
  experienceYears?: number
  languages?: string[]
  certifications?: Array<{ name: string; issuer: string }>
  education?: Array<{ school: string; major: string; degree: string }>
  workExperience?: Array<{ company: string; position: string; period: string }>
  profileImage?: string
  mbti?: string
  consultationStyle?: string
  availability?: any
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
        {/* 필수 항목 - 항상 표시 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">지원 분야</span>
          <span className="font-medium text-gray-900">
            {applicationData.categoryName}
          </span>
        </div>

        {/* 전문 키워드 - 필수 항목 */}
        {applicationData.keywords && applicationData.keywords.length > 0 && (
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 pt-1">전문 키워드</span>
            <div className="flex flex-wrap gap-2 justify-end max-w-[60%]">
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

        {/* 신청자명 - 필수 항목 */}
        {applicationData.name && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">신청자명</span>
            <span className="font-medium text-gray-900">
              {applicationData.name}
            </span>
          </div>
        )}

        {/* 이메일 - 필수 항목 */}
        {applicationData.email && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">이메일</span>
            <span className="font-medium text-gray-900">
              {applicationData.email}
            </span>
          </div>
        )}

        {/* 전화번호 - 필수 항목 */}
        {applicationData.phoneNumber && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">전화번호</span>
            <span className="font-medium text-gray-900">
              {applicationData.phoneNumber}
            </span>
          </div>
        )}

        {/* 경력 - 필수 항목 */}
        {applicationData.experienceYears !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">경력</span>
            <span className="font-medium text-gray-900">
              {applicationData.experienceYears}년
            </span>
          </div>
        )}

        {/* 구사 언어 */}
        {applicationData.languages && applicationData.languages.length > 0 && (
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 pt-1">구사 언어</span>
            <div className="flex flex-wrap gap-2 justify-end max-w-[60%]">
              {applicationData.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">신청 일시</span>
          <span className="font-medium text-gray-900">
            {formatDate(applicationData.submittedAt)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">신청 번호</span>
          <span className="font-mono text-sm text-gray-900">
            {applicationData.displayId || `#${applicationData.id?.toString().padStart(6, '0')}`}
          </span>
        </div>

        {/* 상담 방식 - 필수 항목 */}
        {applicationData.consultationTypes && applicationData.consultationTypes.length > 0 && (
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 pt-1">상담 방식</span>
            <div className="flex flex-wrap gap-2 justify-end max-w-[60%]">
              {applicationData.consultationTypes.map((type, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                >
                  {type === 'video' ? '화상' : type === 'voice' ? '음성' : '채팅'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 자기소개 - 필수 항목 */}
        {applicationData.bio && (
          <div className="pt-2 border-t border-blue-100">
            <span className="text-sm text-gray-600 block mb-2">
              자기소개
            </span>
            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">
              {applicationData.bio}
            </p>
          </div>
        )}

        {/* 예약 가능 시간 - 필수 항목 */}
        {applicationData.availability && Object.keys(applicationData.availability).length > 0 && (
          <div className="pt-2 border-t border-blue-100">
            <span className="text-sm text-gray-600 block mb-2">
              예약 가능 시간
            </span>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="space-y-2">
                {Object.entries(applicationData.availability).map(([day, info]: [string, any]) => {
                  if (day === 'holidaySettings') return null;

                  const dayNames: { [key: string]: string } = {
                    'MONDAY': '월요일',
                    'TUESDAY': '화요일',
                    'WEDNESDAY': '수요일',
                    'THURSDAY': '목요일',
                    'FRIDAY': '금요일',
                    'SATURDAY': '토요일',
                    'SUNDAY': '일요일'
                  };

                  return (
                    <div key={day} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">
                        {dayNames[day] || day}
                      </span>
                      <span className="text-gray-900">
                        {info?.available ? info.hours : '불가능'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {applicationData.availability.holidaySettings && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-600">
                      {applicationData.availability.holidaySettings.acceptHolidayConsultations
                        ? '✅ 공휴일 상담 가능'
                        : '⛔ 공휴일 상담 불가'}
                    </span>
                  </div>
                  {applicationData.availability.holidaySettings.holidayNote && (
                    <p className="text-xs text-gray-500 mt-1">
                      {applicationData.availability.holidaySettings.holidayNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 확장 정보 - 선택 항목만 표시 */}
        {showFullDetails && (
          <div className="pt-3 border-t border-blue-200 space-y-3 animate-fadeIn">
            {/* MBTI & 상담 스타일 - 선택 항목 */}
            {(applicationData.mbti || applicationData.consultationStyle) && (
              <div className="space-y-2">
                {applicationData.mbti && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">MBTI</span>
                    <span className="text-sm font-medium text-gray-900">
                      {applicationData.mbti}
                    </span>
                  </div>
                )}
                {applicationData.consultationStyle && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">
                      상담 스타일
                    </span>
                    <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">
                      {applicationData.consultationStyle}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 자격증 - 선택 항목 */}
            {applicationData.certifications && applicationData.certifications.length > 0 && (
              <div className="pt-2 border-t border-blue-100">
                <span className="text-sm text-gray-600 block mb-2">
                  자격증
                </span>
                <div className="space-y-2">
                  {applicationData.certifications.map((cert, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.name}
                      </div>
                      {cert.issuer && (
                        <div className="text-xs text-gray-600 mt-1">
                          발급기관: {cert.issuer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 학력 */}
            {applicationData.education && applicationData.education.length > 0 && (
              <div className="pt-2 border-t border-blue-100">
                <span className="text-sm text-gray-600 block mb-2">
                  학력
                </span>
                <div className="space-y-2">
                  {applicationData.education.map((edu, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-sm font-medium text-gray-900">
                        {edu.school}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {edu.major && `${edu.major} `}
                        {edu.degree && `(${edu.degree})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 경력사항 */}
            {applicationData.workExperience && applicationData.workExperience.length > 0 && (
              <div className="pt-2 border-t border-blue-100">
                <span className="text-sm text-gray-600 block mb-2">
                  경력사항
                </span>
                <div className="space-y-2">
                  {applicationData.workExperience.map((work, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-sm font-medium text-gray-900">
                        {work.company}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {work.position && `${work.position} `}
                        {work.period && `• ${work.period}`}
                      </div>
                    </div>
                  ))}
                </div>
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
