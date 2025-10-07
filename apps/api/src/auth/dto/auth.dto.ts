import { z } from 'zod';

export const registerDto = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다'
    ),
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이하여야 합니다'),
});
export type RegisterDto = z.infer<typeof registerDto>;

export const loginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type LoginDto = z.infer<typeof loginDto>;

export const verifyEmailDto = z.object({
  token: z.string().min(6).max(255),
});
export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;

export const resendDto = z.object({
  email: z.string().email(),
});
export type ResendDto = z.infer<typeof resendDto>;
