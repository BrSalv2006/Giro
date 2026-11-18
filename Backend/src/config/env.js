import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  REPOSITORY_MODE: z.enum(['memory', 'prisma']).default('memory')
});

export function getEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`);
  }
  if (parsed.data.NODE_ENV === 'production' && parsed.data.REPOSITORY_MODE !== 'prisma') {
    throw new Error('Production requires REPOSITORY_MODE=prisma; in-memory storage is development-only');
  }
  if (parsed.data.REPOSITORY_MODE === 'prisma' && !parsed.data.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when REPOSITORY_MODE=prisma');
  }
  return parsed.data;
}
