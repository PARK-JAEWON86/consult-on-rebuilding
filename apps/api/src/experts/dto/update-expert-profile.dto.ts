import { IsString, IsNumber, IsArray, IsObject, IsOptional, IsBoolean, MinLength, Min, Max, ArrayMinSize } from 'class-validator';

export class UpdateExpertProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '전문 분야는 최소 2자 이상이어야 합니다' })
  specialty?: string;

  @IsOptional()
  @IsString()
  @MinLength(30, { message: '자기소개는 최소 30자 이상이어야 합니다' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MinLength(30, { message: '설명은 최소 30자 이상이어야 합니다' })
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: '경력은 0 이상이어야 합니다' })
  @Max(50, { message: '경력은 50년 이하여야 합니다' })
  experience?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: '경력은 0 이상이어야 합니다' })
  @Max(50, { message: '경력은 50년 이하여야 합니다' })
  experienceYears?: number;

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: '상담 스타일은 최소 10자 이상 작성해주세요' })
  consultationStyle?: string;

  // JSON 배열 필드
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 학력 정보가 필요합니다' })
  education?: any[];

  @IsOptional()
  @IsArray()
  certifications?: any[];

  // keywords 필드 (권장)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 키워드가 필요합니다' })
  keywords?: any[];

  // specialties 필드 (하위 호환성, DB에 저장됨)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 전문 분야가 필요합니다' })
  specialties?: any[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 상담 유형을 선택해야 합니다' })
  consultationTypes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 언어를 선택해야 합니다' })
  languages?: string[];

  @IsOptional()
  @IsArray()
  portfolioFiles?: any[];

  @IsOptional()
  @IsArray()
  portfolioItems?: any[];

  @IsOptional()
  @IsArray()
  workExperience?: any[];

  // JSON 객체 필드
  @IsOptional()
  @IsObject()
  availability?: any;

  @IsOptional()
  @IsObject()
  contactInfo?: any;

  @IsOptional()
  @IsObject()
  socialLinks?: any;

  // 설정 필드
  @IsOptional()
  @IsString()
  responseTime?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsString()
  holidayPolicy?: string;

  // 프로필 이미지
  @IsOptional()
  @IsString()
  profileImage?: string;

  // 프로필 공개 여부
  @IsOptional()
  @IsBoolean()
  isProfilePublic?: boolean;

  // 프로필 완성도 (자동 계산용)
  @IsOptional()
  @IsBoolean()
  isProfileComplete?: boolean;

  // 추가 필드들
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditsPerMinute?: number;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageSessionDuration?: number;

  // 예약 가능 시간 슬롯
  @IsOptional()
  @IsArray()
  availabilitySlots?: any[];

  // 휴무 설정
  @IsOptional()
  @IsObject()
  holidaySettings?: any;

  // 휴식 시간 설정
  @IsOptional()
  @IsObject()
  restTimeSettings?: any;
}
