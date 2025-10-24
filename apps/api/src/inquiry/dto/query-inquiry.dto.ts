import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum InquiryStatusDto {
  ALL = 'all',
  UNREAD = 'unread',
  REPLIED = 'replied'
}

export class QueryInquiryDto {
  @IsOptional()
  @IsEnum(InquiryStatusDto)
  status?: InquiryStatusDto = InquiryStatusDto.ALL;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
