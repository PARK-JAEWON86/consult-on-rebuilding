# AI Photo Studio 통합 계획서

## 📋 목차
1. [개요](#개요)
2. [현황 분석](#현황-분석)
3. [아키텍처 설계](#아키텍처-설계)
4. [백엔드 구현 계획](#백엔드-구현-계획)
5. [프론트엔드 구현 계획](#프론트엔드-구현-계획)
6. [보안 및 성능](#보안-및-성능)
7. [테스트 전략](#테스트-전략)
8. [배포 계획](#배포-계획)
9. [예상 일정](#예상-일정)

---

## 개요

### 목적
사용자 프로필 사진 업로드 시 AI를 활용하여 일반 셀카를 전문적인 프로필 사진으로 자동 변환하는 기능 구현

### 핵심 기능
- 일반 사진 업로드
- AI 기반 프로필 사진 변환 (Gemini 2.5 Flash Image)
- 변환 전/후 비교 및 선택
- 프로필에 자동 적용

### 기술 스택
- **AI 서비스**: Google Cloud Run + Gemini AI
- **백엔드**: NestJS + Multer + Axios
- **프론트엔드**: Next.js 14 + React
- **저장소**: Base64 (개발) / Google Cloud Storage (프로덕션)

---

## 현황 분석

### 현재 구현 상태

#### 프론트엔드 (`apps/web/src/app/dashboard/profile/page.tsx`)
```typescript
// 현재: FileReader로 base64 변환 후 state에 저장
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileData({ ...profileData, avatarUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }
};
```

**문제점:**
- 실제 업로드 API 엔드포인트 없음
- AI 변환 기능 없음
- 미리보기 및 편집 기능 부재
- 에러 처리 미흡

#### 백엔드
**현재 상태:**
- `apps/api/src/users/users.controller.ts`: 프로필 업로드 엔드포인트 없음
- `apps/api/src/files/files.service.ts`: Mock 구현만 존재
- Database: `User.avatarUrl` 필드는 존재하나 활용 안됨

**문제점:**
- 프로필 사진 업로드 API 미구현
- 파일 검증 로직 없음
- AI 서비스 통합 없음

#### AI Photo Studio 서비스
**위치**: `/services/ai-photo-studio/`

**현재 상태:**
- ✅ Cloud Run 배포 준비 완료
- ✅ Gemini AI 통합 완료
- ✅ API 엔드포인트 구현 완료
  - `GET /health`: Health check
  - `POST /transform`: 사진 변환

**아직 필요한 작업:**
- Cloud Run 배포
- 환경 변수 설정 (GEMINI_API_KEY)
- 백엔드 API와 연동

---

## 아키텍처 설계

### 시스템 아키텍처

```
[사용자 브라우저]
      ↓ (1) 파일 선택 및 업로드 요청
[Next.js Frontend]
      ↓ (2) FormData POST /api/v1/users/profile-photo
[NestJS Backend API]
      ↓ (3) 파일 검증
      ├─→ (4a) transformWithAI=false → 바로 저장
      └─→ (4b) transformWithAI=true
            ↓ (5) POST /transform
      [AI Photo Studio (Cloud Run)]
            ↓ (6) Gemini AI 변환
            ↓ (7) 변환된 이미지 반환
      [NestJS Backend API]
      ↓ (8) 이미지 저장 (Base64 or GCS)
      ↓ (9) DB 업데이트 (User.avatarUrl)
      ↓ (10) 응답 반환
[Next.js Frontend]
      ↓ (11) UI 업데이트
[사용자 브라우저]
```

### 데이터 플로우

1. **업로드 시작**
   - 사용자가 파일 선택
   - 클라이언트에서 미리보기 생성
   - "일반 업로드" 또는 "AI 변환" 선택

2. **파일 전송**
   - FormData로 multipart/form-data 전송
   - Backend에서 파일 검증 (타입, 크기)

3. **AI 변환 (선택적)**
   - AI Photo Studio 서비스 호출
   - 변환 진행 상태 표시 (20-30초 소요)
   - 변환 완료 후 base64 이미지 수신

4. **저장 및 응답**
   - 이미지를 저장소에 저장
   - DB에 URL 업데이트
   - 클라이언트에 결과 반환

---

## 백엔드 구현 계획

### 1. AI Photo Studio Client 모듈

**파일 구조:**
```
apps/api/src/ai-photo-studio/
├── ai-photo-studio.module.ts
├── ai-photo-studio.service.ts
└── dto/
    └── transform-photo.dto.ts
```

**구현 코드:**

#### `ai-photo-studio.service.ts`
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class AiPhotoStudioService {
  private readonly serviceUrl: string;
  private readonly timeout: number;

  constructor(private config: ConfigService) {
    this.serviceUrl = this.config.get<string>('AI_PHOTO_STUDIO_URL') || '';
    this.timeout = this.config.get<number>('AI_PHOTO_STUDIO_TIMEOUT') || 60000;

    if (!this.serviceUrl) {
      throw new Error('AI_PHOTO_STUDIO_URL is not configured');
    }
  }

  /**
   * AI를 사용하여 프로필 사진 변환
   */
  async transformPhoto(
    file: Buffer,
    mimeType: string,
    originalFilename: string
  ): Promise<{
    image: string; // base64
    mimeType: string;
    aiResponse?: string;
  }> {
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('photo', file, {
        filename: originalFilename,
        contentType: mimeType,
      });

      // AI Photo Studio 서비스 호출
      const response = await axios.post(
        `${this.serviceUrl}/transform`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxContentLength: 50 * 1024 * 1024, // 50MB
          maxBodyLength: 50 * 1024 * 1024,
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'AI transformation failed');
      }

      return {
        image: response.data.data.image,
        mimeType: response.data.data.mimeType || 'image/png',
        aiResponse: response.data.data.aiResponse,
      };
    } catch (error: any) {
      console.error('AI Photo Studio error:', error.message);

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'AI 변환 시간이 초과되었습니다. 다시 시도해주세요.',
          HttpStatus.REQUEST_TIMEOUT
        );
      }

      if (error.response?.status === 500) {
        throw new HttpException(
          'AI 변환 중 오류가 발생했습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new HttpException(
        error.message || 'AI 변환에 실패했습니다.',
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * AI Photo Studio 서비스 Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200 && response.data?.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}
```

#### `ai-photo-studio.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiPhotoStudioService } from './ai-photo-studio.service';

@Module({
  imports: [ConfigModule],
  providers: [AiPhotoStudioService],
  exports: [AiPhotoStudioService],
})
export class AiPhotoStudioModule {}
```

### 2. Users Module 업데이트

#### `users.controller.ts` 추가 엔드포인트
```typescript
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';

// 파일 검증
const imageFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException('JPG, PNG, WebP 형식만 지원됩니다.'),
      false
    );
  }
};

@Controller('users')
export class UsersController {
  // ... 기존 코드 ...

  /**
   * 프로필 사진 업로드
   * POST /users/profile-photo
   */
  @Post('profile-photo')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: imageFileFilter,
    })
  )
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('transformWithAI') transformWithAI: string,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    const userId = req.user?.id;
    const shouldTransform = transformWithAI === 'true';

    try {
      const result = await this.usersService.uploadProfilePhoto(
        userId,
        file.buffer,
        file.mimetype,
        file.originalname,
        shouldTransform
      );

      return {
        success: true,
        data: result,
        message: '프로필 사진이 성공적으로 업데이트되었습니다.',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'E_UPLOAD_FAILED',
            message: error.message || '프로필 사진 업로드에 실패했습니다.',
          },
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

#### `users.service.ts` 추가 메서드
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiPhotoStudioService } from '../ai-photo-studio/ai-photo-studio.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiPhotoStudio: AiPhotoStudioService,
  ) {}

  /**
   * 프로필 사진 업로드
   */
  async uploadProfilePhoto(
    userId: number,
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    transformWithAI: boolean
  ): Promise<{
    avatarUrl: string;
    transformed: boolean;
    aiResponse?: string;
  }> {
    let imageData: string;
    let transformed = false;
    let aiResponse: string | undefined;

    if (transformWithAI) {
      // AI 변환 수행
      const result = await this.aiPhotoStudio.transformPhoto(
        fileBuffer,
        mimeType,
        originalFilename
      );

      imageData = `data:${result.mimeType};base64,${result.image}`;
      transformed = true;
      aiResponse = result.aiResponse;
    } else {
      // 일반 업로드 (base64 변환)
      imageData = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }

    // DB 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: imageData },
    });

    return {
      avatarUrl: imageData,
      transformed,
      aiResponse,
    };
  }
}
```

### 3. 환경 변수 설정

#### `.env.example` 추가
```bash
# AI Photo Studio Configuration
AI_PHOTO_STUDIO_URL=https://ai-photo-studio-xxx.run.app
AI_PHOTO_STUDIO_TIMEOUT=60000

