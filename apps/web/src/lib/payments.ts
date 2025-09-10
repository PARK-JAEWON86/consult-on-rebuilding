import { api } from './api';

export async function createPaymentIntent(amount: number) {
  const r = await api.post('/payments/intents', { amount });
  return r.data.data as { displayId: string; amount: number; currency: string; status: string; createdAt: string };
}

export async function getPaymentIntent(displayId: string) {
  const r = await api.get(`/payments/intents/${displayId}`);
  return r.data.data;
}

export async function confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
  const r = await api.post('/payments/confirm', params);
  return r.data.data as { ok: true };
}
