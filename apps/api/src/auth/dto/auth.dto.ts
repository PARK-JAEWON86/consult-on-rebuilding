import { z } from 'zod';

export const registerDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50),
});
export type RegisterDto = z.infer<typeof registerDto>;

export const loginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type LoginDto = z.infer<typeof loginDto>;

export const verifyEmailDto = z.object({
  token: z.string().min(10).max(255),
});
export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;

export const resendDto = z.object({
  email: z.string().email(),
});
export type ResendDto = z.infer<typeof resendDto>;
