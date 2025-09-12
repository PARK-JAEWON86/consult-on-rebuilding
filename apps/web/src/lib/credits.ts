import { api } from './api';

export interface CreditBalance {
  balance: number;
  totalUsed: number;
  totalPurchased: number;
  expiresAt?: string;
}

export interface CreditTransaction {
  id: number;
  displayId: string;
  type: 'PURCHASE' | 'USAGE' | 'REFUND';
  amount: number;
  description: string;
  createdAt: string;
  reservationId?: number;
  expertName?: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
  bonusCredits?: number;
  discount?: number;
  isPopular?: boolean;
}

export async function getCreditBalance() {
  const r = await api.get('/credits/balance');
  return r.data as { success: boolean; data: CreditBalance };
}

export async function getCreditTransactions(params?: {
  type?: 'PURCHASE' | 'USAGE' | 'REFUND';
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const r = await api.get(`/credits/transactions?${searchParams.toString()}`);
  return r.data as { success: boolean; data: CreditTransaction[] };
}

export async function getCreditPackages() {
  const r = await api.get('/credits/packages');
  return r.data as { success: boolean; data: CreditPackage[] };
}

export async function purchaseCredits(packageId: number) {
  const r = await api.post('/credits/purchase', { packageId });
  return r.data as { success: boolean; data: { paymentIntentId: string } };
}
