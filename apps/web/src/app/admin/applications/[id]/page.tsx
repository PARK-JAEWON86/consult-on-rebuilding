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
  Mic
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
    certifications: Array<{ name: string; issuer: string }>
    education: Array<{ school: string; major: string; degree: string }>
    workExperience: Array<{ company: string; position: string; period: string }>
    mbti?: string
    consultationStyle?: string
    profileImage: string | null
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
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUESTED'
    reviewedAt: string | null
    reviewNotes: string | null
    createdAt: string
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.name}</h1>
            <p className="text-gray-500 mt-1">{application.displayId}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 프로필 사진 & 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* 프로필 이미지 */}
              {application.profileImage ? (
                <div className="flex-shrink-0">
                  <img
                    src={application.profileImage}
                    alt="프로필"
                    className="max-w-xs max-h-60 w-auto h-auto rounded-lg border-2 border-gray-200"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {/* 기본 정보 */}
              <div className="flex-1 space-y-3">
                <InfoRow icon={<Mail className="w-5 h-5" />} label="이메일" value={application.email} />
                {application.phoneNumber && (
                  <InfoRow icon={<Phone className="w-5 h-5" />} label="전화번호" value={application.phoneNumber} />
                )}
                <InfoRow icon={<FileText className="w-5 h-5" />} label="전문분야" value={application.specialty} />

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

                <InfoRow icon={<Clock className="w-5 h-5" />} label="경력" value={`${application.experienceYears}년`} />
                <InfoRow icon={<Calendar className="w-5 h-5" />} label="신청일" value={new Date(application.createdAt).toLocaleDateString('ko-KR')} />
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자기소개</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{application.bio}</p>
          </div>

          {/* MBTI & 상담 스타일 */}
          {(application.mbti || application.consultationStyle) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MBTI */}
              {application.mbti && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">MBTI</h2>
                  <p className="text-2xl font-bold text-blue-600">{application.mbti}</p>
                </div>
              )}

              {/* 상담 스타일 */}
              {application.consultationStyle && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 스타일</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {application.consultationStyle}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 상담 유형 & 구사 언어 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 상담 유형 */}
            {application.consultationTypes && Array.isArray(application.consultationTypes) && application.consultationTypes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 유형</h2>
                <div className="flex flex-wrap gap-2">
                  {application.consultationTypes.map((type, index) => {
                    const getTypeConfig = (type: string) => {
                      switch (type) {
                        case 'video':
                          return { icon: <Video className="w-4 h-4" />, label: '화상' };
                        case 'voice':
                          return { icon: <Mic className="w-4 h-4" />, label: '음성' };
                        case 'chat':
                          return { icon: <MessageSquare className="w-4 h-4" />, label: '채팅' };
                        default:
                          return { icon: null, label: type };
                      }
                    };
                    const config = getTypeConfig(type);

                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {config.icon}
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 구사 언어 */}
            {application.languages && Array.isArray(application.languages) && application.languages.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">구사 언어</h2>
                <div className="flex flex-wrap gap-2">
                  {application.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 예약 가능 시간 */}
          {application.availability && Object.keys(application.availability).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                예약 가능 시간
              </h2>
              <div className="space-y-2">
                {Object.entries(application.availability).map(([day, info]: [string, any]) => {
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
                    <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        {dayNames[day] || day}
                      </span>
                      <span className="text-sm text-gray-900">
                        {info?.available ? info.hours : '불가능'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {application.availability.holidaySettings && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-700">
                      {application.availability.holidaySettings.acceptHolidayConsultations
                        ? '✅ 공휴일 상담 가능'
                        : '⛔ 공휴일 상담 불가'}
                    </span>
                  </div>
                  {application.availability.holidaySettings.holidayNote && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">
                      {application.availability.holidaySettings.holidayNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 소셜 링크 */}
          {application.socialLinks && Object.values(application.socialLinks).some(link => link) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">소셜 링크</h2>
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
          {/* 검수 액션 */}
          {application.status === 'PENDING' && (
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
          {application.status !== 'PENDING' && application.reviewedAt && (
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
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
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
