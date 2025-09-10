import { api } from '@/lib/api';

export type Reservation = {
  displayId: string;
  userId: number;
  expertId: number;
  startAt: string; // ISO
  endAt: string;   // ISO
  status: 'PENDING'|'CONFIRMED'|'CANCELED';
  note?: string|null;
};

export async function createReservation(input: {
  userId: number; expertId: number; startAt: string; endAt: string; note?: string;
}) {
  const r = await api.post('/reservations', input);
  return r.data.data as Reservation;
}

export async function cancelReservation(displayId: string) {
  const r = await api.delete(`/reservations/${displayId}`);
  return r.data.data as { displayId: string; status: 'CANCELED' };
}

export async function listReservationsByUser(userId: number) {
  const r = await api.get('/reservations', { params: { userId } });
  return r.data.data as Reservation[];
}
