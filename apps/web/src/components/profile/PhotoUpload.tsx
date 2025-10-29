'use client'

import { useState, useRef } from 'react'
import { Sparkles, Upload } from 'lucide-react'
import { AiPhotoStudioModal } from './AiPhotoStudioModal'

interface PhotoUploadProps {
  currentPhoto?: string
  userName?: string
  onUploadComplete: (photoUrl: string) => void
}

export function PhotoUpload({ currentPhoto, userName, onUploadComplete }: PhotoUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다')
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/v1/users/profile-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      const data = await response.json()
      onUploadComplete(data.photoUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('업로드 중 오류가 발생했습니다')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* 현재 프로필 사진 */}
        <div className="relative w-48 aspect-[2/3] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center overflow-hidden">
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt="Current profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-blue-600 text-4xl font-bold">
              {userName ? userName.charAt(0) : '?'}
            </span>
          )}
        </div>

        {currentPhoto && (
          <p className="text-center text-sm text-gray-600">현재 프로필 사진</p>
        )}

        {/* 업로드 버튼들 */}
        <div className="flex flex-col gap-2 w-48">
          {/* 사진 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? '업로드 중...' : '사진 업로드'}
          </button>

          {/* AI 스튜디오 버튼 */}
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isUploading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <Sparkles className="w-4 h-4" />
            AI 스튜디오
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-sm text-gray-500 text-center">
          사진을 직접 업로드하거나 AI로 변환하세요
        </p>
      </div>

      {/* AI 포토 스튜디오 모달 */}
      <AiPhotoStudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPhoto={currentPhoto}
        userName={userName}
        onPhotoUpdate={(photoUrl) => {
          onUploadComplete(photoUrl)
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
