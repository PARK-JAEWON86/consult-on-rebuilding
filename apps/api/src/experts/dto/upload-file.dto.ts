import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;

  @IsString()
  @IsNotEmpty()
  fileData!: string; // Base64 encoded file data

  @IsOptional()
  @IsString()
  fileCategory?: 'profile' | 'portfolio' | 'certification'; // 파일 카테고리
}
