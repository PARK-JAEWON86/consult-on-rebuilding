import { z } from 'zod';

// 카테고리 생성 DTO
export const CreateCategoryDto = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/, '슬러그는 2-40자의 영문 소문자, 숫자, 하이픈만 허용됩니다'),
  nameKo: z.string().min(1, '한국어 이름은 필수입니다').max(100, '한국어 이름은 100자 이하여야 합니다'),
  nameEn: z.string().max(100, '영어 이름은 100자 이하여야 합니다').optional(),
  icon: z.string().max(50, '아이콘은 50자 이하여야 합니다').optional(),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional(),
  order: z.number().int().min(0, '순서는 0 이상이어야 합니다').default(0),
  isActive: z.boolean().default(true),
});

// 카테고리 수정 DTO
export const UpdateCategoryDto = CreateCategoryDto.partial().omit({ slug: true });

// 카테고리 활성화 토글 DTO
export const ToggleCategoryDto = z.object({
  isActive: z.boolean(),
});

// 카테고리 일괄 업서트 DTO
export const BulkUpsertCategoryDto = z.object({
  items: z.array(CreateCategoryDto).min(1, '최소 1개의 카테고리가 필요합니다'),
});

// 관리자 목록 조회 쿼리 DTO
export const AdminListCategoryQueryDto = z.object({
  q: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  size: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

export type CreateCategoryDtoType = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryDtoType = z.infer<typeof UpdateCategoryDto>;
export type ToggleCategoryDtoType = z.infer<typeof ToggleCategoryDto>;
export type BulkUpsertCategoryDtoType = z.infer<typeof BulkUpsertCategoryDto>;
export type AdminListCategoryQueryDtoType = z.infer<typeof AdminListCategoryQueryDto>;
