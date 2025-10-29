import { z } from 'zod'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(7200),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(1209600),
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERT: z.string().optional(),
  AGORA_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(3600),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/v1/auth/google/callback'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  // Email configuration - Support both SMTP and AWS SES
  EMAIL_PROVIDER: z.enum(['smtp', 'ses']).default('smtp'),
  // SMTP configuration (Gmail, etc.)
  SMTP_HOST: z.string().min(1).default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  // AWS SES configuration
  AWS_REGION: z.string().min(1).default('ap-northeast-2'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_FROM_NAME: z.string().default('Consult-On'),
  // Common email settings
  MAIL_FROM: z.string().email().default('no-reply@consult-on.kr'),
  // Email verification settings
  AUTH_CODE_EXPIRE_MIN: z.coerce.number().int().positive().default(60),
  AUTH_RESEND_COOLDOWN_SEC: z.coerce.number().int().positive().default(60),
  // AI Photo Studio Configuration
  AI_PHOTO_STUDIO_URL: z.string().url().optional(),
  AI_PHOTO_STUDIO_TIMEOUT: z.coerce.number().int().positive().default(60000),
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
