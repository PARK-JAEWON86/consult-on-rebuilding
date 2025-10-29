import { IsNotEmpty } from 'class-validator';

export class TransformPhotoDto {
  @IsNotEmpty({ message: '이미지 파일은 필수입니다' })
  file: any;
}
