import { api } from './api';

export interface Expert {
  id: number;
  displayId: string;
  name: string;
  title?: string | null;
  categories: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
}

export interface ExpertListResponse {
  items: Expert[];
  page: number;
  size: number;
  total: number;
}

export async function fetchExperts(params?: {
  page?: number; 
  size?: number; 
  q?: string; 
  category?: string; 
  sort?: string;
}): Promise<ExpertListResponse> {
  const { page = 1, size = 12, q, category, sort } = params || {};
  const response = await api.get('/experts', { 
    params: { page, size, q, category, sort } 
  });
  return response.data;
}

export async function fetchExpertById(displayId: string): Promise<Expert> {
  const response = await api.get(`/experts/${displayId}`);
  return response.data;
}