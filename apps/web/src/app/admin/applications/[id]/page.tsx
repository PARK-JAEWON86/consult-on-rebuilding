'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  Phone,
  GraduationCap,
  Award,
  User,
  Video,
  MessageSquare,
  Mic,
  X,
  Coffee,
  CalendarCheck,
  Share2,
  UserCircle,
  Heart,
  Globe,
  Languages
} from 'lucide-react'
import StatusBadge from '@/components/admin/common/StatusBadge'
import { api } from '@/lib/api'

interface ApplicationDetail {
  application: {
    id: number
    displayId: string
    name: string
    email: string
    phoneNumber?: string
    jobTitle: string
    specialty: string
    experienceYears: number
    bio: string
    keywords: string[]
    consultationTypes: string[]
    languages: string[]
    availability: any
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
    certifications: Array<{ name: string; issuer: string; year?: string }>
    education: Array<{ school: string; major: string; degree: string }>
    workExperience: Array<{ company: string; position: string; period: string }>
    mbti?: string
    consultationStyle?: string
    profileImage: string | null
    portfolioImages?: string[]
    socialLinks?: {
      linkedin?: string
      github?: string
      twitter?: string
      instagram?: string
      facebook?: string
      youtube?: string
      blog?: string
      website?: string
    } | null
    currentStage: 'SUBMITTED' | 'DOCUMENT_REVIEW' | 'UNDER_REVIEW' | 'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUESTED'
    reviewedAt: string | null
    reviewNotes: string | null
    createdAt: string
    emailNotification?: boolean
    smsNotification?: boolean
  }
  user: {
    id: number
    email: string
    name: string
    createdAt: string
    phoneNumber: string | null
  }
  previousApplications: any[]
}

const REQUEST_ITEMS = [
  '자격증 정보 추가 또는 증빙 자료',
  '경력사항 추가 또는 증명서',
  '학력 정보 추가 또는 증명서',
  '전문 키워드 추가',
  '자기소개 보완',
  '상담 스타일 보완',
  '프로필 사진 재제출',
  '예약 가능 시간 수정',
]

