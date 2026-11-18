import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());

const postgresUrl = z
  .url({ message: 'DATABASE_URL must be a valid URL' })
  .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
    message: 'DATABASE_URL must use the postgresql:// protocol',
  });

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: postgresUrl,
    BETTER_AUTH_SECRET: optionalString.pipe(z.string().min(32).optional()),
    BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    PRISMA_LOG_QUERIES: booleanString,

    MEDIA_STORAGE_ENABLED: booleanString,
    SUPABASE_URL: optionalUrl,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_STORAGE_BUCKET: optionalString,

    WORKER_ENABLED: booleanString,
    AI_PLAN_IMAGE_ENABLED: booleanString,
    AI_MEAL_PHOTO_ENABLED: booleanString,
    AI_REFLECTION_ENABLED: booleanString,
    AI_PROVIDER: optionalString,
    AI_PROVIDER_BASE_URL: optionalUrl,
    AI_PROVIDER_API_KEY: optionalString,
    AI_PROVIDER_MODEL: optionalString,
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production' && !value.BETTER_AUTH_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET is required when NODE_ENV=production',
      });
    }

    if (value.MEDIA_STORAGE_ENABLED) {
      for (const name of [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_STORAGE_BUCKET',
      ] as const) {
        if (!value[name]) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} is required when MEDIA_STORAGE_ENABLED=true`,
          });
        }
      }
    }

    const enabledAiFeatures = [
      value.AI_PLAN_IMAGE_ENABLED,
      value.AI_MEAL_PHOTO_ENABLED,
      value.AI_REFLECTION_ENABLED,
    ];
    if (enabledAiFeatures.some(Boolean)) {
      if (!value.WORKER_ENABLED) {
        context.addIssue({
          code: 'custom',
          path: ['WORKER_ENABLED'],
          message: 'WORKER_ENABLED must be true when an AI feature is enabled',
        });
      }
      for (const name of [
        'AI_PROVIDER',
        'AI_PROVIDER_BASE_URL',
        'AI_PROVIDER_API_KEY',
        'AI_PROVIDER_MODEL',
      ] as const) {
        if (!value[name]) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} is required when an AI feature is enabled`,
          });
        }
      }
    }

    if (
      (value.AI_PLAN_IMAGE_ENABLED || value.AI_MEAL_PHOTO_ENABLED) &&
      !value.MEDIA_STORAGE_ENABLED
    ) {
      context.addIssue({
        code: 'custom',
        path: ['MEDIA_STORAGE_ENABLED'],
        message: 'MEDIA_STORAGE_ENABLED must be true when an image AI feature is enabled',
      });
    }
  });

export type Env = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: Record<string, string | undefined>): Env {
  const parsed = serverEnvSchema.safeParse(input);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment variables:\n${lines.join('\n')}\nSee .env.example.`);
  }
  return parsed.data;
}
