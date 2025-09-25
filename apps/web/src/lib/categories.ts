import { api, ApiResponse } from './api';

export interface Category {
  id: number;
  slug: string;
  nameKo: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  order: number;
}

// 퍼블릭 카테고리 목록 조회
export async function getCategoriesPublic(): Promise<Category[]> {
  try {
    const response = await api.get<Category[]>('/categories');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Failed to fetch categories');
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// 카테고리 슬러그로 검색
export function findCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  return categories.find(category => category.slug === slug);
}

// 카테고리 ID로 검색
export function findCategoryById(categories: Category[], id: number): Category | undefined {
  return categories.find(category => category.id === id);
}
