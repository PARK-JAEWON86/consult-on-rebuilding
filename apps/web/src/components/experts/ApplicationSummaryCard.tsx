'use client'

import { useState } from 'react'
import { X, Coffee, CheckCircle, XCircle, User, FileText, UserCircle, Heart, MessageSquare, Languages, CalendarCheck, Share2, Award, GraduationCap, Briefcase, Image, Target, Tag, Mail, Phone, Clock, Hash } from 'lucide-react'

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
  restTimeSettings?: {
    enableLunchBreak: boolean
    lunchStartTime: string
    lunchEndTime: string
    enableDinnerBreak: boolean
    dinnerStartTime: string
    dinnerEndTime: string
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
      <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-gray-200">
        {/* 프로필 이미지 */}
        {applicationData.profileImage ? (
          <div className="flex-shrink-0">
            <div className="w-64 h-96 rounded-lg border-2 border-gray-200 overflow-hidden">
              <img
                src={applicationData.profileImage}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 w-64 h-96 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* 기본 정보 */}
        <div className="flex-1 space-y-4">
          {applicationData.name && (
            <InfoRow icon={<User className="w-5 h-5" />} label="이름" value={applicationData.name} />
          )}

          {/* 신청번호 & 신청일시 */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow
              icon={<Hash className="w-5 h-5" />}
              label="신청번호"
              value={applicationData.displayId || `#${applicationData.id?.toString().padStart(6, '0')}`}
            />
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label="신청 일시"
              value={formatDate(applicationData.submittedAt)}
            />
          </div>

          {applicationData.email && (
            <InfoRow icon={<Mail className="w-5 h-5" />} label="이메일" value={applicationData.email} />
          )}

          {applicationData.phoneNumber && (
            <InfoRow icon={<Phone className="w-5 h-5" />} label="전화번호" value={applicationData.phoneNumber} />
          )}

          {/* 전문 분야 & 경력 */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow
              icon={<Target className="w-5 h-5" />}
              label="전문 분야"
              value={applicationData.categoryName}
            />
            {applicationData.experienceYears !== undefined && (
              <InfoRow icon={<Briefcase className="w-5 h-5" />} label="경력" value={`${applicationData.experienceYears}년`} />
            )}
          </div>

          {/* 전문 키워드 */}
          {applicationData.keywords && applicationData.keywords.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="text-gray-400 pt-0.5">
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">전문 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {applicationData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 상담 유형 & 구사 언어 */}
          {((applicationData.consultationTypes && applicationData.consultationTypes.length > 0) ||
            (applicationData.languages && applicationData.languages.length > 0)) && (
            <div className="grid grid-cols-2 gap-4">
              {/* 상담 유형 */}
              {applicationData.consultationTypes && applicationData.consultationTypes.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 pt-0.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">상담 유형</p>
                    <div className="flex flex-wrap gap-2">
                      {applicationData.consultationTypes.map((type, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                        >
                          {type === 'video' ? '화상' : type === 'voice' ? '음성' : '채팅'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 구사 언어 */}
              {applicationData.languages && applicationData.languages.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 pt-0.5">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">구사 언어</p>
                    <div className="flex flex-wrap gap-2">
                      {applicationData.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 연락처 정보 - 제거됨 (기본 정보로 통합) */}
      <div className="hidden">
        {applicationData.name && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              신청자명
            </label>
            <div className="text-base text-gray-900">{applicationData.name}</div>
          </div>
        )}
        {applicationData.email && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              이메일
            </label>
            <div className="text-base text-gray-900">{applicationData.email}</div>
          </div>
        )}
        {applicationData.phoneNumber && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              전화번호
            </label>
            <div className="text-base text-gray-900">{applicationData.phoneNumber}</div>
          </div>
        )}
        {applicationData.experienceYears !== undefined && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              경력
            </label>
            <div className="text-base text-gray-900">{applicationData.experienceYears}년</div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            신청 일시
          </label>
          <div className="text-base text-gray-900">{formatDate(applicationData.submittedAt)}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            신청 번호
          </label>
          <div className="font-mono text-base text-gray-900">
            {applicationData.displayId || `#${applicationData.id?.toString().padStart(6, '0')}`}
          </div>
        </div>
      </div>

      {/* 자기소개 */}
      {applicationData.bio && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 block mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            자기소개
          </label>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
            {applicationData.bio}
          </p>
        </div>
      )}

      {/* 예약 가능 시간 */}
      {((applicationData.availabilitySlots && applicationData.availabilitySlots.length > 0) || (applicationData.availability && Object.keys(applicationData.availability).length > 0)) && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 block mb-2 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            예약 가능 시간
          </label>
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
                  if (day === 'holidaySettings' || day === 'availabilitySlots' || day === 'restTimeSettings') return null;

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
                  {(applicationData.holidaySettings?.acceptHolidayConsultations || applicationData.availability?.holidaySettings?.acceptHolidayConsultations) ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">공휴일 상담 가능</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">공휴일 상담 불가</span>
                    </>
                  )}
                </div>
                {(applicationData.holidaySettings?.holidayNote || applicationData.availability?.holidaySettings?.holidayNote) && (
                  <p className="text-sm text-gray-600 mt-1 ml-6">
                    {applicationData.holidaySettings?.holidayNote || applicationData.availability?.holidaySettings?.holidayNote}
                  </p>
                )}
              </div>
            )}
            {/* Rest Time Settings */}
            {(applicationData.restTimeSettings || applicationData.availability?.restTimeSettings) && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex items-start gap-2 mb-2">
                  <Coffee className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-sm font-medium text-gray-900">휴게시간 설정</span>
                </div>
                <div className="space-y-1 ml-6">
                  {(applicationData.restTimeSettings?.enableLunchBreak || applicationData.availability?.restTimeSettings?.enableLunchBreak) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-orange-600">점심시간:</span>
                      <span>
                        {applicationData.restTimeSettings?.lunchStartTime || applicationData.availability?.restTimeSettings?.lunchStartTime}
                        {' ~ '}
                        {applicationData.restTimeSettings?.lunchEndTime || applicationData.availability?.restTimeSettings?.lunchEndTime}
                      </span>
                    </div>
                  )}
                  {(applicationData.restTimeSettings?.enableDinnerBreak || applicationData.availability?.restTimeSettings?.enableDinnerBreak) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-600">저녁시간:</span>
                      <span>
                        {applicationData.restTimeSettings?.dinnerStartTime || applicationData.availability?.restTimeSettings?.dinnerStartTime}
                        {' ~ '}
                        {applicationData.restTimeSettings?.dinnerEndTime || applicationData.availability?.restTimeSettings?.dinnerEndTime}
                      </span>
                    </div>
                  )}
                  {!(applicationData.restTimeSettings?.enableLunchBreak || applicationData.availability?.restTimeSettings?.enableLunchBreak) &&
                   !(applicationData.restTimeSettings?.enableDinnerBreak || applicationData.availability?.restTimeSettings?.enableDinnerBreak) && (
                    <div className="text-sm text-gray-500">
                      설정된 휴게시간 없음
                    </div>
                  )}
                </div>
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
              <label className="text-sm font-medium text-gray-600 block mb-2 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                MBTI
              </label>
              <div className="text-base text-gray-900 bg-gray-50 rounded-lg p-4 border border-gray-200 font-semibold">
                {applicationData.mbti}
              </div>
            </div>
          )}

          {applicationData.consultationStyle && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                상담 스타일
              </label>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
                {applicationData.consultationStyle}
              </p>
            </div>
          )}

          {/* 자격증 */}
          {applicationData.certifications && applicationData.certifications.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                자격증
              </label>
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
              <label className="text-sm font-medium text-gray-600 block mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                학력
              </label>
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
              <label className="text-sm font-medium text-gray-600 block mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                경력사항
              </label>
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
              <label className="text-sm font-medium text-gray-600 block mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" />
                자격증 & 포트폴리오 이미지
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {applicationData.portfolioImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`포트폴리오 ${index + 1}`}
                      className="w-full h-auto object-contain rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-3 py-1 rounded">
                        확대 보기
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 소셜 링크 */}
          {applicationData.socialLinks && Object.values(applicationData.socialLinks).some(link => link) && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                소셜 링크
              </label>
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

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="포트폴리오 확대 보기"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
            클릭하면 닫힙니다
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
