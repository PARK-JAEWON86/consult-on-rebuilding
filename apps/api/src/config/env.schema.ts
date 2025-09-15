import { z } from 'zod'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(1209600),
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERT: z.string().optional(),
  AGORA_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(3600),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/v1/auth/google/callback'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  // Email configuration
  SMTP_HOST: z.string().min(1).default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().email().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().email().default('no-reply@localhost'),
  // Email verification settings
  AUTH_CODE_EXPIRE_MIN: z.coerce.number().int().positive().default(60),
  AUTH_RESEND_COOLDOWN_SEC: z.coerce.number().int().positive().default(60),
})

export type EnvVars = z.infer<typeof EnvSchema>

export function validateEnv(raw: NodeJS.ProcessEnv): EnvVars {
  const parsed = EnvSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    throw new Error(`Invalid environment variables: ${msg}`)
  }
  return parsed.data
}
