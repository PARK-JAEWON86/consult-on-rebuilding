import { api } from '@/lib/api';

export async function createReview(payload: {
  userId: number;
  expertId: number;
  reservationId: number;
  rating: number;
  content: string;
  isPublic?: boolean;
}) {
  const r = await api.post('/reviews', payload);
  return r.data as { displayId: string };
}

export async function getReviews(options: {
  isPublic?: boolean;
  limit?: number;
  expertId?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.isPublic !== undefined) params.append('isPublic', String(options.isPublic));
  if (options.limit) params.append('limit', String(options.limit));
  if (options.expertId) params.append('expertId', String(options.expertId));
  
  const r = await api.get(`/reviews?${params.toString()}`);
  return r.data as {
    reviews: Array<{
      id: number;
      displayId: string;
      userId: number;
      expertId: number;
      reservationId: number;
      rating: number;
      content: string;
      isPublic: boolean;
      createdAt: string;
    }>;
  };
}
