import { api } from '@/lib/api';

export async function ensureSession(reservationId: number) {
  const r = await api.post('/sessions', { reservationId });
  return r.data.data as { displayId: string; channel: string; status: 'SCHEDULED'|'LIVE'|'ENDED' };
}

export async function startSession(displayId: string) {
  const r = await api.post(`/sessions/${displayId}/start`, {});
  return r.data.data as { displayId: string; status: 'LIVE'; startedAt: string };
}

export async function endSession(displayId: string) {
  const r = await api.post(`/sessions/${displayId}/end`, {});
  return r.data.data as { displayId: string; status: 'ENDED'; endedAt: string };
}

export async function issueTokens(displayId: string, params: { uid: string; role?: 'host'|'audience' }) {
  const r = await api.post(`/sessions/${displayId}/tokens`, params);
  return r.data.data as {
    appId: string; channel: string; uid: string; role: 'host'|'audience';
    rtcToken: string; rtmToken: string;
  };
}
