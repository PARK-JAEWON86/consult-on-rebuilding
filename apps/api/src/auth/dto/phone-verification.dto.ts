import { z } from 'zod';

export const sendPhoneVerificationDto = z.object({
  phoneNumber: z.string()
    .regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호를 입력해주세요 (예: 01012345678)')
    .trim(),
});

export const verifyPhoneCodeDto = z.object({
  phoneNumber: z.string()
    .regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호를 입력해주세요')
    .trim(),
  code: z.string()
    .length(6, '인증번호는 6자리입니다')
    .regex(/^[0-9]{6}$/, '인증번호는 숫자 6자리입니다'),
});

export type SendPhoneVerificationDto = z.infer<typeof sendPhoneVerificationDto>;
export type VerifyPhoneCodeDto = z.infer<typeof verifyPhoneCodeDto>;