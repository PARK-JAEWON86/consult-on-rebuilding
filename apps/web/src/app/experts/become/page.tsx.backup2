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

type Step = 1 | 2 | 3 | 4 | 5 | 6

type ConsultationType = 'video' | 'chat' | 'voice'

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

type DayAvailability = {
  available: boolean
  startTime: string
  endTime: string
}

type Availability = Record<DayKey, DayAvailability>

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
  const [availability, setAvailability] = useState<Availability>({
    monday: { available: false, startTime: '09:00', endTime: '18:00' },
    tuesday: { available: false, startTime: '09:00', endTime: '18:00' },
    wednesday: { available: false, startTime: '09:00', endTime: '18:00' },
    thursday: { available: false, startTime: '09:00', endTime: '18:00' },
    friday: { available: false, startTime: '09:00', endTime: '18:00' },
    saturday: { available: false, startTime: '09:00', endTime: '18:00' },
    sunday: { available: false, startTime: '09:00', endTime: '18:00' },
  })
  const [excludeHolidays, setExcludeHolidays] = useState(true)
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
  const hasAvailability = Object.values(availability).some(day => day.available)

  const canGoNextStep3 =
    selectedCategoryId !== null &&
    profileImage !== null &&
    keywords.length > 0 &&
    bio.trim().length >= 30 &&
    consultationTypes.length > 0 &&
    hasAvailability

  // 전문분야 변경 시 추천 키워드 업데이트
  useEffect(() => {
    if (specialty && categories.length > 0) {
      const keywords = getRecommendedKeywords(specialty)
      setSuggestedKeywords(keywords)
    } else {
      setSuggestedKeywords([])
    }
  }, [specialty, categories])


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

  const handleAvailabilityChange = (
    day: DayKey,
    field: 'available' | 'startTime' | 'endTime',
    value: boolean | string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  // 시간대 생성 (30분 단위)
  const generateTimeOptions = () => {
    const times: string[] = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0')
        const minute = m.toString().padStart(2, '0')
        times.push(`${hour}:${minute}`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // 일괄 선택 함수들 (토글 기능)
  const selectAllDays = () => {
    const newAvailability = { ...availability }
    const allDays = Object.keys(newAvailability) as DayKey[]
    const allSelected = allDays.every((day) => newAvailability[day].available)

    allDays.forEach((day) => {
      newAvailability[day].available = !allSelected
    })
    setAvailability(newAvailability)
  }

  const selectWeekdays = () => {
    const weekdays: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const newAvailability = { ...availability }
    const allWeekdaysSelected = weekdays.every((day) => newAvailability[day].available)

    weekdays.forEach((day) => {
      newAvailability[day].available = !allWeekdaysSelected
    })
    setAvailability(newAvailability)
  }

  const selectWeekend = () => {
    const weekend: DayKey[] = ['saturday', 'sunday']
    const newAvailability = { ...availability }
    const allWeekendSelected = weekend.every((day) => newAvailability[day].available)

    weekend.forEach((day) => {
      newAvailability[day].available = !allWeekendSelected
    })
    setAvailability(newAvailability)
  }

  const applyTimeToSelected = (startTime: string, endTime: string) => {
    const newAvailability = { ...availability }
    Object.keys(newAvailability).forEach((day) => {
      if (newAvailability[day as DayKey].available) {
        newAvailability[day as DayKey].startTime = startTime
        newAvailability[day as DayKey].endTime = endTime
      }
    })
    setAvailability(newAvailability)
  }

  const [bulkStartTime, setBulkStartTime] = useState('09:00')
  const [bulkEndTime, setBulkEndTime] = useState('18:00')

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

  const dayLabels: Record<DayKey, string> = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
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

    // availability 데이터 변환 (startTime, endTime → hours)
    const transformedAvailability = Object.entries(availability).reduce((acc, [day, data]) => {
      acc[day] = {
        available: data.available,
        hours: data.available ? `${data.startTime}-${data.endTime}` : ''
      }
      return acc
    }, {} as Record<string, { available: boolean; hours: string }>)

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
      availability: transformedAvailability,
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
        {step === 1 && (
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
                    이름과 이메일은 로그인한 계정 정보가 자동으로 입력됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 기본 정보: 이름, 이메일, 휴대폰 번호 */}
            <div className="max-w-full">
              <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름
                      <span className="ml-2 text-xs text-gray-500">(로그인 계정 정보)</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                      <span className="ml-2 text-xs text-gray-500">(로그인 계정 정보)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      휴대폰 번호
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setPhoneNumber(value)
                      }}
                      placeholder="01012345678"
                      maxLength={11}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      숫자만 입력해주세요 (하이픈 제외)
                    </p>
                  </div>
                </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={!canGoNextStep1}
                onClick={() => setStep(2)}
                className={`px-5 py-2 rounded-lg text-white font-medium ${canGoNextStep1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
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
                    onClick={() => setShowAuthModal(true)}
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
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                disabled={!canGoNextStep2}
                onClick={() => setStep(3)}
                className={`px-5 py-2 rounded-lg text-white font-medium ${canGoNextStep2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* 프로필 사진 & 상담분야, 경력 */}
            <div className="flex gap-6">
              {/* 프로필 사진 */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" /> 프로필 사진
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="w-36">
                  <div className="w-full h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden mb-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="프로필 미리보기"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">사진을<br/>업로드해주세요</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="profileImage"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" /> 업로드
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG 파일 (최대 5MB)<br/>
                    권장 사이즈: 300x400px
                  </p>
                </div>
              </div>

              {/* 상담분야, 경력, 키워드 */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-1 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5" /> 상담분야
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    {isLoadingCategories ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                        카테고리 로딩 중...
                      </div>
                    ) : (
                      <select
                        value={selectedCategoryId || ''}
                        onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">상담분야를 선택해주세요</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nameKo}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-1 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" /> 경력 (년)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={experienceYears}
                      onChange={(e) =>
                        setExperienceYears(parseInt(e.target.value || '0'))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 키워드 */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> 키워드 (상담 주제)
                    <span className="text-red-500 ml-1">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(콤마로 구분, 최대 10개)</span>
                  </h3>
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => handleKeywordsChange(e.target.value)}
                    placeholder={
                      selectedCategoryId
                        ? `예: ${getRecommendedKeywords(
                            categories.find(c => c.id === selectedCategoryId)?.nameKo || ''
                          ).slice(0, 3).join(', ')}`
                        : "예: 스트레스, 우울, 불안, 계약법"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {keywords.length > 0 && `입력된 키워드: ${keywords.length}개`}
                    </p>
                    {keywords.length >= 10 && (
                      <p className="text-xs text-red-500">최대 10개까지만 입력 가능합니다</p>
                    )}
                  </div>

                  {/* 입력된 키워드 태그 표시 */}
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 추천 키워드 표시 */}
                  {suggestedKeywords.length > 0 && keywords.length < 10 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">💡 추천 키워드 (클릭하여 추가):</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedKeywords.slice(0, 8).map((keyword, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!keywords.includes(keyword) && keywords.length < 10) {
                                const newInput = keywordsInput
                                  ? `${keywordsInput}, ${keyword}`
                                  : keyword
                                handleKeywordsChange(newInput)
                              }
                            }}
                            disabled={keywords.includes(keyword)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              keywords.includes(keyword)
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer'
                            }`}
                            title={
                              keywords.includes(keyword)
                                ? '이미 추가됨'
                                : '클릭하여 추가'
                            }
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 자기소개 */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> 자기소개
                    <span className="text-red-500 ml-1">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(최소 30자)</span>
                  </h3>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    placeholder="전문 분야와 상담 방식, 강점을 소개해 주세요. 예) 8년간의 임상 경험으로 스트레스/불안 문제 해결을 돕고 있습니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* MBTI & 상담 스타일 */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <label className="block text-base font-semibold text-gray-900 mb-1 flex items-center">
                  <Users className="w-4 h-4 mr-1.5" /> MBTI
                  <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
                </label>
                <select
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택하세요</option>
                  <option value="ISTJ">ISTJ</option>
                  <option value="ISFJ">ISFJ</option>
                  <option value="INFJ">INFJ</option>
                  <option value="INTJ">INTJ</option>
                  <option value="ISTP">ISTP</option>
                  <option value="ISFP">ISFP</option>
                  <option value="INFP">INFP</option>
                  <option value="INTP">INTP</option>
                  <option value="ESTP">ESTP</option>
                  <option value="ESFP">ESFP</option>
                  <option value="ENFP">ENFP</option>
                  <option value="ENTP">ENTP</option>
                  <option value="ESTJ">ESTJ</option>
                  <option value="ESFJ">ESFJ</option>
                  <option value="ENFJ">ENFJ</option>
                  <option value="ENTJ">ENTJ</option>
                </select>
              </div>

              <div className="col-span-9">
                <label className="block text-base font-semibold text-gray-900 mb-1 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> 상담 스타일
                  <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항, 최대 2문장)</span>
                </label>
                <input
                  type="text"
                  value={consultationStyle}
                  onChange={(e) => setConsultationStyle(e.target.value)}
                  placeholder="예: 공감적이고 경청하는 스타일로 상담합니다"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 상담 유형 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" /> 제공 가능한 상담 유형
                <span className="text-red-500 ml-1">*</span>
                <span className="ml-2 text-xs text-gray-500 font-normal">(1개 이상 선택, 추후 변경 가능)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    { id: 'voice', label: '음성 상담', Icon: Phone },
                    { id: 'chat', label: '채팅 상담', Icon: MessageCircle },
                    { id: 'video', label: '화상 상담', Icon: Video },
                  ] as Array<{
                    id: ConsultationType
                    label: string
                    Icon: typeof Phone
                  }>
                ).map(({ id, label, Icon }) => {
                  const selected = consultationTypes.includes(id)
                  return (
                    <label
                      key={id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleConsultationType(id)}
                        className="sr-only"
                      />
                      <Icon
                        className={`w-5 h-5 mr-3 ${selected ? 'text-blue-600' : 'text-gray-400'}`}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 학력 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" /> 학력
                <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
              </h3>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                  >
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) =>
                        updateEducation(idx, 'school', e.target.value)
                      }
                      placeholder="학교명 (예: 서울대학교)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) =>
                        updateEducation(idx, 'major', e.target.value)
                      }
                      placeholder="전공 (예: 심리학과)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(idx, 'degree', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">학위 선택</option>
                        <option value="고졸">고졸</option>
                        <option value="전문학사">전문학사</option>
                        <option value="학사">학사</option>
                        <option value="석사">석사</option>
                        <option value="박사">박사</option>
                      </select>
                      {education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(idx)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" /> 학력 추가
              </button>
            </div>

            {/* 실무 경력 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" /> 실무 경력
                <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
              </h3>
              <div className="space-y-3">
                {workExperience.map((work, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                  >
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) =>
                        updateWorkExperience(idx, 'company', e.target.value)
                      }
                      placeholder="회사명 (예: 삼성전자)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={work.position}
                      onChange={(e) =>
                        updateWorkExperience(idx, 'position', e.target.value)
                      }
                      placeholder="직책/직무 (예: 선임연구원)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={work.period}
                        onChange={(e) =>
                          updateWorkExperience(idx, 'period', e.target.value)
                        }
                        placeholder="기간 (예: 2020-2023)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {workExperience.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(idx)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addWorkExperience}
                className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" /> 경력 추가
              </button>
            </div>

            {/* 자격증 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2" /> 자격증 및 발급기관
                <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
              </h3>
              <div className="space-y-3">
                {certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                  >
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) =>
                        updateCertification(idx, 'name', e.target.value)
                      }
                      placeholder="자격증명 (예: 임상심리사 1급)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) =>
                        updateCertification(idx, 'issuer', e.target.value)
                      }
                      placeholder="발급기관 (예: 한국산업인력공단)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert.year}
                        onChange={(e) =>
                          updateCertification(idx, 'year', e.target.value)
                        }
                        placeholder="취득년도 (예: 2020)"
                        maxLength={4}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertification(idx)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCertification}
                className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" /> 자격증 추가
              </button>
            </div>

            {/* 포트폴리오 이미지 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" /> 포트폴리오 이미지
                <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항, 최대 5개)</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {portfolioPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={preview}
                        alt={`포트폴리오 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePortfolioFile(idx)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {portfolioFiles.length < 5 && (
                  <label className="aspect-square bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePortfolioUpload}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-xs text-gray-600 text-center px-2">
                      이미지 업로드
                    </p>
                  </label>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG 파일 (각 최대 5MB) • 포트폴리오, 자격증, 경력 관련 이미지를 업로드해주세요
              </p>
            </div>

            {/* 일정 - 캘린더 스타일 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> 상담 가능한 일정
                <span className="text-red-500 ml-1">*</span>
              </h3>

              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-max">
                  {(Object.keys(dayLabels) as DayKey[]).map((day) => {
                    const isWeekend = day === 'saturday' || day === 'sunday'
                    return (
                      <div
                        key={day}
                        className={`p-4 border-2 rounded-lg ${
                          isWeekend
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {/* 요일 헤더 */}
                        <div className="text-center mb-3">
                          <h4 className="text-sm font-bold text-gray-900">
                            {dayLabels[day]}
                          </h4>
                        </div>

                        {/* 가능 여부 */}
                        <div className="flex justify-center mb-3">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={availability[day].available}
                              onChange={(e) =>
                                handleAvailabilityChange(day, 'available', e.target.checked)
                              }
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-xs font-medium text-gray-700">가능</span>
                          </label>
                        </div>

                        {/* 시간 선택 */}
                        <div className="space-y-2">
                          <select
                            value={availability[day].startTime}
                            onChange={(e) =>
                              handleAvailabilityChange(day, 'startTime', e.target.value)
                            }
                            disabled={!availability[day].available}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>

                          <div className="text-center text-xs text-gray-500">~</div>

                          <select
                            value={availability[day].endTime}
                            onChange={(e) =>
                              handleAvailabilityChange(day, 'endTime', e.target.value)
                            }
                            disabled={!availability[day].available}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 일괄 조작 버튼 */}
              <div className="mt-4 flex flex-wrap gap-3 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  평일 설정
                </button>
                <button
                  type="button"
                  onClick={selectWeekend}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  주말 설정
                </button>
                <button
                  type="button"
                  onClick={() => setExcludeHolidays(!excludeHolidays)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    excludeHolidays
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {excludeHolidays ? '✓ 공휴일 제외' : '공휴일 포함'}
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-700 font-medium">시간 일괄 변경:</span>
                  <select
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">~</span>
                  <select
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => applyTimeToSelected(bulkStartTime, bulkEndTime)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    적용
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                💡 "가능" 체크된 요일에만 시간 일괄 적용됩니다. 공휴일 제외가 활성화되면 공휴일에는 상담이 제공되지 않습니다.
              </p>
            </div>

            <div className="flex justify-between items-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>

              <div className="flex items-end gap-3">
                {/* 필수 항목 안내 메시지 */}
                {showValidation && !canGoNextStep3 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-semibold text-red-900 whitespace-nowrap">다음 필수 항목을 작성해주세요:</p>
                      <span className="text-xs text-red-800">
                        {[
                          !profileImage && '프로필 사진',
                          !selectedCategoryId && '상담분야',
                          keywords.length === 0 && '키워드',
                          !bio.trim() && '자기소개',
                          consultationTypes.length === 0 && '상담 유형',
                          !Object.values(availability).some(day => day.available) && '상담 일정'
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (canGoNextStep3) {
                      setShowValidation(false)
                      setStep(4)
                    } else {
                      setShowValidation(true)
                    }
                  }}
                  className="px-5 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            {/* 서비스 약관 */}
            <div className="rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <FileCheck2 className="w-4 h-4 mr-2" /> 서비스 이용약관
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border border-gray-200">
                <div className="text-sm text-gray-700 leading-relaxed space-y-4">
                  <div>
                    <strong className="text-gray-900">제1조 (목적)</strong><br />
                    본 약관은 Consult-On(이하 "회사")이 제공하는 전문가 상담 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                  </div>

                  <div>
                    <strong className="text-gray-900">제2조 (정의)</strong><br />
                    1. "서비스"란 회사가 제공하는 온라인 전문가 상담 플랫폼을 의미합니다.<br />
                    2. "이용자"란 본 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.<br />
                    3. "전문가"란 각 분야의 전문지식을 보유하고 회사의 심사를 통과하여 상담 서비스를 제공하는 자를 말합니다.<br />
                    4. "상담"이란 회원과 전문가 간에 이루어지는 온라인 상담 서비스를 말합니다.
                  </div>

                  <div>
                    <strong className="text-gray-900">제4조 (회원가입)</strong><br />
                    1. 회원가입은 신청자가 온라인으로 회사에서 제공하는 소정의 양식에 개인정보를 기록하여 가입을 완료하는 것으로 성립됩니다.<br />
                    2. 회사는 허위정보 기재, 타인 명의 이용, 미성년자의 법정대리인 동의 누락 등의 경우 회원가입을 거절하거나 사후에 회원자격을 상실시킬 수 있습니다.
                  </div>

                  <div>
                    <strong className="text-gray-900">제10조 (회원의 의무)</strong><br />
                    회원은 다음 행위를 하여서는 안됩니다:<br />
                    • 신청 또는 변경 시 허위내용의 등록<br />
                    • 타인의 정보도용<br />
                    • 회사가 게시한 정보의 변경<br />
                    • 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
                    • 회사와 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
                    • 외설 또는 폭력적인 메시지, 화상, 음성 등을 공개 또는 게시하는 행위
                  </div>

                  <div>
                    <strong className="text-gray-900">제7조 (환불정책)</strong><br />
                    1. 서비스 이용 전: 결제 후 서비스 이용 전 취소 시 전액 환불됩니다.<br />
                    2. 서비스 이용 중: 이용한 시간에 비례하여 차감 후 환불됩니다.<br />
                    3. 전문가의 사유로 인한 취소: 전액 환불 및 추가 보상이 제공될 수 있습니다.
                  </div>

                  <div>
                    <strong className="text-gray-900">제9조 (회사의 의무)</strong><br />
                    1. 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 노력합니다.<br />
                    2. 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 보안 시스템을 구축하며 개인정보 보호정책을 공시하고 준수합니다.
                  </div>

                  <div>
                    <strong className="text-gray-900">제12조 (면책조항)</strong><br />
                    1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
                    2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.<br />
                    3. 회사는 전문가가 제공하는 상담 내용의 정확성, 신뢰성에 대해 보증하지 않으며, 상담 결과에 대한 책임을 지지 않습니다.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeService"
                  checked={agreeService}
                  onChange={(e) => setAgreeService(e.target.checked)}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreeService" className="text-sm text-gray-700 cursor-pointer flex-1">
                  <span className="font-medium">
                    서비스 이용약관에 동의합니다 <span className="text-red-500">*</span>
                  </span>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    전체 내용 보기
                  </a>
                </label>
              </div>
            </div>

            {/* 개인정보 처리방침 */}
            <div className="rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" /> 개인정보처리방침
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border border-gray-200">
                <div className="text-sm text-gray-700 leading-relaxed space-y-4">
                  <div>
                    <strong className="text-gray-900">1. 개인정보의 처리목적</strong><br />
                    Consult-On(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다:<br />
                    • 회원제 서비스 이용에 따른 본인확인, 개인식별<br />
                    • 전문가 상담 서비스 제공<br />
                    • 결제 및 정산 서비스 제공<br />
                    • 고객센터 운영<br />
                    • 신규 서비스 개발 및 마케팅
                  </div>

                  <div>
                    <strong className="text-gray-900">2. 개인정보의 처리 및 보유기간</strong><br />
                    회사는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다:<br />
                    • 회원정보: 회원탈퇴 후 즉시 삭제 (단, 관계법령에 따라 보존이 필요한 경우 해당 기간동안 보관)<br />
                    • 결제정보: 결제 완료 후 5년<br />
                    • 상담기록: 상담 종료 후 1년<br />
                    • 접속기록: 3개월
                  </div>

                  <div>
                    <strong className="text-gray-900">3. 처리하는 개인정보의 항목</strong><br />
                    회사는 다음의 개인정보 항목을 처리하고 있습니다:<br />
                    • 필수항목: 이름, 이메일주소, 휴대폰번호<br />
                    • 선택항목: 성별, 연령대, 관심분야<br />
                    • 자동수집항목: IP주소, 쿠키, 서비스 이용기록, 방문기록 등
                  </div>

                  <div>
                    <strong className="text-gray-900">4. 개인정보의 제3자 제공</strong><br />
                    회사는 정보주체의 동의, 법률의 특별한 규정 등이 있는 경우에만 개인정보를 제3자에게 제공합니다.<br />
                    • 결제대행업체(토스페이먼츠, KG이니시스): 결제 및 정산 서비스<br />
                    • 제공항목: 이름, 결제정보<br />
                    • 보유 및 이용기간: 결제 완료 후 5년
                  </div>

                  <div>
                    <strong className="text-gray-900">6. 정보주체의 권리·의무 및 행사방법</strong><br />
                    정보주체는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다:<br />
                    • 개인정보 처리현황 통지요구<br />
                    • 개인정보 처리정지 요구<br />
                    • 개인정보의 수정·삭제 요구<br />
                    • 손해배상 청구
                  </div>

                  <div>
                    <strong className="text-gray-900">5. 개인정보처리의 위탁</strong><br />
                    회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:<br />
                    • 클라우드 서비스: Amazon Web Services (서버 호스팅 및 데이터 저장)
                  </div>

                  <div>
                    <strong className="text-gray-900">7. 개인정보의 파기</strong><br />
                    회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br />
                    • 전자적 파일: 기록을 재생할 수 없는 기술적 방법 사용<br />
                    • 종이 문서: 분쇄기로 분쇄하거나 소각
                  </div>

                  <div>
                    <strong className="text-gray-900">8. 개인정보의 안전성 확보조치</strong><br />
                    회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:<br />
                    • 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육<br />
                    • 기술적 조치: 접근권한 관리, 접근통제시스템 설치, 암호화, 보안프로그램 설치<br />
                    • 물리적 조치: 전산실, 자료보관실 등의 접근통제
                  </div>

                  <div>
                    <strong className="text-gray-900">9. 개인정보 보호책임자</strong><br />
                    회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 개인정보 보호책임자를 지정하고 있습니다.<br />
                    • 개인정보보호책임자: 박재원<br />
                    • 이메일: consult.on.official@gmail.com
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreePrivacy" className="text-sm text-gray-700 cursor-pointer flex-1">
                  <span className="font-medium">
                    개인정보처리방침에 동의합니다 <span className="text-red-500">*</span>
                  </span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    전체 내용 보기
                  </a>
                </label>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => agree && setStep(5)}
                className={`px-5 py-2 rounded-lg text-white font-medium ${agree ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">검수 안내</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    제출하신 정보는 자격/경력 기준에 따라 검수되며, 평균
                    1~3영업일 소요됩니다. 필요 시 추가 증빙을 요청드릴 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                제출 전 확인사항
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>모든 필수 정보가 정확하게 입력되었는지 확인해주세요.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>검수 기간 동안 추가 서류 요청 시 이메일로 안내드립니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>승인 완료 후 등록하신 이메일로 결과를 안내드립니다.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
              >
                신청 제출
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            {/* 성공 아이콘 */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            {/* 메인 메시지 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                신청이 완료되었습니다!
              </h2>
              <p className="text-gray-600">
                전문가 등록 신청이 성공적으로 접수되었습니다.
              </p>
            </div>

            {/* 안내 사항 */}
            <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                다음 단계 안내
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[60px]">검수 기간:</span>
                  <span>평균 1~3 영업일 소요됩니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[60px]">결과 안내:</span>
                  <span>검수 완료 후 등록하신 이메일({email})로 결과를 안내드립니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[60px]">추가 서류:</span>
                  <span>필요 시 자격증 또는 경력 증빙 서류를 요청드릴 수 있습니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[60px]">승인 후:</span>
                  <span>전문가로 승인되면 바로 상담 서비스를 시작하실 수 있습니다.</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                홈으로 돌아가기
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                대시보드로 이동
              </button>
            </div>
          </div>
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
