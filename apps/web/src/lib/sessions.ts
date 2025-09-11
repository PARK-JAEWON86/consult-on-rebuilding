import { api } from '@/lib/api';

export async function ensureSession(reservationId: number) {
  const r = await api.post('/sessions', { reservationId });
  return r.data as { displayId: string; channel: string; status: 'SCHEDULED'|'LIVE'|'ENDED' };
}

export async function startSession(displayId: string) {
  const r = await api.post(`/sessions/${displayId}/start`, {});
  return r.data as { displayId: string; status: 'LIVE'; startedAt: string };
}

export async function endSession(displayId: string) {
  const r = await api.post(`/sessions/${displayId}/end`, {});
  return r.data as { displayId: string; status: 'ENDED'; endedAt: string };
}

export async function getSessionDetail(displayId: string) {
  const r = await api.get(`/sessions/${displayId}`);
  return r.data as {
    displayId: string;
    status: 'SCHEDULED'|'LIVE'|'ENDED';
    channel: string;
    reservation: {
      id: number;
      displayId: string;
      userId: number;
      expertId: number;
      startAt: string;
      endAt: string;
    } | null;
  };
}

export async function getMySessionNote(displayId: string, userId: number) {
  const r = await api.get(`/sessions/${displayId}/notes?userId=${userId}`);
  return r.data as { content: string };
}

export async function saveMySessionNote(displayId: string, userId: number, content: string) {
  const r = await api.post(`/sessions/${displayId}/notes`, { userId, content });
  return r.data as { ok: boolean };
}

export async function issueTokens(displayId: string, params: { uid: string; role?: 'host'|'audience' }) {
  const r = await api.post(`/sessions/${displayId}/tokens`, params);
  return r.data as {
    appId: string; channel: string; uid: string; role: 'host'|'audience';
    rtcToken: string; rtmToken: string;
  };
}
