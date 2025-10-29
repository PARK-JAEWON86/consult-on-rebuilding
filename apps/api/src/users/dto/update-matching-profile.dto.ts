import { IsArray, IsString, IsInt, IsOptional, Min, Max, ArrayMaxSize } from 'class-validator';

export class UpdateMatchingProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '관심 분야는 최대 3개까지 선택할 수 있습니다' })
  @IsString({ each: true })
  interestedCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredConsultationType?: string[];

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @IsInt()
  @Min(10000, { message: '최소 예산은 10,000원 이상이어야 합니다' })
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Max(500000, { message: '최대 예산은 500,000원 이하여야 합니다' })
  budgetMax?: number;

  @IsOptional()
  @IsString()
  consultationGoals?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[];
}
