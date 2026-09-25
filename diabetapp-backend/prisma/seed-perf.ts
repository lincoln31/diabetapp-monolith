/**
 * Script LOCAL de rendimiento (spec fase 1, RNF-1.3): inserta 10 000 lecturas para un usuario
 * y mide el listado paginado. No forma parte del arranque ni de los despliegues.
 *
 * Uso: npx ts-node prisma/seed-perf.ts <email>
 */
import { MomentOfDay } from '@prisma/client';
import prisma from '../src/config/db';
import { GlucoseService } from '../src/modules/glucose/glucose.service';

const TOTAL = 10_000;

async function main() {
  const email = (process.argv[2] ?? '').toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) {
    console.error(`No existe un usuario con el correo "${email}"`);
    process.exit(1);
  }

  const moments = Object.values(MomentOfDay);
  const start = new Date('2020-01-01T08:00:00.000Z').getTime();

  const readings = Array.from({ length: TOTAL }, (_, i) => ({
    value: 70 + (i % 180),
    timestamp: new Date(start + i * 6 * 60 * 60 * 1000), // una lectura cada 6 horas
    momentOfDay: moments[i % moments.length],
    userId: user.id,
  }));

  console.log(`Insertando ${TOTAL} lecturas…`);
  await prisma.glucoseReading.createMany({ data: readings });

  const t0 = performance.now();
  const [page, total] = await prisma.$transaction([
    prisma.glucoseReading.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
    prisma.glucoseReading.count({ where: { userId: user.id } }),
  ]);
  const ms = performance.now() - t0;

  console.log(`Listado de ${page.length} de ${total} lecturas en ${ms.toFixed(1)} ms`);
  console.log(ms < 200 ? '✅ Cumple RNF-1.3 (< 200 ms)' : '❌ Por encima de 200 ms');

  // RNF-5.3: estadísticas del dashboard (spec fase 5) con las mismas 10 000 lecturas
  const t1 = performance.now();
  await new GlucoseService().getStats(user.id);
  const statsMs = performance.now() - t1;

  console.log(`Estadísticas del dashboard en ${statsMs.toFixed(1)} ms`);
  console.log(statsMs < 300 ? '✅ Cumple RNF-5.3 (< 300 ms)' : '❌ Por encima de 300 ms');
}

void main().finally(() => prisma.$disconnect());
