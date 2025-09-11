import { ensureSession } from '@/lib/sessions';

export async function navigateToSession(router: any, reservationId: number) {
  const s = await ensureSession(reservationId);
  router.push(`/sessions/${s.displayId}`);
}
