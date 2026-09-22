import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

// Las consultas solo se registran si PRISMA_LOG_QUERIES=true (spec fase 1, RF-1.22)
const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.PRISMA_LOG_QUERIES ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
