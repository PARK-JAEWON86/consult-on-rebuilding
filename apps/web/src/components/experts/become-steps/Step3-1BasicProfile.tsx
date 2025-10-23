'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ImageIcon, Sparkles, Clock, Tag, FileText, Upload, Briefcase, GraduationCap, Plus, Trash2, Users, MessageCircle, Globe } from 'lucide-react'

interface Category {
  id: number
  nameKo: string
}

interface WorkExperience {
  company: string
  position: string
  period: string
}

interface Education {
  school: string
  major: string
  degree: string
}

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
]

interface Step31BasicProfileProps {
  // 프로필 이미지
  profileImage: string | null
  onProfileImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void

  // 카테고리 & 경력
  selectedCategoryId: number | null
  onCategoryChange: (categoryId: number | null) => void
  categories: Category[]
  isLoadingCategories: boolean
  experienceYears: number

  // 키워드
  keywordsInput: string
  keywords: string[]
  onKeywordsChange: (value: string) => void
  suggestedKeywords: string[]
  getRecommendedKeywords: (categoryName: string) => string[]

  // 자기소개
  bio: string
  onBioChange: (value: string) => void

  // MBTI & 상담 스타일
  mbti: string
  onMbtiChange: (value: string) => void
  consultationStyle: string
  onConsultationStyleChange: (value: string) => void

  // 구사 언어
  languages: string[]
  onLanguagesChange: (languages: string[]) => void

  // 경력사항
  workExperience: WorkExperience[]
  onWorkExperienceChange: (index: number, field: keyof WorkExperience, value: string) => void
  onAddWorkExperience: () => void
  onRemoveWorkExperience: (index: number) => void

  // 학력
  education: Education[]
  onEducationChange: (index: number, field: keyof Education, value: string) => void
  onAddEducation: () => void
  onRemoveEducation: (index: number) => void

  // 네비게이션
  onPrevious: () => void
  onNext: () => void
}