# Storage Configuration
STORAGE_MODE=base64  # base64 or gcs
GCS_BUCKET_NAME=consulton-profile-photos
```

### 4. 필요한 패키지 설치

```bash
cd apps/api
pnpm add form-data axios
pnpm add -D @types/multer
```

---

## 프론트엔드 구현 계획

### 1. PhotoUpload 컴포넌트

**파일 경로**: `apps/web/src/components/profile/PhotoUpload.tsx`

```typescript
'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, X, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  currentPhoto?: string;
  onUploadComplete: (avatarUrl: string) => void;
  onError?: (error: string) => void;
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'transforming' | 'comparing' | 'success' | 'error';

export default function PhotoUpload({
  currentPhoto,
  onUploadComplete,
  onError,
}: PhotoUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [transformedPreview, setTransformedPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage('파일 크기는 10MB 이하여야 합니다.');
      setState('error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('JPG, PNG, WebP 형식만 지원됩니다.');
      setState('error');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setSelectedFile(file);
      setState('selected');
    };
    reader.readAsDataURL(file);
  };

  // 일반 업로드
  const handleRegularUpload = async () => {
    if (!selectedFile) return;

    setState('uploading');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('transformWithAI', 'false');

      const response = await fetch('/api/v1/users/profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '업로드에 실패했습니다.');
      }

      setProgress(100);
      setState('success');
      onUploadComplete(result.data.avatarUrl);

      // 2초 후 초기화
      setTimeout(() => {
        resetUpload();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || '업로드에 실패했습니다.');
      setState('error');
      onError?.(error.message);
    }
  };

  // AI 변환 업로드
  const handleAIUpload = async () => {
    if (!selectedFile) return;

    setState('transforming');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('transformWithAI', 'true');

      // 진행 상태 시뮬레이션 (실제로는 progress event 사용)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 1000);

      const response = await fetch('/api/v1/users/profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'AI 변환에 실패했습니다.');
      }

      // 변환된 이미지 표시
      setTransformedPreview(result.data.avatarUrl);
      setState('comparing');
    } catch (error: any) {
      setErrorMessage(error.message || 'AI 변환에 실패했습니다.');
      setState('error');
      onError?.(error.message);
    }
  };

  // 변환된 이미지 사용
  const handleUseTransformed = () => {
    if (transformedPreview) {
      setState('success');
      onUploadComplete(transformedPreview);
      setTimeout(() => {
        resetUpload();
      }, 2000);
    }
  };

  // 원본 이미지 사용
  const handleUseOriginal = () => {
    if (preview) {
      setState('success');
      onUploadComplete(preview);
      setTimeout(() => {
        resetUpload();
      }, 2000);
    }
  };

  // 초기화
  const resetUpload = () => {
    setSelectedFile(null);
    setPreview(null);
    setTransformedPreview(null);
    setErrorMessage('');
    setProgress(0);
    setState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 현재 프로필 사진 또는 placeholder */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
            {currentPhoto ? (
              <Image
                src={currentPhoto}
                alt="Profile"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <Camera className="w-12 h-12 text-blue-400" />
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
          {state === 'idle' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 파일 input (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 파일 선택됨 - 업로드 옵션 */}
      {state === 'selected' && preview && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200">
              <Image
                src={preview}
                alt="Preview"
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRegularUpload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              일반 업로드
            </button>
            <button
              onClick={handleAIUpload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              AI 전문 변환
            </button>
          </div>

          <button
            onClick={resetUpload}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            다시 선택하기
          </button>
        </div>
      )}

      {/* 업로드 중 */}
      {(state === 'uploading' || state === 'transforming') && (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              {state === 'transforming' ? (
                <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {state === 'transforming'
                ? 'AI가 사진을 전문적으로 변환하고 있습니다...'
                : '사진을 업로드하고 있습니다...'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {state === 'transforming' && '약 20-30초 소요됩니다'}
            </p>
          </div>

          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600">{progress}%</p>
        </div>
      )}

      {/* 변환 결과 비교 */}
      {state === 'comparing' && preview && transformedPreview && (
        <div className="bg-white rounded-lg border-2 border-purple-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-center text-gray-900">
            변환 결과를 확인하세요
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 원본 */}
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-gray-600">변환 전</p>
              <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={preview}
                  alt="Original"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleUseOriginal}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                원본 사용
              </button>
            </div>

            {/* 변환 후 */}
            <div className="space-y-2">
              <p className="text-center text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                변환 후
              </p>
              <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-400">
                <Image
                  src={transformedPreview}
                  alt="Transformed"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleUseTransformed}
                className="w-full px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                변환된 사진 사용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 */}
      {state === 'success' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-900">
            프로필 사진이 업데이트되었습니다!
          </p>
        </div>
      )}

      {/* 에러 */}
      {state === 'error' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">업로드 실패</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              <button
                onClick={resetUpload}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                다시 시도하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      {state === 'idle' && (
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>JPG, PNG, WebP 형식 지원</p>
          <p>최대 파일 크기: 10MB</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Profile Page 통합

**파일 경로**: `apps/web/src/app/dashboard/profile/page.tsx`

기존 `handleImageUpload` 함수를 제거하고 `PhotoUpload` 컴포넌트로 교체:

```typescript
import PhotoUpload from '@/components/profile/PhotoUpload';

// ... 기존 코드 ...

// handleImageUpload 함수 제거

// JSX 내부에서 사진 업로드 UI를 PhotoUpload 컴포넌트로 교체
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">프로필 사진</h2>

  <PhotoUpload
    currentPhoto={profileData.avatarUrl}
    onUploadComplete={(avatarUrl) => {
      setProfileData({ ...profileData, avatarUrl });
      setMessage({ type: 'success', text: '프로필 사진이 업데이트되었습니다.' });
    }}
    onError={(error) => {
      setMessage({ type: 'error', text: error });
    }}
  />
</div>
```

---

## 보안 및 성능

### 보안 조치

#### 1. 파일 검증
```typescript
// 파일 타입 검증
const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// 파일 크기 제한
const maxSize = 10 * 1024 * 1024; // 10MB

// 이미지 차원 검증 (선택적)
const maxDimension = 4096;
```

#### 2. Rate Limiting
```typescript
// apps/api/src/users/users.controller.ts
import { Throttle } from '@nestjs/throttler';

@Throttle(5, 3600) // 시간당 5회 제한
@Post('profile-photo')
```

#### 3. 인증 및 권한
- JWT 토큰 검증 필수
- 본인 프로필만 수정 가능
- CSRF 보호

#### 4. AI 서비스 보안
- AI Photo Studio URL을 환경 변수로 관리
- 프론트엔드에서 직접 접근 차단
- 타임아웃 설정 (60초)

### 성능 최적화

#### 1. 이미지 최적화
- 클라이언트 side 리사이징 (선택적)
- 압축 품질 조정
- WebP 형식 우선 사용

#### 2. 캐싱 전략
- 프로필 사진 CDN 배포
- 브라우저 캐싱 활성화
- ETag 사용

#### 3. 비동기 처리
- AI 변환을 백그라운드 작업으로 처리 (선택적)
- 웹소켓으로 실시간 진행 상태 전송

#### 4. 모니터링
- AI 변환 시간 추적
- 실패율 모니터링
- 사용량 및 비용 추적

---

## 테스트 전략

### 1. 단위 테스트

#### Backend
```bash
# AI Photo Studio Service
apps/api/src/ai-photo-studio/ai-photo-studio.service.spec.ts

# Users Service
apps/api/src/users/users.service.spec.ts
```

**테스트 케이스:**
- ✓ AI 변환 성공 시나리오
- ✓ AI 서비스 타임아웃 처리
- ✓ AI 서비스 에러 처리
- ✓ 파일 검증 로직
- ✓ DB 업데이트 검증

#### Frontend
```bash
# PhotoUpload Component
apps/web/src/components/profile/__tests__/PhotoUpload.test.tsx
```

**테스트 케이스:**
- ✓ 파일 선택 및 미리보기
- ✓ 업로드 플로우
- ✓ AI 변환 플로우
- ✓ 에러 핸들링
- ✓ 취소 기능

### 2. 통합 테스트

**시나리오:**
1. 일반 업로드 end-to-end
2. AI 변환 업로드 end-to-end
3. 파일 크기 초과 처리
4. 잘못된 파일 형식 처리
5. 네트워크 에러 처리

### 3. 수동 테스트 체크리스트

- [ ] 다양한 이미지 형식 (JPG, PNG, WebP) 테스트
- [ ] 파일 크기 제한 테스트 (>10MB)
- [ ] AI 변환 품질 확인
- [ ] 변환 전/후 비교 UI 확인
- [ ] 모바일 브라우저 테스트
- [ ] 다양한 네트워크 속도 테스트
- [ ] 동시 업로드 테스트
- [ ] 취소 기능 테스트

---

## 배포 계획

### 1. AI Photo Studio 배포

#### Cloud Run 배포
```bash
cd services/ai-photo-studio

# 이미지 빌드
docker build -t gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest .

# Container Registry에 푸시
docker push gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest

# Cloud Run 배포
gcloud run deploy ai-photo-studio \
  --image gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

#### 배포 후 확인
```bash
# Health check
curl https://ai-photo-studio-xxx.run.app/health

# 변환 테스트
curl -X POST -F "photo=@test.jpg" https://ai-photo-studio-xxx.run.app/transform
```

### 2. Backend API 배포

#### 환경 변수 설정
```bash
# .env 파일 업데이트
AI_PHOTO_STUDIO_URL=https://ai-photo-studio-xxx.run.app
AI_PHOTO_STUDIO_TIMEOUT=60000
```

#### 배포 단계
1. 코드 리뷰 및 승인
2. 테스트 환경 배포
3. 통합 테스트 실행
4. 프로덕션 배포
5. 모니터링

### 3. Frontend 배포

#### 빌드 및 배포
```bash
cd apps/web
pnpm build
# Next.js 애플리케이션 배포 (Vercel/자체 서버)
```

### 4. 모니터링 설정

- Cloud Run 로그 모니터링
- API 응답 시간 추적
- 에러율 모니터링
- 사용량 및 비용 추적

---

## 예상 일정

### Phase 1: Backend 개발 (3-4시간)
- [x] AI Photo Studio 서비스 모듈 생성
- [ ] Users 모듈 업데이트
- [ ] 파일 업로드 엔드포인트 구현
- [ ] 환경 변수 설정
- [ ] 단위 테스트 작성

### Phase 2: Frontend 개발 (2-3시간)
- [ ] PhotoUpload 컴포넌트 구현
- [ ] Profile 페이지 통합
- [ ] UI/UX 개선
- [ ] 에러 처리 및 로딩 상태
- [ ] 컴포넌트 테스트

### Phase 3: 통합 및 테스트 (2시간)
- [ ] End-to-end 테스트
- [ ] 다양한 시나리오 테스트
- [ ] 버그 수정
- [ ] 성능 최적화

### Phase 4: 배포 (1시간)
- [ ] AI Photo Studio Cloud Run 배포
- [ ] Backend API 배포
- [ ] Frontend 배포
- [ ] 모니터링 설정

**총 예상 시간: 8-10시간**

---

## 참고 자료

### AI Photo Studio 서비스
- 위치: `/services/ai-photo-studio/`
- README: `/services/ai-photo-studio/README.md`
- 배포 스크립트: `/services/ai-photo-studio/deploy.sh`

### API 문서
- Health Check: `GET /health`
- Transform: `POST /transform`

### 관련 파일
- Backend Users Controller: `apps/api/src/users/users.controller.ts`
- Backend Users Service: `apps/api/src/users/users.service.ts`
- Frontend Profile Page: `apps/web/src/app/dashboard/profile/page.tsx`
- Database Schema: `apps/api/prisma/schema.prisma`

---

## 다음 단계

1. ✅ AI Photo Studio 서비스 구현 완료
2. ✅ 통합 계획 문서 작성 완료
3. ⏳ Backend API 구현 시작
4. ⏳ Frontend 컴포넌트 구현 시작
5. ⏳ 테스트 및 배포

**시작 준비 완료!** 🚀
