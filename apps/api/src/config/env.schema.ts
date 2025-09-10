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
  AGORA_APP_ID: z.string().min(1),
  AGORA_APP_CERT: z.string().min(1),
  AGORA_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(3600),
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