export default function Step31BasicProfile({
  profileImage,
  onProfileImageUpload,
  selectedCategoryId,
  onCategoryChange,
  categories,
  isLoadingCategories,
  experienceYears,
  keywordsInput,
  keywords,
  onKeywordsChange,
  suggestedKeywords,
  getRecommendedKeywords,
  bio,
  onBioChange,
  mbti,
  onMbtiChange,
  consultationStyle,
  onConsultationStyleChange,
  languages,
  onLanguagesChange,
  workExperience,
  onWorkExperienceChange,
  onAddWorkExperience,
  onRemoveWorkExperience,
  education,
  onEducationChange,
  onAddEducation,
  onRemoveEducation,
  onPrevious,
  onNext,
}: Step31BasicProfileProps) {
  const [showValidation, setShowValidation] = useState(false)

  // 페이지 로드 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 필수 항목 검증 - 유효성 검사 로직 (재사용 가능한 함수)
  const validateStep = useCallback((): string[] => {
    const missing: string[] = []

    if (!profileImage) missing.push('프로필 사진')
    if (!selectedCategoryId) missing.push('상담분야')
    if (keywords.length === 0) missing.push('키워드')
    if (bio.trim().length < 30) missing.push('자기소개(30자 이상)')

    // 경력사항 필수 검증: 최소 1개 이상의 유효한 경력 필요
    const hasValidWorkExperience = workExperience.some(exp =>
      exp.company.trim() && exp.position.trim() && exp.period.trim()
    )
    if (!hasValidWorkExperience) missing.push('경력사항(최소 1개)')

    return missing
  }, [profileImage, selectedCategoryId, keywords, bio, workExperience])

  // Memoize validation results for display to prevent unnecessary recalculations
  const missingFields = useMemo(() => {
    if (!showValidation) return []
    return validateStep()
  }, [showValidation, validateStep])

  const handleNext = () => {
    const missing = validateStep()

    if (missing.length > 0) {
      setShowValidation(true)
    } else {
      setShowValidation(false)
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      {/* 프로필 사진 & 상담분야, 경력 */}
      <div className="flex gap-6">
        {/* 프로필 사진 */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" /> 프로필 사진
            <span className="text-red-500 ml-1">*</span>
          </h3>
          <div className="w-56">
            <div className="w-full h-72 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden mb-3">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">사진을<br/>업로드해주세요</p>
                </div>
              )}
            </div>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={onProfileImageUpload}
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
              권장 사이즈: 400x600px
            </p>
          </div>
        </div>

        {/* 상담분야, 경력, 구사 언어 */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" /> 상담분야
                <span className="text-red-500 ml-1">*</span>
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                  카테고리 로딩 중...
                </div>
              ) : (
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
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
              <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" /> 경력
                <span className="ml-2 text-xs text-gray-500 font-normal">(경력 사항 입력 시 자동 계산)</span>
              </label>
              <input
                type="text"
                value={experienceYears === 0 ? '0년' : `${Math.floor(experienceYears)}년 ${Math.round((experienceYears % 1) * 12)}개월`}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                title="경력 사항에서 자동으로 계산됩니다"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                <Globe className="w-4 h-4 mr-2" /> 구사 언어
                <span className="ml-2 text-xs text-gray-500 font-normal">(콤마로 구분)</span>
              </label>
              <input
                type="text"
                value={languages.join(', ')}
                onChange={(e) => {
                  const languagesArray = e.target.value
                    .split(',')
                    .map(lang => lang.trim());
                  onLanguagesChange(languagesArray);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 한국어, 영어"
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
              onChange={(e) => onKeywordsChange(e.target.value)}
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
                          onKeywordsChange(newInput)
                        }
                      }}
                      disabled={keywords.includes(keyword)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        keywords.includes(keyword)
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer'
                      }`}
                      title={keywords.includes(keyword) ? '이미 추가됨' : '클릭하여 추가'}
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
              onChange={(e) => onBioChange(e.target.value)}
              rows={5}
              placeholder="예시) 안녕하세요. 10년 경력의 심리상담 전문가입니다. 공감적이고 따뜻한 분위기에서 내담자의 이야기를 경청하며, 실질적인 문제 해결을 돕고 있습니다. 특히 직장 내 스트레스와 대인관계 고민을 전문적으로 다루고 있으며, 실생활에 바로 적용 가능한 구체적인 조언을 제공합니다."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {bio.length}/30자 이상
            </p>
          </div>
        </div>
      </div>

      {/* MBTI & 상담 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" /> MBTI
            <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
          </label>
          <select
            value={mbti}
            onChange={(e) => onMbtiChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택하세요</option>
            {mbtiTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-8">
          <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" /> 상담 스타일
            <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
          </label>
          <input
            type="text"
            value={consultationStyle}
            onChange={(e) => onConsultationStyleChange(e.target.value)}
            placeholder="예: 따뜻하고 공감적인 태도로 내담자의 감정을 경청하며 상담합니다"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 경력사항 입력 섹션 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Briefcase className="w-4 h-4 mr-2" /> 경력사항
          <span className="text-red-500 ml-1">*</span>
          <span className="ml-2 text-xs text-gray-500 font-normal">(최소 1개)</span>
        </h3>
        <div className="space-y-3">
          {workExperience.map((exp, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr] gap-3 mb-3">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => onWorkExperienceChange(index, 'company', e.target.value)}
                  placeholder="회사명"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => onWorkExperienceChange(index, 'position', e.target.value)}
                  placeholder="직책/직위"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => onWorkExperienceChange(index, 'period', e.target.value)}
                  placeholder="기간 (예: 2020.01 ~ 2023.12 또는 2020.01 ~ 현재)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveWorkExperience(index)}
                className="text-red-600 text-sm hover:text-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" /> 삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddWorkExperience}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" /> 경력 추가
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 경력 기간을 입력하면 위의 경력(년)이 자동으로 계산됩니다
        </p>
      </div>

      {/* 학력 입력 섹션 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <GraduationCap className="w-4 h-4 mr-2" /> 학력
          <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
        </h3>
        <div className="space-y-3">
          {education.map((edu, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => onEducationChange(index, 'school', e.target.value)}
                  placeholder="학교명"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={edu.major}
                  onChange={(e) => onEducationChange(index, 'major', e.target.value)}
                  placeholder="전공"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => onEducationChange(index, 'degree', e.target.value)}
                  placeholder="학위 (예: 학사, 석사)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveEducation(index)}
                className="text-red-600 text-sm hover:text-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" /> 삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddEducation}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" /> 학력 추가
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onPrevious}
          className="px-5 py-2 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
        >
          이전
        </button>

        <div className="flex items-center gap-3">
          {showValidation && missingFields.length > 0 && (
            <p className="text-sm text-red-600 font-medium">
              필수 항목을 입력해주세요: {missingFields.filter(f => typeof f === 'string').join(', ')}
            </p>
          )}
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
