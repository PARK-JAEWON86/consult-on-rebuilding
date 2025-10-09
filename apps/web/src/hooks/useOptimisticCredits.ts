import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseCredits } from '@/lib/credits';
import type { CreditBalance } from '@/lib/credits';

interface PurchaseCreditsParams {
  packageId: number;
  amount: number;
}

export function useOptimisticCredits() {
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: ({ packageId }: PurchaseCreditsParams) => purchaseCredits(packageId),

    // 낙관적 업데이트
    onMutate: async ({ amount }: PurchaseCreditsParams) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['creditBalance'] });

      // 이전 데이터 백업
      const previousBalance = queryClient.getQueryData<{ success: boolean; data: CreditBalance }>(['creditBalance']);

      // 낙관적으로 캐시 업데이트
      if (previousBalance) {
        queryClient.setQueryData(['creditBalance'], {
          ...previousBalance,
          data: {
            ...previousBalance.data,
            balance: previousBalance.data.balance + amount,
            totalPurchased: previousBalance.data.totalPurchased + amount,
          },
        });
      }

      // 롤백용 이전 데이터 반환
      return { previousBalance };
    },

    // 에러 발생 시 롤백
    onError: (err, variables, context) => {
      if (context?.previousBalance) {
        queryClient.setQueryData(['creditBalance'], context.previousBalance);
      }
    },

    // 성공 시 실제 데이터 다시 가져오기
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
    },
  });

  return {
    purchaseCredits: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
  };
}
