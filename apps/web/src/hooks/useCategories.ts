import { useQuery } from '@tanstack/react-query';
import { getCategoriesPublic, Category } from '@/lib/categories';

export function useCategoriesPublic() {
  return useQuery<Category[]>({
    queryKey: ['categories', 'public'],
    queryFn: getCategoriesPublic,
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
