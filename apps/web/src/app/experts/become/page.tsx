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
  XCircle,
} from 'lucide-react'

// Step Components
import Step1BasicInfo from '@/components/experts/become-steps/Step1BasicInfo'
import Step31BasicProfile from '@/components/experts/become-steps/Step3-1BasicProfile'
import Step32ScheduleSettings from '@/components/experts/become-steps/Step3-2ScheduleSettings'
import Step4Terms from '@/components/experts/become-steps/Step4Terms'
import Step5Review from '@/components/experts/become-steps/Step5Review'
import {
  AvailabilitySlot,
  HolidaySettings,
} from '@/components/experts/AvailabilityScheduleEditor'

type Step = 1 | 2 | 2.5 | 3 | 4 | 5

type ConsultationType = 'video' | 'chat' | 'voice'

export default function BecomeExpertPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const [step, setStep] = useState<Step>(1)

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
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
    // ADDITIONAL_INFO_REQUESTED, REJECTED나 null은 계속 진행 (재지원 허용)
  }, [user, isLoading, router])

  // 1단계: 기본 정보 + 휴대폰 인증
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // 사용자 정보 로드 시 이름, 이메일, 전화번호 자동 설정
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🔍 AuthProvider에서 사용자 정보 로드됨:', user)
      setFullName(user.name || '')
      setEmail(user.email)
      setPhoneNumber((user as any).phoneNumber || '')
    } else {
      console.log('⚠️ 사용자 정보가 없습니다. isLoading:', isLoading)
    }
  }, [user, isLoading])

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
  const [languages, setLanguages] = useState<string[]>(['한국어'])
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'schedule'>(
    'basic'
  )

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

  // 일정 및 자격증 (Step 3에서 이동)
  // 예약 가능 시간 (슬롯 기반 시스템)
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([])
  const [holidaySettings, setHolidaySettings] = useState<HolidaySettings>({
    acceptHolidayConsultations: false,
    holidayNote: '',
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

  // 소셜링크 상태 변화 추적
  useEffect(() => {
    console.log('🔗 socialLinks 상태 변경됨:', socialLinks)
  }, [socialLinks])

  // 스텝 변화 추적
  useEffect(() => {
    console.log('📍 스텝 변경됨:', step, '| socialLinks:', socialLinks)
  }, [step])

  // ADDITIONAL_INFO_REQUESTED 상태일 때 기존 지원 정보로 폼 자동 채우기
  useEffect(() => {
    if (!user || isLoading) return

    const status = (user as any).expertApplicationStatus
    const appData = (user as any).expertApplicationData

    if (status === 'ADDITIONAL_INFO_REQUESTED' && appData) {
      console.log('🔄 추가 정보 요청 상태 - 기존 데이터로 폼 채우기:', appData)

      // 1단계: 기본 정보
      if (appData.phoneNumber) {
        setPhoneNumber(appData.phoneNumber) // ✅ ADD: Restore phone number
      }
      if (appData.specialty) {
        setSpecialty(appData.specialty)
        // specialty에서 카테고리 추출 (예: "심리상담 - 가족상담" -> "심리상담")
        const categoryName = appData.specialty.split(' - ')[0]
        // 카테고리가 로드되었으면 해당 카테고리 ID 찾기
        if (categories.length > 0) {
          const matchedCategory = categories.find(
            (cat) => cat.nameKo === categoryName
          )
          if (matchedCategory) {
            setSelectedCategoryId(matchedCategory.id)
          }
        }
      }
      if (appData.profileImage) {
        setProfileImage(appData.profileImage)
      }

      // 2단계: 전문 정보
      setExperienceYears(appData.experienceYears || 0)
      setBio(appData.bio || '')
      setKeywords(appData.keywords || [])
      setConsultationTypes(appData.consultationTypes || [])
      setLanguages(appData.languages || ['한국어'])
      setMbti(appData.mbti || '')
      setConsultationStyle(appData.consultationStyle || '')

      // 자격증 및 경력
      setCertifications(
        appData.certifications || [{ name: '', issuer: '', year: '' }]
      )
      setEducation(appData.education || [{ school: '', major: '', degree: '' }])
      setWorkExperience(
        appData.workExperience || [{ company: '', position: '', period: '' }]
      )

      // 스케줄 복원
      if (appData.availability) {
        // 요일별 객체를 슬롯 배열로 변환
        const slots: AvailabilitySlot[] = []
        const dayKeys = [
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ]

        dayKeys.forEach((dayKey) => {
          const dayData = appData.availability[dayKey]
          if (dayData && dayData.available && dayData.hours) {
            // "09:00-18:00, 19:00-21:00" 형식을 슬롯으로 분리
            const timeRanges = dayData.hours
              .split(',')
              .map((range: string) => range.trim())
            timeRanges.forEach((range: string) => {
              const [startTime, endTime] = range
                .split('-')
                .map((t: string) => t.trim())
              if (startTime && endTime) {
                slots.push({
                  dayOfWeek: dayKey as any,
                  startTime,
                  endTime,
                  isActive: true,
                })
              }
            })
          }
        })

        setAvailabilitySlots(slots)
        setHolidaySettings(
          appData.availability.holidaySettings || {
            acceptHolidayConsultations: false,
            holidayNote: '',
          }
        )
      }

      // 소셜 링크
      if (appData.socialLinks) {
        setSocialLinks({
          website: appData.socialLinks.website || '',
          instagram: appData.socialLinks.instagram || '',
          youtube: appData.socialLinks.youtube || '',
          linkedin: appData.socialLinks.linkedin || '',
          blog: appData.socialLinks.blog || '',
        })
      }

      // 포트폴리오 이미지
      if (appData.portfolioImages && Array.isArray(appData.portfolioImages)) {
        setPortfolioPreviews(appData.portfolioImages)
      }

      console.log('✅ 폼 자동 채우기 완료')
    }
  }, [user, isLoading, categories])

  // 카테고리 로드 후 specialty에 따른 추천 키워드 설정
  useEffect(() => {
    if (!user || isLoading || isLoadingCategories) return

    const status = (user as any).expertApplicationStatus
    const appData = (user as any).expertApplicationData

    if (
      status === 'ADDITIONAL_INFO_REQUESTED' &&
      appData &&
      appData.specialty &&
      categories.length > 0
    ) {
      // specialty 기반으로 추천 키워드 설정
      const recommendedKeywords = getRecommendedKeywords(appData.specialty)
      if (recommendedKeywords.length > 0) {
        setSuggestedKeywords(recommendedKeywords)
        console.log('✅ 추천 키워드 설정 완료:', recommendedKeywords)
      }
    }
  }, [user, isLoading, isLoadingCategories, categories])

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

  // Step 1: 기본정보 (이름, 이메일)
  const canGoNextStep1 = fullName.trim() !== '' && email.trim() !== ''

  // Step 2: 전문정보
  const hasAvailability =
    availabilitySlots.length > 0 &&
    availabilitySlots.some((slot) => slot.isActive)

  const canGoNextStep3 =
    selectedCategoryId !== null &&
    keywords.length > 0 &&
    bio.trim().length >= 30 &&
    consultationTypes.length > 0 &&
    hasAvailability

  // Validation message for Step 3
  const validationMessage = [
    !selectedCategoryId && '상담분야',
    keywords.length === 0 && '키워드',
    bio.trim().length < 30 && '자기소개(30자 이상)',
    consultationTypes.length === 0 && '상담유형',
    !hasAvailability && '상담 가능 시간',
  ]
    .filter(Boolean)
    .join(', ')

  // 전문분야 변경 시 추천 키워드 업데이트
  useEffect(() => {
    if (specialty && categories.length > 0) {
      const keywords = getRecommendedKeywords(specialty)
      setSuggestedKeywords(keywords)
    } else {
      setSuggestedKeywords([])
    }
  }, [specialty, categories])

  // 경력(년) 자동 계산: workExperience의 period에서 연도와 월 추출하여 정밀 계산
  useEffect(() => {
    const calculateTotalExperience = () => {
      const currentDate = new Date()
      let totalMonths = 0

      workExperience.forEach((exp) => {
        if (!exp.period || !exp.company) return // 빈 항목은 스킵

        // period 형식: "2020.01 ~ 2023.12" 또는 "2020 ~ 2023" 또는 "2020.01 ~ 현재"
        const periodRegex =
          /(\d{4})(?:\.(\d{1,2}))?\s*~\s*(?:(\d{4})(?:\.(\d{1,2}))?|(현재|재직중))/
        const match = exp.period.match(periodRegex)

        if (!match) return

        const startYear = parseInt(match[1])
        const startMonth = match[2] ? parseInt(match[2]) : 1 // 월이 없으면 1월로 가정

        let endYear: number
        let endMonth: number

        if (match[5]) {
          // "현재" 또는 "재직중"인 경우
          endYear = currentDate.getFullYear()
          endMonth = currentDate.getMonth() + 1 // getMonth()는 0-11이므로 +1
        } else if (match[3]) {
          // 종료 날짜가 있는 경우
          endYear = parseInt(match[3])
          endMonth = match[4] ? parseInt(match[4]) : 12 // 월이 없으면 12월로 가정
        } else {
          return
        }

        // 개월 수 계산
        const months = (endYear - startYear) * 12 + (endMonth - startMonth)
        totalMonths += Math.max(0, months)
      })

      // 개월을 년으로 변환 (소수점 첫째 자리까지, 반올림)
      const years = Math.round((totalMonths / 12) * 10) / 10
      setExperienceYears(years)
    }

    calculateTotalExperience()
  }, [workExperience])

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
          alert(
            '압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.'
          )
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
  const handleAvailabilityChange = (
    slots: AvailabilitySlot[],
    holidaySettings: HolidaySettings
  ) => {
    setAvailabilitySlots(slots)
    setHolidaySettings(holidaySettings)
  }

  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value)
    const keywordArray = value
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
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
    setWorkExperience((prev) => [
      ...prev,
      { company: '', position: '', period: '' },
    ])
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

    newFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하만 가능합니다.')
        return
      }
    })

    setPortfolioFiles((prev) => [...prev, ...newFiles])

    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPortfolioPreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePortfolioFile = (idx: number) => {
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== idx))
    setPortfolioPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSocialLinkChange = (
    platform: keyof typeof socialLinks,
    value: string
  ) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }))
  }

  const handleSubmit = async () => {
    console.log('========================================')
    console.log('🚀 handleSubmit 시작')
    console.log('📍 현재 스텝:', step)
    console.log('🔗 socialLinks 상태:', socialLinks)
    console.log('========================================')

    if (!agree) {
      alert('약관 동의가 필요합니다.')
      return
    }

    // 선택된 카테고리 이름 가져오기
    const selectedCategory = categories.find(
      (cat) => cat.id === selectedCategoryId
    )
    const categoryName = selectedCategory ? selectedCategory.nameKo : ''

    // specialty는 카테고리명만 (키워드는 별도로 keywords 필드에 전송)
    const fullSpecialty = categoryName || specialty

    // API로 전송할 데이터 구성
    // availability를 요일별 객체로 변환 (DTO 형식에 맞춤)
    const availabilityByDay = availabilitySlots.reduce(
      (acc, slot) => {
        const dayKey = slot.dayOfWeek
        if (!acc[dayKey]) {
          acc[dayKey] = {
            available: true,
            hours: `${slot.startTime}-${slot.endTime}`,
          }
        } else {
          // 같은 요일에 여러 시간대가 있는 경우 추가
          acc[dayKey].hours += `, ${slot.startTime}-${slot.endTime}`
        }
        return acc
      },
      {} as Record<string, { available: boolean; hours: string }>
    )

    const applicationData = {
      name: fullName,
      email: email,
      phoneNumber: phoneNumber || undefined, // 전화번호 추가 (입력값 사용)
      jobTitle: '', // 필요시 추가
      specialty: fullSpecialty,
      experienceYears: experienceYears,
      bio: bio,
      keywords: keywords.filter((k) => k.trim()),
      consultationTypes: consultationTypes,
      languages: languages.filter((lang) => lang.trim()),
      availability: availabilityByDay,
      availabilitySlots: availabilitySlots, // ✅ ADD: Send availabilitySlots array to backend
      holidaySettings: {
        acceptHolidayConsultations: holidaySettings.acceptHolidayConsultations,
        holidayNote: holidaySettings.holidayNote || undefined,
      },
      certifications: certifications
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name,
          issuer: c.issuer || '',
          year: c.year || '',
        })),
      education: education
        .filter((e) => e.school.trim())
        .map((e) => ({
          school: e.school,
          major: e.major || '',
          degree: e.degree || '',
        })),
      workExperience: workExperience
        .filter((w) => w.company.trim())
        .map((w) => ({
          company: w.company,
          position: w.position || '',
          period: w.period || '',
        })),
      profileImage: profileImage,
      mbti: mbti || undefined,
      consultationStyle: consultationStyle || undefined,
      socialLinks: (() => {
        // 소셜링크가 하나라도 있으면 객체로 전송
        const hasAnySocialLink =
          socialLinks.website ||
          socialLinks.instagram ||
          socialLinks.youtube ||
          socialLinks.linkedin ||
          socialLinks.blog
        console.log('🔗 소셜링크 체크:', {
          hasAnySocialLink,
          website: socialLinks.website,
          instagram: socialLinks.instagram,
          youtube: socialLinks.youtube,
          linkedin: socialLinks.linkedin,
          blog: socialLinks.blog,
        })

        if (!hasAnySocialLink) return undefined

        return {
          website: socialLinks.website || undefined,
          instagram: socialLinks.instagram || undefined,
          youtube: socialLinks.youtube || undefined,
          linkedin: socialLinks.linkedin || undefined,
          blog: socialLinks.blog || undefined,
        }
      })(),
      portfolioImages:
        portfolioPreviews.length > 0 ? portfolioPreviews : undefined,
    }

    // 소셜링크 디버깅
    console.log('🔗 소셜링크 원본 데이터:', socialLinks)
    console.log('🔗 소셜링크 전송 데이터:', applicationData.socialLinks)

    // 디버깅: 전송 데이터 로깅
    console.log('📤 전송할 데이터:', {
      ...applicationData,
      profileImage: profileImage
        ? `${profileImage.substring(0, 50)}... (${profileImage.length} chars)`
        : null,
    })

    try {
      const result = await api.post('/experts/apply', applicationData)

      if (result.success) {
        console.log('✅ 신청 제출 성공')

        // 성공 시 로컬스토리지 정리
        localStorage.removeItem('pendingExpertApplication')

        // ✅ 수정: refreshUser() 제거 (로그인이 풀리는 문제 해결)
        // application-status 페이지에서 자체적으로 refreshUser()를 호출하므로
        // 여기서는 바로 리다이렉트만 하면 됩니다
        console.log('✅ 신청 완료 - 상태 확인 페이지로 이동')

        // 진행 상황 페이지로 리다이렉트
        // application-status 페이지가 마운트되면서 최신 사용자 정보를 가져옵니다
        router.push('/experts/application-status')
      } else {
        throw new Error(result.error?.message || '신청 제출 실패')
      }
    } catch (error: any) {
      console.error('Application submission error:', error)

      // 401 에러는 인증 문제 - 로그인 페이지로 리다이렉트
      if (error.status === 401) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.')
        router.push('/auth/login?redirect=/experts/become')
      } else {
        alert(
          error.message ||
            '신청 제출 중 오류가 발생했습니다. 다시 시도해주세요.'
        )
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
            {isLoading ? '인증 상태 확인 중...' : '로그인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 거절 알림 배너 */}
      {(user as any)?.expertApplicationStatus === 'REJECTED' &&
        (user as any)?.expertApplicationData?.reviewNotes && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  지원이 거절되었습니다
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  안타깝지만 현재 지원이 승인되지 않았습니다. 아래 사유를
                  확인하시고 보완 후 재지원하실 수 있습니다.
                </p>
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {(user as any).expertApplicationData.reviewNotes}
                  </pre>
                </div>
                <p className="text-xs text-red-700 mt-3">
                  💡 정보를 수정하여 재지원하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* 추가 정보 요청 알림 배너 */}
      {(user as any)?.expertApplicationStatus === 'ADDITIONAL_INFO_REQUESTED' &&
        (user as any)?.expertApplicationData?.reviewNotes && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  추가 정보 요청
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  관리자가 다음 사항에 대한 추가 정보를 요청했습니다. 아래
                  내용을 확인하시고 해당 항목을 보완하여 재제출해주세요.
                </p>
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {(user as any).expertApplicationData.reviewNotes}
                  </pre>
                </div>
                <p className="text-xs text-amber-700 mt-3">
                  💡 아래 폼이 기존 제출 정보로 자동으로 채워져 있습니다. 요청된
                  항목만 수정하여 다시 제출하시면 됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {(user as any)?.expertApplicationStatus ===
          'ADDITIONAL_INFO_REQUESTED'
            ? '전문가 등록 - 추가 정보 제출'
            : '전문가 등록'}
        </h1>
        <p className="text-gray-600 mt-1">
          {(user as any)?.expertApplicationStatus ===
          'ADDITIONAL_INFO_REQUESTED'
            ? '요청된 항목을 확인하고 수정하여 재제출해주세요.'
            : '경험과 지식을 나누고 수익을 만들어보세요. 3단계로 등록 신청을 완료할 수 있습니다.'}
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
            2. 전문정보
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 3 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            3. 서비스 이용약관
          </li>
          <li
            className={`px-3 py-1 rounded-full border ${step >= 4 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            4. 최종 검토 및 제출
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
            canGoNext={canGoNextStep1}
          />
        )}

        {/* Step 2-1: 기본 프로필 */}
        {step === 2 && (
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
            mbti={mbti}
            onMbtiChange={setMbti}
            consultationStyle={consultationStyle}
            onConsultationStyleChange={setConsultationStyle}
            languages={languages}
            onLanguagesChange={setLanguages}
            workExperience={workExperience}
            onWorkExperienceChange={updateWorkExperience}
            onAddWorkExperience={addWorkExperience}
            onRemoveWorkExperience={removeWorkExperience}
            education={education}
            onEducationChange={updateEducation}
            onAddEducation={addEducation}
            onRemoveEducation={removeEducation}
            onPrevious={() => setStep(1)}
            onNext={() => setStep(2.5)}
          />
        )}

        {/* Step 2-2: 일정 및 상담 설정 */}
        {step === 2.5 && (
          <Step32ScheduleSettings
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
            onPrevious={() => setStep(2)}
            onNext={() => {
              if (canGoNextStep3) {
                setShowValidation(false)
                setStep(3)
              } else {
                setShowValidation(true)
              }
            }}
            canGoNext={canGoNextStep3}
            showValidation={showValidation}
            validationMessage={validationMessage}
          />
        )}

        {/* Step 3: 약관 동의 */}
        {step === 3 && (
          <Step4Terms
            agreeService={agreeService}
            onAgreeServiceChange={setAgreeService}
            agreePrivacy={agreePrivacy}
            onAgreePrivacyChange={setAgreePrivacy}
            onPrevious={() => setStep(2.5)}
            onNext={() => agree && setStep(4)}
            canGoNext={agree}
          />
        )}

        {/* Step 4: 최종 검토 */}
        {step === 4 && (
          <Step5Review onPrevious={() => setStep(3)} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  )
}
