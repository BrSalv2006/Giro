import { MemoryRepository } from './memory.js';
import { PrismaRepository } from './prisma.js';

export async function createRepository(env) {
  if (env.REPOSITORY_MODE === 'memory') {
    if (env.NODE_ENV === 'production') throw new Error('Memory repository cannot be used in production');
    return new MemoryRepository();
  }
  // Prisma is deliberately an explicit adapter boundary; database failures are not hidden.
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$connect();
  return new PrismaRepository(prisma);
}