const REJECTION_REASONS = [
  '경력 요건 미달',
  '전문성 부족',
  '자격증 미보유',
  '신원 확인 불가',
  '부적절한 자기소개',
  '상담 가능 시간 부족',
  '중복 지원',
  '기타 운영 정책 위반',
]

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<ApplicationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request-info'>('approve')
  const [selectedRequestItems, setSelectedRequestItems] = useState<string[]>([])
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<string[]>([])
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadApplicationDetail()
  }, [id])

  async function loadApplicationDetail() {
    try {
      setIsLoading(true)
      const response = await api.get<ApplicationDetail>(
        `/admin/applications/${id}`
      )
      setData(response.data as ApplicationDetail)
    } catch (error) {
      console.error('Failed to load application detail:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReview(action: 'approve' | 'reject' | 'request-info') {
    if (isSubmitting) return

    // 추가 정보 요청 시 체크박스나 메모 중 하나는 필수
    if (action === 'request-info' && selectedRequestItems.length === 0 && !reviewNotes.trim()) {
      alert('요청할 항목을 선택하거나 요청 사항을 입력해주세요.')
      return
    }

    // 거절 시 체크박스나 메모 중 하나는 필수
    if (action === 'reject' && selectedRejectionReasons.length === 0 && !reviewNotes.trim()) {
      alert('거절 사유를 선택하거나 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)

      let finalNotes = reviewNotes.trim()

      // 추가 정보 요청 시 선택된 항목들을 메모에 포함
      if (action === 'request-info' && selectedRequestItems.length > 0) {
        const requestList = selectedRequestItems.map(item => `• ${item}`).join('\n')
        finalNotes = finalNotes
          ? `[요청 항목]\n${requestList}\n\n[추가 메모]\n${finalNotes}`
          : `[요청 항목]\n${requestList}`
      }

      // 거절 시 선택된 사유들을 메모에 포함
      if (action === 'reject' && selectedRejectionReasons.length > 0) {
        const reasonList = selectedRejectionReasons.map(item => `• ${item}`).join('\n')
        finalNotes = finalNotes
          ? `[거절 사유]\n${reasonList}\n\n[추가 설명]\n${finalNotes}`
          : `[거절 사유]\n${reasonList}`
      }

      await api.put(
        `/admin/applications/${id}/${action}`,
        { reviewNotes: finalNotes || undefined }
      )

      const messages = {
        approve: '승인되었습니다.',
        reject: '거절되었습니다.',
        'request-info': '추가 정보 요청이 전송되었습니다.'
      }
      alert(messages[action])
      router.push('/admin/applications')
    } catch (error: any) {
      console.error('Failed to review application:', error)
      alert(error.message || '처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
      setShowReviewDialog(false)
    }
  }

  async function handleStageChange(newStage: string) {
    if (isUpdatingStage) return

    try {
      setIsUpdatingStage(true)

      await api.put(`/admin/applications/${id}/stage`, {
        stage: newStage
      })

      alert('단계가 변경되었습니다.')
      loadApplicationDetail() // 데이터 새로고침
    } catch (error: any) {
      console.error('Failed to update stage:', error)
      alert(error.message || '단계 변경 중 오류가 발생했습니다.')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center">
        <p className="text-gray-500">지원 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/admin/applications')}
          className="mt-4 text-blue-600 hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    )
  }

  const { application, user } = data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/applications')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          목록으로
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">전문가 지원 상세</h1>
          <StatusBadge currentStage={application.currentStage} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 프로필 사진 & 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-700" />
              기본 정보
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* 프로필 이미지 */}
              {application.profileImage ? (
                <div className="flex-shrink-0">
                  <div className="w-64 h-96 rounded-lg border-2 border-gray-200 overflow-hidden">
                    <img
                      src={application.profileImage}
                      alt="프로필"
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
              <div className="flex-1 space-y-3">
                <InfoRow icon={<User className="w-5 h-5" />} label="이름" value={application.name} />
                <InfoRow icon={<FileText className="w-5 h-5" />} label="신청번호" value={application.displayId} />
                <InfoRow icon={<Mail className="w-5 h-5" />} label="이메일" value={application.email} />
                {application.phoneNumber && (
                  <InfoRow icon={<Phone className="w-5 h-5" />} label="전화번호" value={application.phoneNumber} />
                )}

                {/* 전문분야 & 경력 */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={<FileText className="w-5 h-5" />} label="전문분야" value={application.specialty} />
                  <InfoRow icon={<Briefcase className="w-5 h-5" />} label="경력" value={`${application.experienceYears}년`} />
                </div>

                {/* 키워드 */}
                {application.keywords && Array.isArray(application.keywords) && application.keywords.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="text-gray-400 pt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">전문 키워드</p>
                      <div className="flex flex-wrap gap-2">
                        {application.keywords.map((keyword, index) => (
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
                {((application.consultationTypes && application.consultationTypes.length > 0) ||
                  (application.languages && application.languages.length > 0)) && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* 상담 유형 */}
                    {application.consultationTypes && application.consultationTypes.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="text-gray-400 pt-0.5">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">상담 유형</p>
                          <div className="flex flex-wrap gap-2">
                            {application.consultationTypes.map((type, index) => {
                              const getTypeConfig = (type: string) => {
                                switch (type) {
                                  case 'video':
                                    return '화상';
                                  case 'voice':
                                    return '음성';
                                  case 'chat':
                                    return '채팅';
                                  default:
                                    return type;
                                }
                              };

                              return (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                >
                                  {getTypeConfig(type)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 구사 언어 */}
                    {application.languages && application.languages.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="text-gray-400 pt-0.5">
                          <Languages className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">구사 언어</p>
                          <div className="flex flex-wrap gap-2">
                            {application.languages.map((language, index) => (
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
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              자기소개
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{application.bio}</p>
          </div>

          {/* 포트폴리오 이미지 */}
          {application.portfolioImages && application.portfolioImages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                자격증 & 포트폴리오 이미지
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {application.portfolioImages.map((imageUrl: string, index: number) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
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

          {/* MBTI & 상담 스타일 */}
          {(application.mbti || application.consultationStyle) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MBTI */}
              {application.mbti && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-gray-700" />
                    MBTI
                  </h2>
                  <p className="text-2xl font-bold text-blue-600">{application.mbti}</p>
                </div>
              )}

              {/* 상담 스타일 */}
              {application.consultationStyle && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-gray-700" />
                    상담 스타일
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {application.consultationStyle}
                  </p>
                </div>
              )}
            </div>
          )}


          {/* 경력사항 */}
          {application.workExperience && Array.isArray(application.workExperience) && application.workExperience.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                경력사항
              </h2>
              <div className="space-y-3">
                {application.workExperience.map((work, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">{work.company}</div>
                    {work.position && (
                      <div className="text-sm text-gray-600 mt-1">{work.position}</div>
                    )}
                    {work.period && (
                      <div className="text-xs text-gray-500 mt-1">{work.period}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학력 */}
          {application.education && Array.isArray(application.education) && application.education.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                학력
              </h2>
              <div className="space-y-3">
                {application.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">{edu.school}</div>
                    {edu.major && (
                      <div className="text-sm text-gray-600 mt-1">{edu.major}</div>
                    )}
                    {edu.degree && (
                      <div className="text-xs text-gray-500 mt-1">{edu.degree}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 자격증 */}
          {application.certifications && Array.isArray(application.certifications) && application.certifications.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                자격증
              </h2>
              <div className="space-y-3">
                {application.certifications.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">{cert.name}</div>
                    {cert.issuer && (
                      <div className="text-sm text-gray-600 mt-1">발급기관: {cert.issuer}</div>
                    )}
                    {cert.year && (
                      <div className="text-sm text-gray-600 mt-1">취득년도: {cert.year}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 예약 가능 시간 */}
          {(application.availabilitySlots && application.availabilitySlots.length > 0) || (application.availability && Object.keys(application.availability).length > 0) ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                예약 가능 시간
              </h2>
              <div className="space-y-2">
                {/* ✅ PRIORITY: Use availabilitySlots if available */}
                {application.availabilitySlots && application.availabilitySlots.length > 0 ? (
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
                    application.availabilitySlots.forEach(slot => {
                      if (!slotsByDay[slot.dayOfWeek]) {
                        slotsByDay[slot.dayOfWeek] = [];
                      }
                      slotsByDay[slot.dayOfWeek].push({
                        startTime: slot.startTime,
                        endTime: slot.endTime
                      });
                    });

                    return Object.entries(slotsByDay).map(([day, slots]) => (
                      <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">
                          {dayNames[day] || day}
                        </span>
                        <span className="text-sm text-gray-900">
                          {slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
                        </span>
                      </div>
                    ));
                  })()
                ) : (
                  /* ✅ FALLBACK: Use old availability format */
                  application.availability && Object.entries(application.availability).map(([day, info]: [string, any]) => {
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
                      <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">
                          {dayNames[day] || day}
                        </span>
                        <span className="text-sm text-gray-900">
                          {info?.available ? info.hours : '불가능'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Holiday Settings */}
              {(application.holidaySettings || application.availability?.holidaySettings) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2 mb-3">
                    <CalendarCheck className="w-5 h-5 text-gray-700 mt-0.5" />
                    <span className="text-base font-semibold text-gray-900">공휴일 상담 설정</span>
                  </div>
                  <div className="flex items-start gap-2 ml-7">
                    {(application.holidaySettings?.acceptHolidayConsultations || application.availability?.holidaySettings?.acceptHolidayConsultations) ? (
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
                  {(application.holidaySettings?.holidayNote || application.availability?.holidaySettings?.holidayNote) && (
                    <p className="text-sm text-gray-600 mt-2 ml-7 bg-gray-50 rounded p-2">
                      {application.holidaySettings?.holidayNote || application.availability?.holidaySettings?.holidayNote}
                    </p>
                  )}
                </div>
              )}
              {/* Rest Time Settings */}
              {(application.restTimeSettings || application.availability?.restTimeSettings) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2 mb-3">
                    <Coffee className="w-5 h-5 text-gray-700 mt-0.5" />
                    <span className="text-base font-semibold text-gray-900">휴게시간 설정</span>
                  </div>
                  <div className="space-y-2 ml-7">
                    {(application.restTimeSettings?.enableLunchBreak || application.availability?.restTimeSettings?.enableLunchBreak) && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-orange-600">점심시간:</span>
                        <span className="font-medium">
                          {application.restTimeSettings?.lunchStartTime || application.availability?.restTimeSettings?.lunchStartTime}
                          {' ~ '}
                          {application.restTimeSettings?.lunchEndTime || application.availability?.restTimeSettings?.lunchEndTime}
                        </span>
                      </div>
                    )}
                    {(application.restTimeSettings?.enableDinnerBreak || application.availability?.restTimeSettings?.enableDinnerBreak) && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-purple-600">저녁시간:</span>
                        <span className="font-medium">
                          {application.restTimeSettings?.dinnerStartTime || application.availability?.restTimeSettings?.dinnerStartTime}
                          {' ~ '}
                          {application.restTimeSettings?.dinnerEndTime || application.availability?.restTimeSettings?.dinnerEndTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* 소셜 링크 */}
          {application.socialLinks && typeof application.socialLinks === 'object' && Object.values(application.socialLinks).some(link => link) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-gray-700" />
                소셜 링크
              </h2>
              <div className="space-y-3">
                {application.socialLinks.website && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">웹사이트</span>
                    <a
                      href={application.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.website}
                    </a>
                  </div>
                )}
                {application.socialLinks.blog && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">블로그</span>
                    <a
                      href={application.socialLinks.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.blog}
                    </a>
                  </div>
                )}
                {application.socialLinks.linkedin && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">LinkedIn</span>
                    <a
                      href={application.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.linkedin}
                    </a>
                  </div>
                )}
                {application.socialLinks.instagram && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">Instagram</span>
                    <a
                      href={application.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.instagram}
                    </a>
                  </div>
                )}
                {application.socialLinks.youtube && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">YouTube</span>
                    <a
                      href={application.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.youtube}
                    </a>
                  </div>
                )}
                {application.socialLinks.github && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">GitHub</span>
                    <a
                      href={application.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.github}
                    </a>
                  </div>
                )}
                {application.socialLinks.twitter && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">Twitter</span>
                    <a
                      href={application.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.twitter}
                    </a>
                  </div>
                )}
                {application.socialLinks.facebook && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-24">Facebook</span>
                    <a
                      href={application.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {application.socialLinks.facebook}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 심사 단계 표시 및 변경 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">심사 단계</h2>

            {/* 현재 단계 표시 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">현재 단계</p>
              <p className="font-semibold text-blue-600">
                {getStageLabel(application.currentStage || 'SUBMITTED')}
              </p>
            </div>

            {/* 단계 변경 드롭다운 (진행중인 단계일 때만) */}
            {(application.currentStage === 'SUBMITTED' || application.currentStage === 'DOCUMENT_REVIEW' || application.currentStage === 'UNDER_REVIEW' || application.currentStage === 'APPROVAL_PENDING') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  단계 변경
                </label>
                <select
                  value={application.currentStage || 'SUBMITTED'}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={isUpdatingStage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 font-medium"
                >
                  <option value="SUBMITTED" className="text-gray-900">접수 완료</option>
                  <option value="DOCUMENT_REVIEW" className="text-gray-900">서류 검토</option>
                  <option value="UNDER_REVIEW" className="text-gray-900">심사 진행</option>
                  <option value="APPROVAL_PENDING" className="text-gray-900">최종 승인 대기</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  사용자에게 표시되는 진행 단계를 변경합니다
                </p>
              </div>
            )}
          </div>

          {/* 알림 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">이메일 알림</span>
                </div>
                <span className={`text-sm font-medium ${application.emailNotification ? 'text-green-600' : 'text-gray-400'}`}>
                  {application.emailNotification ? '활성화' : '비활성화'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">SMS 알림</span>
                </div>
                <span className={`text-sm font-medium ${application.smsNotification ? 'text-green-600' : 'text-gray-400'}`}>
                  {application.smsNotification ? '활성화' : '비활성화'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              지원자에게 연락할 때 선호하는 알림 방법을 참고하세요
            </p>
          </div>

          {/* 검수 액션 */}
          {(application.currentStage === 'SUBMITTED' || application.currentStage === 'DOCUMENT_REVIEW' || application.currentStage === 'UNDER_REVIEW' || application.currentStage === 'APPROVAL_PENDING') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">검수</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setReviewAction('approve')
                    setShowReviewDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  승인
                </button>
                <button
                  onClick={() => {
                    setReviewAction('request-info')
                    setShowReviewDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600">추가 정보 요청</span>
                </button>
                <button
                  onClick={() => {
                    setReviewAction('reject')
                    setShowReviewDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">거절</span>
                </button>
              </div>
            </div>
          )}

          {/* 검수 결과 */}
          {(application.currentStage === 'APPROVED' || application.currentStage === 'REJECTED' || application.currentStage === 'ADDITIONAL_INFO_REQUESTED') && application.reviewedAt && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">검수 결과</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">검수일</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(application.reviewedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                {application.reviewNotes && (
                  <div>
                    <p className="text-sm text-gray-600">메모</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 사용자 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">User ID</p>
                <p className="font-medium text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-600">가입일</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">신청일</p>
                <p className="font-medium text-gray-900">
                  {new Date(application.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {application.reviewedAt && (
                <div>
                  <p className="text-gray-600">승인일</p>
                  <p className="font-medium text-gray-900">
                    {new Date(application.reviewedAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              {user.phoneNumber && (
                <div>
                  <p className="text-gray-600">전화번호</p>
                  <p className="font-medium text-gray-900">{user.phoneNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 검수 다이얼로그 */}
      {showReviewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? '지원 승인' : reviewAction === 'request-info' ? '추가 정보 요청' : '지원 거절'}
            </h3>

            {reviewAction === 'request-info' ? (
              <>
                <p className="text-gray-600 mb-4">
                  요청할 항목을 선택하거나 직접 입력해주세요.
                </p>

                {/* 체크박스 리스트 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    요청 항목 선택
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {REQUEST_ITEMS.map((item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedRequestItems.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequestItems([...selectedRequestItems, item])
                            } else {
                              setSelectedRequestItems(selectedRequestItems.filter(i => i !== item))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 추가 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 메모 (선택사항)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="선택한 항목 외 추가로 요청할 사항이 있다면 입력해주세요."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    rows={3}
                  />
                </div>
              </>
            ) : reviewAction === 'reject' ? (
              <>
                {/* 거절 사유 체크박스 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    거절 사유 선택
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {REJECTION_REASONS.map((reason) => (
                      <label key={reason} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedRejectionReasons.includes(reason)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRejectionReasons([...selectedRejectionReasons, reason])
                            } else {
                              setSelectedRejectionReasons(selectedRejectionReasons.filter(r => r !== reason))
                            }
                          }}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 추가 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 설명 (선택사항)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="선택한 사유 외 추가 설명이 있다면 입력해주세요."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-600">이 지원을 승인하시겠습니까?</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewDialog(false)
                  setSelectedRequestItems([])
                  setSelectedRejectionReasons([])
                  setReviewNotes('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={() => handleReview(reviewAction)}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  reviewAction === 'approve'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : reviewAction === 'request-info'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : reviewAction === 'approve' ? '승인' : reviewAction === 'request-info' ? '요청 전송' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}

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

function getStageLabel(stage: string): string {
  const labels: { [key: string]: string } = {
    'SUBMITTED': '접수 완료',
    'DOCUMENT_REVIEW': '서류 검토',
    'UNDER_REVIEW': '심사 진행',
    'APPROVAL_PENDING': '최종 승인 대기',
    'APPROVED': '승인 완료',
    'REJECTED': '거절됨',
    'ADDITIONAL_INFO_REQUESTED': '추가 정보 요청됨'
  }
  return labels[stage] || stage
}
