import { api, ApiResponse } from '@/lib/api';

export type Reservation = {
  id: number;      // 추가: ensureSession에서 필요
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string; // ISO
  endAt: string;   // ISO
  status: 'PENDING'|'CONFIRMED'|'CANCELED';
  cost: number;    // 추가: 비용 정보
  note?: string|null;
};

export async function createReservation(input: {
  userId: number; expertId: number; startAt: string; endAt: string; note?: string;
}) {
  const r = await api.post('/reservations', input);
  return r.data as Reservation;
}

export async function cancelReservation(displayId: string) {
  const r = await api.delete(`/reservations/${displayId}`);
  return r.data as { displayId: string; status: 'CANCELED' };
}

export async function listReservationsByUser(userId: number): Promise<ApiResponse<Reservation[]>> {
  const r = await api.get('/reservations', { params: { userId } });
  return r;
}
