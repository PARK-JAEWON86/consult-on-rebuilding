import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
