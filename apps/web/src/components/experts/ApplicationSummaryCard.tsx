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
  certifications?: Array<{ name: string; issuer: string; year?: string }>
  education?: Array<{ school: string; major: string; degree: string }>
  workExperience?: Array<{ company: string; position: string; period: string }>
  profileImage?: string
  mbti?: string
  consultationStyle?: string
  availability?: any
  availabilitySlots?: Array<{
    dayOfWeek: string
    startTime: string
    endTime: string
    isActive: boolean
  }>
  holidaySettings?: {
    acceptHolidayConsultations: boolean
    holidayNote: string
  }
  socialLinks?: {
    website?: string
    instagram?: string
    youtube?: string
    linkedin?: string
    blog?: string
  }
  portfolioImages?: string[]
}

interface ApplicationSummaryCardProps {
  applicationData: ApplicationData
  onViewDetails?: () => void
}

export default function ApplicationSummaryCard({
  applicationData,
  onViewDetails,
}: ApplicationSummaryCardProps) {
  const [showFullDetails, setShowFullDetails] = useState(true)

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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">신청 정보</h3>

      {/* 프로필 이미지 & 기본 정보 */}
      <div className="flex gap-6 mb-6">
        {/* 프로필 이미지 */}
        {applicationData.profileImage && (
          <div className="flex-shrink-0">
            <div className="w-56 h-72 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 overflow-hidden">
              <img
                src={applicationData.profileImage}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 기본 정보 그리드 */}
        <div className="flex-1 space-y-4">
          {/* 지원 분야 */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">지원 분야</label>
            <div className="text-base font-semibold text-gray-900">
              {applicationData.categoryName}
            </div>
          </div>

          {/* 전문 키워드 */}
          {applicationData.keywords && applicationData.keywords.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">전문 키워드</label>
              <div className="flex flex-wrap gap-2">
                {applicationData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 상담 방식 & 구사 언어 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 상담 방식 */}
            {applicationData.consultationTypes && applicationData.consultationTypes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">상담 방식</label>
                <div className="flex flex-wrap gap-2">
                  {applicationData.consultationTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium"
                    >
                      {type === 'video' ? '화상' : type === 'voice' ? '음성' : '채팅'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 구사 언어 */}
            {applicationData.languages && applicationData.languages.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">구사 언어</label>
                <div className="flex flex-wrap gap-2">
                  {applicationData.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
        {applicationData.name && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">신청자명</label>
            <div className="text-base text-gray-900">{applicationData.name}</div>
          </div>
        )}
        {applicationData.email && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">이메일</label>
            <div className="text-base text-gray-900">{applicationData.email}</div>
          </div>
        )}
        {applicationData.phoneNumber && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">전화번호</label>
            <div className="text-base text-gray-900">{applicationData.phoneNumber}</div>
          </div>
        )}
        {applicationData.experienceYears !== undefined && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">경력</label>
            <div className="text-base text-gray-900">{applicationData.experienceYears}년</div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">신청 일시</label>
          <div className="text-base text-gray-900">{formatDate(applicationData.submittedAt)}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">신청 번호</label>
          <div className="font-mono text-base text-gray-900">
            {applicationData.displayId || `#${applicationData.id?.toString().padStart(6, '0')}`}
          </div>
        </div>
      </div>

      {/* 자기소개 */}
      {applicationData.bio && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 block mb-2">자기소개</label>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
            {applicationData.bio}
          </p>
        </div>
      )}

      {/* 예약 가능 시간 */}
      {((applicationData.availabilitySlots && applicationData.availabilitySlots.length > 0) || (applicationData.availability && Object.keys(applicationData.availability).length > 0)) && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 block mb-2">예약 가능 시간</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              {/* ✅ PRIORITY: Use availabilitySlots if available */}
              {applicationData.availabilitySlots && applicationData.availabilitySlots.length > 0 ? (
                (() => {
                  const dayNames: { [key: string]: string } = {
                    'MONDAY': '월요일',
                    'TUESDAY': '화요일',
                    'WEDNESDAY': '수요일',
                    'THURSDAY': '목요일',
                    'FRIDAY': '금요일',
                    'SATURDAY': '토요일',
                    'SUNDAY': '일요일'
                  };

                  // Group slots by day
                  const slotsByDay: { [key: string]: Array<{ startTime: string; endTime: string }> } = {};
                  applicationData.availabilitySlots.forEach(slot => {
                    if (!slotsByDay[slot.dayOfWeek]) {
                      slotsByDay[slot.dayOfWeek] = [];
                    }
                    slotsByDay[slot.dayOfWeek].push({
                      startTime: slot.startTime,
                      endTime: slot.endTime
                    });
                  });

                  return Object.entries(slotsByDay).map(([day, slots]) => (
                    <div key={day} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 font-medium">
                        {dayNames[day] || day}
                      </span>
                      <span className="text-gray-900">
                        {slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
                      </span>
                    </div>
                  ));
                })()
              ) : (
                /* ✅ FALLBACK: Use old availability format */
                applicationData.availability && Object.entries(applicationData.availability).map(([day, info]: [string, any]) => {
                  if (day === 'holidaySettings' || day === 'availabilitySlots') return null;

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
                      <span className="text-gray-700 font-medium">
                        {dayNames[day] || day}
                      </span>
                      <span className="text-gray-900">
                        {info?.available ? info.hours : '불가능'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            {/* Holiday Settings */}
            {(applicationData.holidaySettings || applicationData.availability?.holidaySettings) && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-700">
                    {(applicationData.holidaySettings?.acceptHolidayConsultations || applicationData.availability?.holidaySettings?.acceptHolidayConsultations)
                      ? '✅ 공휴일 상담 가능'
                      : '⛔ 공휴일 상담 불가'}
                  </span>
                </div>
                {(applicationData.holidaySettings?.holidayNote || applicationData.availability?.holidaySettings?.holidayNote) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {applicationData.holidaySettings?.holidayNote || applicationData.availability?.holidaySettings?.holidayNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 확장 정보 - 선택 항목만 표시 */}
      {showFullDetails && (
        <div className="pt-6 border-t border-gray-200 space-y-6">
          {/* MBTI & 상담 스타일 */}
          {applicationData.mbti && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">MBTI</label>
              <div className="text-base text-gray-900">{applicationData.mbti}</div>
            </div>
          )}

          {applicationData.consultationStyle && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">상담 스타일</label>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
                {applicationData.consultationStyle}
              </p>
            </div>
          )}

          {/* 자격증 */}
          {applicationData.certifications && applicationData.certifications.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3">자격증</label>
              <div className="space-y-3">
                {applicationData.certifications.map((cert, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-base font-medium text-gray-900 mb-1">
                      {cert.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {cert.issuer && `발급기관: ${cert.issuer}`}
                      {cert.issuer && cert.year && ' • '}
                      {cert.year && `취득년도: ${cert.year}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학력 */}
          {applicationData.education && applicationData.education.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3">학력</label>
              <div className="space-y-3">
                {applicationData.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-base font-medium text-gray-900 mb-1">
                      {edu.school}
                    </div>
                    <div className="text-sm text-gray-600">
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
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3">경력사항</label>
              <div className="space-y-3">
                {applicationData.workExperience.map((work, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-base font-medium text-gray-900 mb-1">
                      {work.company}
                    </div>
                    <div className="text-sm text-gray-600">
                      {work.position && `${work.position} `}
                      {work.period && `• ${work.period}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 포트폴리오 이미지 */}
          {applicationData.portfolioImages && applicationData.portfolioImages.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3">자격증 & 포트폴리오 이미지</label>
              <div className="grid grid-cols-3 gap-3">
                {applicationData.portfolioImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`포트폴리오 ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 소셜 링크 */}
          {applicationData.socialLinks && Object.values(applicationData.socialLinks).some(link => link) && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3">소셜 링크</label>
              <div className="space-y-3">
                {applicationData.socialLinks.website && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">웹사이트</div>
                    <a
                      href={applicationData.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {applicationData.socialLinks.website}
                    </a>
                  </div>
                )}
                {applicationData.socialLinks.instagram && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Instagram</div>
                    <div className="text-sm text-gray-900">{applicationData.socialLinks.instagram}</div>
                  </div>
                )}
                {applicationData.socialLinks.youtube && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">YouTube</div>
                    <a
                      href={applicationData.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {applicationData.socialLinks.youtube}
                    </a>
                  </div>
                )}
                {applicationData.socialLinks.linkedin && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">LinkedIn</div>
                    <a
                      href={applicationData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {applicationData.socialLinks.linkedin}
                    </a>
                  </div>
                )}
                {applicationData.socialLinks.blog && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">블로그</div>
                    <a
                      href={applicationData.socialLinks.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {applicationData.socialLinks.blog}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowFullDetails(!showFullDetails)}
        className="w-full mt-6 py-3 border-2 border-blue-500 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold"
      >
        {showFullDetails ? '간단히 보기 ▲' : '신청 내역 전체 보기 ▼'}
      </button>
    </div>
  )
}
