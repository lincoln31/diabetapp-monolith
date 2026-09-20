import prisma from '../src/config/db';

/**
 * Cada test empieza con la base vacía (spec fase 4, RF-4.2): así ninguno
 * depende del orden ni de lo que dejaron los anteriores.
 */
beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "refresh_tokens", "glucose_readings", "users" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
