import { z } from 'zod';

export const CreateReservationSchema = z.object({
  userId: z.number().int().positive(),
  expertId: z.number().int().positive(),
  startAt: z.string().datetime(), // ISO
  endAt: z.string().datetime(),   // ISO
  note: z.string().max(500).optional(),
});

export type CreateReservationDto = z.infer<typeof CreateReservationSchema>;
