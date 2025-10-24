import { IsNotEmpty, IsString, IsInt, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export enum InquiryCategoryDto {
  SCHEDULE = 'schedule',
  TIME = 'time',
  PRICE = 'price',
  METHOD = 'method',
  OTHER = 'other'
}

export class CreateInquiryDto {
  @IsInt()
  expertId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @IsEnum(InquiryCategoryDto)
  @Transform(({ value }) => value?.toLowerCase())
  category!: InquiryCategoryDto;
}
