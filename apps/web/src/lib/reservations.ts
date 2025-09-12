import { api } from './api';

export interface Reservation {
  id: number;
  displayId: string;
  userId: number;
  expertId: number;
  expertName: string;
  expertProfile?: string;
  startAt: string;
  endAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  specialty: string;
  type: 'VIDEO' | 'CHAT' | 'VOICE';
  price: number;
  createdAt: string;
}

export interface CreateReservationRequest {
  expertId: number;
  startAt: string;
  endAt: string;
  type: 'VIDEO' | 'CHAT' | 'VOICE';
  message?: string;
}

export async function getMyReservations(params?: {
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const r = await api.get(`/reservations?${searchParams.toString()}`);
  return r.data as { success: boolean; data: Reservation[] };
}

export async function getReservationById(reservationId: number) {
  const r = await api.get(`/reservations/${reservationId}`);
  return r.data as { success: boolean; data: Reservation };
}

export async function createReservation(data: CreateReservationRequest) {
  const r = await api.post('/reservations', data);
  return r.data as { success: boolean; data: Reservation };
}

export async function cancelReservation(reservationId: number) {
  const r = await api.delete(`/reservations/${reservationId}`);
  return r.data as { success: boolean };
}

export async function getUpcomingReservations() {
  const r = await api.get('/reservations?status=SCHEDULED&limit=5');
  return r.data as { success: boolean; data: Reservation[] };
}
