import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: ('USER' | 'EXPERT' | 'ADMIN')[];
  createdAt: string;
  updatedAt: string;
}

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get<User>('/auth/me');
      return response.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
