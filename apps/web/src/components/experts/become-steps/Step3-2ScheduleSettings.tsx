'use client'

import React, { useState, useEffect } from 'react'
import { Users, Phone, MessageCircle, Video, Award, Image as ImageIcon, Upload, X, Globe, Instagram, Youtube, Linkedin, FileText } from 'lucide-react'
import AvailabilityScheduleEditor, { AvailabilitySlot, HolidaySettings } from '../AvailabilityScheduleEditor'

type ConsultationType = 'video' | 'chat' | 'voice'

interface Certification {
  name: string
  issuer: string
  year: string
}

interface SocialLinks {
  website: string
  instagram: string
  youtube: string
  linkedin: string
  blog: string
}

interface Step32ScheduleSettingsProps {
  // 상담 유형
  consultationTypes: ConsultationType[]
  onToggleConsultationType: (type: ConsultationType) => void

  // 예약 가능 시간 (새로운 슬롯 기반 시스템)
  availabilitySlots: AvailabilitySlot[]
  holidaySettings: HolidaySettings
  onAvailabilityChange: (slots: AvailabilitySlot[], holidaySettings: HolidaySettings) => void

  // 자격증
  certifications: Certification[]
  onCertificationChange: (index: number, field: keyof Certification, value: string) => void
  onAddCertification: () => void
  onRemoveCertification: (index: number) => void

  // 포트폴리오
  portfolioPreviews: string[]
  onPortfolioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePortfolio: (index: number) => void

  // 소셜 링크
  socialLinks: SocialLinks
  onSocialLinkChange: (platform: keyof SocialLinks, value: string) => void

  // 네비게이션
  onPrevious: () => void
  onNext: () => void
  canGoNext: boolean
  showValidation: boolean
  validationMessage: string
}

export default function Step32ScheduleSettings({
  consultationTypes,
  onToggleConsultationType,
  availabilitySlots,
  holidaySettings,
  onAvailabilityChange,
  certifications,
  onCertificationChange,
  onAddCertification,
  onRemoveCertification,
  portfolioPreviews,
  onPortfolioUpload,
  onRemovePortfolio,
  socialLinks,
  onSocialLinkChange,
  onPrevious,
  onNext,
  canGoNext,
  showValidation,
  validationMessage,
}: Step32ScheduleSettingsProps) {
  const [isDragging, setIsDragging] = useState(false)

  // 페이지 로드 시 상단으로 스크롤 (자격증 섹션이 보이도록)
  useEffect(() => {
    // 즉시 상단으로 이동 (instant)
    window.scrollTo(0, 0)

    // DOM 렌더링 후 부드럽게 스크롤 (확실하게 상단 고정)
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Create a synthetic event to pass to the upload handler
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>
      onPortfolioUpload(syntheticEvent)
    }
  }

  return (
    <div className="space-y-6">
      {/* 자격증 섹션 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Award className="w-4 h-4 mr-2" /> 자격증
          <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
        </h3>
        <div className="space-y-3">
          {certifications.map((cert, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => onCertificationChange(index, 'name', e.target.value)}
                  placeholder="자격증명"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => onCertificationChange(index, 'issuer', e.target.value)}
                  placeholder="발급기관"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={cert.year || ''}
                  onChange={(e) => onCertificationChange(index, 'year', e.target.value)}
                  placeholder="취득년도"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveCertification(index)}
                className="text-red-600 text-sm hover:text-red-700 flex items-center"
              >
                <X className="w-4 h-4 mr-1" /> 삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddCertification}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center"
          >
            <Award className="w-4 h-4 mr-1" /> 자격증 추가
          </button>
        </div>
      </div>

      {/* 포트폴리오 이미지 섹션 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <ImageIcon className="w-4 h-4 mr-2" /> 자격증 및 포트폴리오 이미지
          <span className="ml-2 text-xs text-gray-500 font-normal">(최대 5개, 선택사항)</span>
        </h3>

        {/* 업로드된 이미지 미리보기 */}
        {portfolioPreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
            {portfolioPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`포트폴리오 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onRemovePortfolio(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 드래그 앤 드롭 영역 */}
        {portfolioPreviews.length < 5 && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input
              id="portfolioUpload"
              type="file"
              accept="image/*"
              multiple
              onChange={onPortfolioUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <Upload className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <label
                htmlFor="portfolioUpload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mb-2"
              >
                <ImageIcon className="w-4 h-4 mr-2" /> 파일 선택
              </label>
              <p className="text-sm text-gray-600 mb-1">
                또는 여기로 이미지를 드래그하세요
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG 파일 (각 최대 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 상담 유형 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Phone className="w-4 h-4 mr-2" /> 제공 가능한 상담 유형
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onToggleConsultationType('voice')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              consultationTypes.includes('voice')
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <Phone className={`w-6 h-6 ${consultationTypes.includes('voice') ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${consultationTypes.includes('voice') ? 'text-blue-900' : 'text-gray-900'}`}>
              음성 통화
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleConsultationType('chat')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              consultationTypes.includes('chat')
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <MessageCircle className={`w-6 h-6 ${consultationTypes.includes('chat') ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${consultationTypes.includes('chat') ? 'text-green-900' : 'text-gray-900'}`}>
              채팅
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleConsultationType('video')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              consultationTypes.includes('video')
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <Video className={`w-6 h-6 ${consultationTypes.includes('video') ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${consultationTypes.includes('video') ? 'text-purple-900' : 'text-gray-900'}`}>
              화상 통화
            </span>
          </button>
        </div>
      </div>

      {/* 예약 가능 시간 설정 - AvailabilityScheduleEditor 사용 */}
      <div className="border-t pt-6">
        <AvailabilityScheduleEditor
          initialSlots={availabilitySlots}
          initialHolidaySettings={holidaySettings}
          onChange={onAvailabilityChange}
        />
      </div>

      {/* 소셜 링크 섹션 */}
      <div className="border-t pt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Globe className="w-4 h-4 mr-2" /> 소셜 링크
          <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
        </h3>
        {/* 디버깅: 현재 소셜링크 값 표시 */}
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>디버깅:</strong> {JSON.stringify(socialLinks)}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="url"
              value={socialLinks.website || ''}
              onChange={(e) => {
                console.log('🔗 Website 입력:', e.target.value);
                onSocialLinkChange('website', e.target.value);
              }}
              placeholder="웹사이트 주소 (예: https://example.com)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-pink-500 flex-shrink-0" />
            <input
              type="text"
              value={socialLinks.instagram || ''}
              onChange={(e) => onSocialLinkChange('instagram', e.target.value)}
              placeholder="Instagram 사용자명 (예: @username)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
            <input
              type="url"
              value={socialLinks.youtube || ''}
              onChange={(e) => onSocialLinkChange('youtube', e.target.value)}
              placeholder="YouTube 채널 URL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <Linkedin className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <input
              type="url"
              value={socialLinks.linkedin || ''}
              onChange={(e) => onSocialLinkChange('linkedin', e.target.value)}
              placeholder="LinkedIn 프로필 URL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="url"
              value={socialLinks.blog || ''}
              onChange={(e) => onSocialLinkChange('blog', e.target.value)}
              placeholder="블로그 URL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 검증 메시지 */}
      {showValidation && !canGoNext && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-semibold text-red-900 whitespace-nowrap">다음 필수 항목을 작성해주세요:</p>
            <span className="text-xs text-red-800">{validationMessage}</span>
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onPrevious}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          disabled={!canGoNext}
          onClick={onNext}
          className={`px-5 py-2 rounded-lg text-white font-medium ${canGoNext ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          다음
        </button>
      </div>
    </div>
  )
}
