// ¡CAMBIO IMPORTANTE AQUÍ!
// No importamos desde '@prisma/client'
// Importamos desde la ruta que definiste en el 'output' del schema.prisma
import { PrismaClient } from '@prisma/client'; 

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;