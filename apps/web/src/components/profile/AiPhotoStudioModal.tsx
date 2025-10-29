'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Sparkles, Check, ArrowLeft, Camera } from 'lucide-react'

interface AiPhotoStudioModalProps {
  isOpen: boolean
  onClose: () => void
  currentPhoto?: string
  userName?: string
  onPhotoUpdate: (photoUrl: string) => void
}

type Step = 'upload' | 'preview' | 'transforming' | 'transformed' | 'complete'

export function AiPhotoStudioModal({
  isOpen,
  onClose,
  currentPhoto,
  userName,
  onPhotoUpdate,
}: AiPhotoStudioModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // 약간의 딜레이를 줘서 애니메이션이 끝난 후 초기화
      const timeout = setTimeout(() => {
        setStep('upload')
        setSelectedFile(null)
        setPreviewUrl(null)
        setTransformedUrl(null)
        setError(null)
        setIsDragging(false)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  const validateFile = (file: File): string | null => {
    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return '파일 크기는 5MB 이하여야 합니다'
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드 가능합니다'
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'JPG, PNG, GIF, WEBP 파일만 지원됩니다'
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleTransform = async () => {
    if (!selectedFile) return

    setStep('transforming')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('useAiTransform', 'true')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
      console.log('🎨 Starting AI transformation...')

      const response = await fetch(`${apiUrl}/users/profile-photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await response.json()
      console.log('📦 Transformation response:', data)

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `HTTP ${response.status}`)
      }

      if (!data.success || !data.data?.avatarUrl) {
        throw new Error('AI 변환 결과를 받지 못했습니다')
      }

      setTransformedUrl(data.data.avatarUrl)
      setStep('transformed')
      console.log('✅ AI transformation complete')
    } catch (err) {
      console.error('❌ Transformation error:', err)
      setError(err instanceof Error ? err.message : 'AI 변환 중 오류가 발생했습니다')
      setStep('preview')
    }
  }

  const handleUsePhoto = () => {
    if (transformedUrl) {
      onPhotoUpdate(transformedUrl)
      setStep('complete')
      // 2초 후 모달 닫기
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewUrl(null)
    setTransformedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-50 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[280px] bg-white rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-2.5 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI 포토 스튜디오</h2>
              <p className="text-xs text-gray-600">AI 스튜디오 변환</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'transforming'}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-2.5">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded text-center cursor-pointer
                  transition-all duration-200 aspect-[2/3] flex items-center justify-center
                  ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">
                      {isDragging ? '파일을 놓으세요' : '클릭 또는 드래그'}
                    </p>
                    <p className="text-xs text-gray-600">
                      최대 5MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && previewUrl && (
            <div className="space-y-2">
              <div className="relative w-full aspect-[2/3] rounded overflow-hidden shadow-lg border-2 border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded border border-blue-100">
                <div className="flex items-start gap-1.5">
                  <div className="p-0.5 bg-blue-500 rounded flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">AI 변환</h3>
                    <ul className="space-y-0.5 text-xs text-gray-700">
                      <li className="flex items-start gap-1">
                        <Check className="w-2.5 h-2.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>배경 최적화</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Check className="w-2.5 h-2.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>색감 보정</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Check className="w-2.5 h-2.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>구도 조정</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-1.5 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 inline mr-0.5" />
                  다른 사진
                </button>
                <button
                  onClick={handleTransform}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-semibold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  AI 변환
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Transforming (로딩) */}
          {step === 'transforming' && (
            <div className="space-y-2">
              {/* 원본 사진 with AI 처리 오버레이 */}
              {previewUrl && (
                <div className="relative w-full aspect-[2/3] rounded overflow-hidden shadow-xl border-2 border-blue-400">
                  <img
                    src={previewUrl}
                    alt="Processing"
                    className="w-full h-full object-cover"
                  />

                  {/* AI 처리 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 backdrop-blur-[1px] animate-pulse" />

                  {/* 중앙 로딩 스피너 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* 상단 상태 배지 */}
                  <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      AI 변환 중
                    </p>
                  </div>
                </div>
              )}

              {/* 처리 단계 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 p-1 bg-blue-50 rounded animate-pulse">
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                  <span className="text-xs text-gray-700">이미지 분석</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-indigo-50 rounded animate-pulse" style={{ animationDelay: '200ms' }}>
                  <div className="w-1 h-1 bg-indigo-600 rounded-full" />
                  <span className="text-xs text-gray-700">배경 최적화</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-purple-50 rounded animate-pulse" style={{ animationDelay: '400ms' }}>
                  <div className="w-1 h-1 bg-purple-600 rounded-full" />
                  <span className="text-xs text-gray-700">프로필 변환</span>
                </div>
              </div>

              {/* 진행바 */}
              <div className="space-y-0.5">
                <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-[progress_3s_ease-in-out_infinite]"
                       style={{ width: '100%' }} />
                </div>
                <p className="text-center text-xs text-gray-500">
                  약 5-10초 소요
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Transformed (Before/After) */}
          {step === 'transformed' && previewUrl && transformedUrl && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                {/* Before */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-gray-700 text-center">원본</h3>
                  <div className="relative w-full aspect-[2/3] rounded overflow-hidden shadow-md border border-gray-200">
                    <img
                      src={previewUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-blue-600 text-center flex items-center justify-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI 변환 결과
                  </h3>
                  <div className="relative w-full aspect-[2/3] rounded overflow-hidden shadow-lg border-2 border-blue-500">
                    <img
                      src={transformedUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                      ✨ NEW
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
                >
                  다시 변환
                </button>
                <button
                  onClick={handleUsePhoto}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded font-semibold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-0.5"
                >
                  <Check className="w-2.5 h-2.5" />
                  사진 사용하기
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                    사진이 업데이트되었습니다!
                  </h3>
                  <p className="text-xs text-gray-600">
                    전문적인 프로필 사진 완성
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
