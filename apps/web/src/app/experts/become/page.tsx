'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { api } from '@/lib/api'
import {
  ShieldCheck,
  Award,
  Users,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Video,
  MessageCircle,
  Phone,
  Calendar,
  Clock,
  Plus,
  X,
  Info,
  GraduationCap,
  Briefcase,
  Tag,
  FileText,
} from 'lucide-react'

// Step Components
import Step1BasicInfo from '@/components/experts/become-steps/Step1BasicInfo'
import Step2PhoneVerification from '@/components/experts/become-steps/Step2PhoneVerification'
import Step31BasicProfile from '@/components/experts/become-steps/Step3-1BasicProfile'
import Step32ScheduleSettings from '@/components/experts/become-steps/Step3-2ScheduleSettings'
import Step4Terms from '@/components/experts/become-steps/Step4Terms'
import Step5Review from '@/components/experts/become-steps/Step5Review'
import Step6Complete from '@/components/experts/become-steps/Step6Complete'
import { AvailabilitySlot, HolidaySettings } from '@/components/experts/AvailabilityScheduleEditor'

type Step = 1 | 2 | 3 | 3.5 | 4 | 5 | 6

type ConsultationType = 'video' | 'chat' | 'voice'

export default function BecomeExpertPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [step, setStep] = useState<Step>(1)

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
        const response = await fetch(`${apiUrl}/categories`)
        const result = await response.json()

        console.log('📋 카테고리 API 응답:', result)

        if (result.success) {
          setCategories(result.data)
          console.log('✅ 카테고리 로드 완료:', result.data)
        } else {
          console.error('❌ 카테고리 로드 실패:', result.message)
        }
      } catch (error) {
        console.error('❌ 카테고리 로드 실패:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/experts/become')
    }
  }, [isLoading, isAuthenticated, router])

  // 전문가 지원 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!user || isLoading) return

    const status = (user as any).expertApplicationStatus

    if (status === 'PENDING') {
      // 검수 중 - 상태 확인 페이지로
      router.push('/experts/application-status')
    } else if (status === 'APPROVED' || user.expert) {
      // 이미 승인됨 - 전문가 대시보드로
      router.push('/dashboard/expert')
    }
    // REJECTED나 null은 계속 진행 (재지원 허용)
  }, [user, isLoading, router])

  // 1단계: 기본 정보 + 휴대폰 인증
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [detailedSpecialty, setDetailedSpecialty] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // 사용자 정보 로드 시 이름과 이메일 자동 설정
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🔍 AuthProvider에서 사용자 정보 로드됨:', user)
      setFullName(user.name || '')
      setEmail(user.email)
    } else {
      console.log('⚠️ 사용자 정보가 없습니다. isLoading:', isLoading)
    }
  }, [user, isLoading])

  // 휴대폰 인증
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState('')

  // 간편인증 모달
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // 2단계: 전문 정보 + 일정/자격증 (통합)
  const [specialty, setSpecialty] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(0)
  const [bio, setBio] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([])
  const [mbti, setMbti] = useState('')
  const [consultationStyle, setConsultationStyle] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'schedule'>('basic')

  // 필수 항목 검증 상태
  const [showValidation, setShowValidation] = useState(false)

  // 카테고리 데이터
  interface Category {
    id: number
    slug: string
    nameKo: string
    nameEn: string | null
    icon: string | null
    description: string | null
    order: number
  }
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])

  // 카테고리별 세부 상담분야 예시
  const detailedSpecialtyExamples: { [key: string]: string } = {
    '심리상담': '스트레스 상담, 부부관계 상담, 업무 스트레스 등',
    '법률상담': '계약법, 가족법, 노동법, 부동산법 등',
    '재무상담': '투자 상담, 자산관리, 세무 상담, 연금 설계 등',
    '건강상담': '영양 상담, 운동 처방, 만성질환 관리 등',
    '진로상담': '취업 상담, 이직 상담, 커리어 코칭 등',
    'IT상담': '프로그래밍 멘토링, 웹개발, 앱개발, 클라우드 등',
    '교육상담': '입시 상담, 유학 상담, 학습법 코칭 등',
    '부동산상담': '매매 상담, 임대차 상담, 부동산 투자 등',
    '창업상담': '사업계획 수립, 자금조달, 마케팅 전략 등',
    '디자인상담': 'UI/UX 디자인, 브랜딩, 그래픽 디자인 등',
  }

  // 일정 및 자격증 (Step 3에서 이동)
  // 예약 가능 시간 (슬롯 기반 시스템)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [holidaySettings, setHolidaySettings] = useState<HolidaySettings>({
    acceptHolidayConsultations: false,
    holidayNote: ''
  })
  const [education, setEducation] = useState<
    Array<{ school: string; major: string; degree: string }>
  >([{ school: '', major: '', degree: '' }])
  const [certifications, setCertifications] = useState<
    Array<{ name: string; issuer: string; year: string }>
  >([{ name: '', issuer: '', year: '' }])
  const [workExperience, setWorkExperience] = useState<
    Array<{ company: string; position: string; period: string }>
  >([{ company: '', position: '', period: '' }])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])

  // 소셜 링크
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    instagram: '',
    youtube: '',
    linkedin: '',
    blog: '',
  })

  // 전문분야별 추천 키워드 생성 함수
  const getRecommendedKeywords = (specialtyName: string): string[] => {
    const keywordMap: { [key: string]: string[] } = {
      심리상담: [
        '스트레스',
        '우울',
        '불안',
        '트라우마',
        '인간관계',
        '자존감',
        '감정조절',
      ],
      법률상담: [
        '계약법',
        '노동법',
        '가족법',
        '상속법',
        '부동산법',
        '회사법',
        '지적재산권',
      ],
      재무상담: ['투자', '자산관리', '세무', '보험', '연금', '부동산', '주식'],
      건강상담: [
        '영양',
        '운동',
        '건강관리',
        '다이어트',
        '만성질환',
        '예방의학',
      ],
      진로상담: ['취업', '이직', '창업', '자격증', '스킬개발', '커리어계획'],
      IT상담: [
        '프로그래밍',
        '웹개발',
        '앱개발',
        '데이터분석',
        'AI',
        '클라우드',
        '보안',
      ],
      교육상담: ['학습법', '입시', '유학', '자격증', '온라인교육', '언어학습'],
      부동산상담: ['매매', '임대', '투자', '개발', '법규', '시장분석'],
      창업상담: ['사업계획', '자금조달', '마케팅', '법무', '세무', '인사관리'],
      투자상담: ['주식', '부동산', '펀드', '채권', '암호화폐', '리스크관리'],
      디자인상담: [
        'UI/UX',
        '그래픽디자인',
        '브랜딩',
        '웹디자인',
        '로고디자인',
        '패키지디자인',
      ],
      마케팅상담: [
        '디지털마케팅',
        '콘텐츠마케팅',
        'SNS마케팅',
        'SEO',
        '광고',
        '브랜드전략',
      ],
      언어상담: [
        '외국어',
        '통역',
        '번역',
        '언어학습',
        '문화교류',
        '비즈니스언어',
      ],
      예술상담: ['음악', '미술', '공연', '창작', '예술치료', '문화예술'],
      스포츠상담: [
        '운동',
        '훈련',
        '경기',
        '체력관리',
        '부상예방',
        '스포츠심리',
      ],
      여행상담: [
        '여행계획',
        '가이드',
        '숙박',
        '문화체험',
        '여행보험',
        '여행법',
      ],
      요리상담: [
        '요리법',
        '영양',
        '식단',
        '식문화',
        '푸드스타일링',
        '식품안전',
      ],
      패션상담: [
        '스타일링',
        '코디',
        '이미지',
        '패션트렌드',
        '색채',
        '체형별코디',
      ],
      반려동물상담: ['훈련', '건강', '케어', '행동교정', '영양', '동물의학'],
      정원상담: [
        '식물키우기',
        '조경',
        '원예',
        '가드닝',
        '식물병해',
        '환경조성',
      ],
      보험상담: [
        '생명보험',
        '손해보험',
        '연금',
        '의료보험',
        '자동차보험',
        '보험설계',
      ],
      진학상담: ['대입', '수시', '정시', '입시전략', '학과선택', '진학준비'],
      기타: ['상담', '컨설팅', '자문', '코칭', '멘토링', '교육'],
    }

    return keywordMap[specialtyName] || ['상담', '컨설팅', '자문']
  }

  // 4단계: 약관 동의
  const [agreeService, setAgreeService] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const agree = agreeService && agreePrivacy

  // Step 1: 기본정보 (이름, 이메일, 휴대폰)
  const canGoNextStep1 = phoneNumber.length >= 10 && phoneNumber.length <= 11 && /^01[0-9]{8,9}$/.test(phoneNumber)

  // Step 2: 본인인증 (모달 완료 필수)
  const canGoNextStep2 = phoneVerified === true

  // Step 3: 전문정보
  const hasAvailability = availabilitySlots.length > 0 && availabilitySlots.some(slot => slot.isActive)

  const canGoNextStep3 =
    selectedCategoryId !== null &&
    profileImage !== null &&
    keywords.length > 0 &&
    bio.trim().length >= 30 &&
    consultationTypes.length > 0 &&
    hasAvailability

  // Validation message for Step 3
  const validationMessage = [
    !selectedCategoryId && '상담분야',
    !profileImage && '프로필 사진',
    keywords.length === 0 && '키워드',
    bio.trim().length < 30 && '자기소개(30자 이상)',
    consultationTypes.length === 0 && '상담유형',
    !hasAvailability && '상담 가능 시간',
  ].filter(Boolean).join(', ')

  // 전문분야 변경 시 추천 키워드 업데이트
  useEffect(() => {
    if (specialty && categories.length > 0) {
      const keywords = getRecommendedKeywords(specialty)
      setSuggestedKeywords(keywords)
    } else {
      setSuggestedKeywords([])
    }
  }, [specialty, categories])

  // 경력(년) 자동 계산: workExperience의 period에서 연도 추출
  useEffect(() => {
    const calculateTotalExperience = () => {
      const currentYear = new Date().getFullYear()
      let totalYears = 0

      workExperience.forEach((exp) => {
        if (!exp.period || !exp.company) return // 빈 항목은 스킵

        // period 형식: "2020.01 ~ 2023.12" 또는 "2020 ~ 2023" 또는 "2020.01 ~ 현재"
        const periodMatch = exp.period.match(/(\d{4})/)
        if (!periodMatch) return

        const startYear = parseInt(periodMatch[1])

        // 종료 연도 찾기
        const endMatch = exp.period.match(/~\s*(\d{4})|~\s*(현재|재직중)/)
        let endYear = currentYear

        if (endMatch) {
          if (endMatch[1]) {
            endYear = parseInt(endMatch[1])
          }
          // "현재" 또는 "재직중"인 경우 현재 연도 사용
        }

        const years = Math.max(0, endYear - startYear)
        totalYears += years
      })

      setExperienceYears(totalYears)
    }

    calculateTotalExperience()
  }, [workExperience])

  const handleSendVerificationCode = async () => {
    if (!phoneNumber || !/^01[0-9]{8,9}$/.test(phoneNumber)) {
      alert('올바른 휴대폰 번호를 입력해주세요 (예: 01012345678)')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('http://localhost:4000/v1/auth/send-phone-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const result = await response.json()

      if (result.success) {
        setCodeSent(true)
        setTimeLeft(180)
        alert('인증번호가 발송되었습니다')
      } else {
        alert(result.error?.message || '인증번호 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to send verification code:', error)
      alert('인증번호 발송에 실패했습니다')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 입력해주세요')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch('http://localhost:4000/v1/auth/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: verificationCode })
      })
      const result = await response.json()

      if (result.success && result.data.verified) {
        setPhoneVerified(true)
        setVerifiedPhone(phoneNumber)
        alert('본인인증이 완료되었습니다')
      } else {
        alert(result.error?.message || '인증번호가 일치하지 않습니다')
      }
    } catch (error) {
      console.error('Failed to verify code:', error)
      alert('인증 확인에 실패했습니다')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('이미지 크기는 5MB 이하로 제한됩니다.')
      return
    }

    // 이미지 압축 및 리사이징
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        // 캔버스를 사용하여 이미지 리사이징
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // 최대 너비/높이 설정
        const maxWidth = 800
        const maxHeight = 800
        let width = img.width
        let height = img.height

        // 비율 유지하며 리사이징
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        // JPEG로 압축 (품질 0.8)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)

        // 압축된 이미지 크기 확인 (base64는 약 1.33배 크기)
        const compressedSize = (compressedDataUrl.length * 3) / 4
        if (compressedSize > maxSize) {
          alert('압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.')
          return
        }

        setProfileImage(compressedDataUrl)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const toggleConsultationType = (type: ConsultationType) => {
    setConsultationTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // 예약 가능 시간 변경 핸들러
  const handleAvailabilityChange = (slots: AvailabilitySlot[], holidaySettings: HolidaySettings) => {
    setAvailabilitySlots(slots)
    setHolidaySettings(holidaySettings)
  }


  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value)
    const keywordArray = value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 10) // 최대 10개
    setKeywords(keywordArray)
  }

  const addEducation = () =>
    setEducation((prev) => [...prev, { school: '', major: '', degree: '' }])
  const removeEducation = (idx: number) =>
    setEducation((prev) => prev.filter((_, i) => i !== idx))
  const updateEducation = (
    idx: number,
    field: 'school' | 'major' | 'degree',
    val: string
  ) =>
    setEducation((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    )

  const addCertification = () =>
    setCertifications((prev) => [...prev, { name: '', issuer: '', year: '' }])
  const removeCertification = (idx: number) =>
    setCertifications((prev) => prev.filter((_, i) => i !== idx))
  const updateCertification = (
    idx: number,
    field: 'name' | 'issuer' | 'year',
    val: string
  ) =>
    setCertifications((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    )

  const addWorkExperience = () =>
    setWorkExperience((prev) => [...prev, { company: '', position: '', period: '' }])
  const removeWorkExperience = (idx: number) =>
    setWorkExperience((prev) => prev.filter((_, i) => i !== idx))
  const updateWorkExperience = (
    idx: number,
    field: 'company' | 'position' | 'period',
    val: string
  ) =>
    setWorkExperience((prev) =>
      prev.map((w, i) => (i === idx ? { ...w, [field]: val } : w))
    )

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 5 - portfolioFiles.length)

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하만 가능합니다.')
        return
      }
    })

    setPortfolioFiles(prev => [...prev, ...newFiles])

    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPortfolioPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePortfolioFile = (idx: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== idx))
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSocialLinkChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }))
  }

  const handleSubmit = async () => {
    if (!agree) {
      alert('약관 동의가 필요합니다.')
      return
    }

    // 선택된 카테고리 이름 가져오기
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)
    const categoryName = selectedCategory ? selectedCategory.nameKo : ''

    // 세부 상담분야를 specialty에 포함
    const fullSpecialty = detailedSpecialty
      ? `${categoryName} - ${detailedSpecialty}`
      : categoryName || specialty

    // API로 전송할 데이터 구성
    const applicationData = {
      name: fullName,
      email: email,
      jobTitle: '', // 필요시 추가
      specialty: fullSpecialty,
      experienceYears: experienceYears,
      bio: bio,
      keywords: keywords.filter((k) => k.trim()),
      consultationTypes: consultationTypes,
      availability: {
        slots: availabilitySlots,
        holidaySettings: holidaySettings
      },
      certifications: certifications
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name,
          issuer: c.issuer || ''
        })),
      profileImage: profileImage,
    }

    try {
      const result = await api.post('/experts/apply', applicationData)

      if (result.success) {
        // 성공 시 로컬스토리지 정리 (선택사항)
        localStorage.removeItem('pendingExpertApplication')

        alert('전문가 신청이 성공적으로 접수되었습니다!')

        // 사용자 정보 새로고침 후 진행현황 페이지로 이동
        window.location.href = '/experts/application-status'
      } else {
        throw new Error(result.error?.message || '신청 제출 실패')
      }
    } catch (error: any) {
      console.error('Application submission error:', error)

      // API 클라이언트가 이미 Toast와 리다이렉션을 처리하지만
      // 추가적인 사용자 피드백이 필요한 경우에만 alert 표시
      if (error.status !== 401) {
        alert(error.message || '신청 제출 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  // 인증 상태 확인 중이거나 인증되지 않은 사용자는 로딩 화면 표시
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading
              ? '인증 상태 확인 중...'
              : '로그인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">전문가 등록</h1>
        <p className="text-gray-600 mt-1">
          경험과 지식을 나누고 수익을 만들어보세요. 3단계로 등록 신청을 완료할
          수 있습니다.
        </p>
      </header>

      {/* 혜택 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="mt-3 font-semibold text-gray-900">고객 연결</h3>
          <p className="mt-1 text-sm text-gray-600">
            관심 카테고리 고객과 자동 매칭되어 상담 요청을 받아요.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Award className="w-5 h-5 text-amber-600" />
          <h3 className="mt-3 font-semibold text-gray-900">레벨 시스템</h3>
          <p className="mt-1 text-sm text-gray-600">
            실적과 평점에 따라 노출 순위와 수익이 상승합니다.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="mt-3 font-semibold text-gray-900">안전한 정산</h3>
          <p className="mt-1 text-sm text-gray-600">
            플랫폼이 결제/정산을 대신 처리해 드립니다.
          </p>
        </div>
      </section>

      {/* 단계 네비게이션 */}
      <nav className="mb-6">
        <ol className="flex items-center gap-3 text-sm">
          <li
            className={`px-3 py-1 rounded-full border ${step >= 1 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            1. 기본정보
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 2 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            2. 본인인증
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 3 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            3. 전문정보
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 4 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            4. 서비스 이용약관
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 5 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            5. 검수 및 통보
          </li>
        </ol>
      </nav>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <Step1BasicInfo
            fullName={fullName}
            email={email}
            phoneNumber={phoneNumber}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onPhoneNumberChange={setPhoneNumber}
            onNext={() => setStep(2)}
            canGoNext={fullName.trim() !== '' && email.trim() !== '' && phoneNumber.trim() !== ''}
          />
        )}

        {/* Step 2: 휴대폰 인증 */}
        {step === 2 && (
          <Step2PhoneVerification
            phoneNumber={phoneNumber}
            phoneVerified={phoneVerified}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onPrevious={() => setStep(1)}
            onNext={() => setStep(3)}
            canGoNext={phoneVerified}
          />
        )}

        {/* Step 3-1: 기본 프로필 */}
        {step === 3 && (
          <Step31BasicProfile
            profileImage={profileImage}
            onProfileImageUpload={handleProfileImageUpload}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            experienceYears={experienceYears}
            keywordsInput={keywordsInput}
            keywords={keywords}
            onKeywordsChange={handleKeywordsChange}
            suggestedKeywords={suggestedKeywords}
            getRecommendedKeywords={getRecommendedKeywords}
            bio={bio}
            onBioChange={setBio}
            workExperience={workExperience}
            onWorkExperienceChange={updateWorkExperience}
            onAddWorkExperience={addWorkExperience}
            onRemoveWorkExperience={removeWorkExperience}
            education={education}
            onEducationChange={updateEducation}
            onAddEducation={addEducation}
            onRemoveEducation={removeEducation}
            certifications={certifications}
            onCertificationChange={updateCertification}
            onAddCertification={addCertification}
            onRemoveCertification={removeCertification}
            onPrevious={() => setStep(2)}
            onNext={() => setStep(3.5)}
          />
        )}

        {/* Step 3-2: 일정 및 상담 설정 */}
        {step === 3.5 && (
          <Step32ScheduleSettings
            mbti={mbti}
            onMbtiChange={setMbti}
            consultationStyle={consultationStyle}
            onConsultationStyleChange={setConsultationStyle}
            consultationTypes={consultationTypes}
            onToggleConsultationType={toggleConsultationType}
            availabilitySlots={availabilitySlots}
            holidaySettings={holidaySettings}
            onAvailabilityChange={handleAvailabilityChange}
            certifications={certifications}
            onCertificationChange={updateCertification}
            onAddCertification={addCertification}
            onRemoveCertification={removeCertification}
            portfolioPreviews={portfolioPreviews}
            onPortfolioUpload={handlePortfolioUpload}
            onRemovePortfolio={removePortfolioFile}
            socialLinks={socialLinks}
            onSocialLinkChange={handleSocialLinkChange}
            onPrevious={() => setStep(3)}
            onNext={() => {
              if (canGoNextStep3) {
                setShowValidation(false)
                setStep(4)
              } else {
                setShowValidation(true)
              }
            }}
            canGoNext={canGoNextStep3}
            showValidation={showValidation}
            validationMessage={validationMessage}
          />
        )}

        {/* Step 4: 약관 동의 */}
        {step === 4 && (
          <Step4Terms
            agreeService={agreeService}
            onAgreeServiceChange={setAgreeService}
            agreePrivacy={agreePrivacy}
            onAgreePrivacyChange={setAgreePrivacy}
            onPrevious={() => setStep(3.5)}
            onNext={() => agree && setStep(5)}
            canGoNext={agree}
          />
        )}

        {/* Step 5: 최종 검토 */}
        {step === 5 && (
          <Step5Review
            onPrevious={() => setStep(4)}
            onSubmit={handleSubmit}
          />
        )}

        {/* Step 6: 완료 화면 */}
        {step === 6 && (
          <Step6Complete email={email} />
        )}
      </div>

      {/* 간편인증 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">간편인증</h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6">
              {/* 인증 서비스 선택 */}
              <div className="mb-6">
                <div className="grid grid-cols-5 gap-3">
                  {/* KB모바일 */}
                  <button
                    onClick={() => {
                      // TODO: KB모바일 인증 연동
                      setPhoneVerified(true)
                      setShowAuthModal(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-800">KB</span>
                    </div>
                    <span className="text-[10px] text-center text-gray-700 leading-tight">KB모바일<br/>인증서</span>
                  </button>

                  {/* 삼성패스 */}
                  <button
                    onClick={() => {
                      setPhoneVerified(true)
                      setShowAuthModal(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold leading-tight text-center">SAMSUNG<br/>Pass</span>
                    </div>
                    <span className="text-[10px] text-center text-gray-700 leading-tight">삼성패스</span>
                  </button>

                  {/* PASS */}
                  <button
                    onClick={() => {
                      setPhoneVerified(true)
                      setShowAuthModal(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-base font-bold">PASS</span>
                    </div>
                    <span className="text-[10px] text-center text-gray-700 leading-tight">통신사 인증서<br/>(SKT,KT,LG U+)</span>
                  </button>

                  {/* 카카오톡 */}
                  <button
                    onClick={() => {
                      setPhoneVerified(true)
                      setShowAuthModal(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center">
                      <span className="text-xl">💬</span>
                    </div>
                    <span className="text-[10px] text-center text-gray-700 leading-tight">카카오톡</span>
                  </button>

                  {/* 페이코 */}
                  <button
                    onClick={() => {
                      setPhoneVerified(true)
                      setShowAuthModal(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PAYCO</span>
                    </div>
                    <span className="text-[10px] text-center text-gray-700 leading-tight">페이코</span>
                  </button>
                </div>

                <div className="flex items-center justify-end mt-3">
                  <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    다른 서비스는 없나요 <span className="text-lg">❓</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-6" />

              {/* 정보 입력 폼 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">주민등록번호</label>
                    <input
                      type="text"
                      placeholder="900101"
                      maxLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <input
                      type="password"
                      placeholder="••••••••"
                      maxLength={7}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">휴대폰번호</label>
                  <div className="flex gap-2">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>010</option>
                      <option>011</option>
                      <option>016</option>
                      <option>017</option>
                      <option>018</option>
                      <option>019</option>
                    </select>
                    <input
                      type="text"
                      placeholder="12341234"
                      maxLength={8}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">간편인증서비스 이용에 대한 동의</h3>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>개인정보 이용 동의(필수)</span>
                    <button className="ml-auto text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded text-xs">
                      자세히보기
                    </button>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>고유식별번호처리 동의(필수)</span>
                    <button className="ml-auto text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded text-xs">
                      자세히보기
                    </button>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>서비스 이용 약관 동의(필수)</span>
                    <button className="ml-auto text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded text-xs">
                      자세히보기
                    </button>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>제3자 정보제공 동의(필수)</span>
                    <button className="ml-auto text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded text-xs">
                      자세히보기
                    </button>
                  </label>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>사용방법 안내</span>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    // TODO: 실제 인증 처리
                    setPhoneVerified(true)
                    setShowAuthModal(false)
                    setStep(3)
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  인증 요청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
