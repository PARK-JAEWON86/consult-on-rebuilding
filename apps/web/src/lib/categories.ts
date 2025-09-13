import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Category {
  id: number;
  slug: string;
  nameKo: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  order: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

// 퍼블릭 카테고리 목록 조회
export async function getCategoriesPublic(): Promise<Category[]> {
  try {
    const response = await axios.get<CategoriesResponse>(`${API_BASE_URL}/v1/categories`);
    
    if (response.data.success) {
      return response.data.data;
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
