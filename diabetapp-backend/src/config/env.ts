import { z } from 'zod';
import { config } from 'dotenv';

// Único punto del backend que lee process.env (spec fase 1, RF-1.13)
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z
    .string('JWT_SECRET es obligatoria')
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  DATABASE_URL: z
    .string('DATABASE_URL debe ser una URL válida')
    .min(1, 'DATABASE_URL es obligatoria'),
  CORS_ORIGIN: z.string().default('*'),
  // Las consultas SQL solo se registran si se pide explícitamente (RF-1.22)
  PRISMA_LOG_QUERIES: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export function loadEnvConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Error en la configuración de variables de entorno:');
    // issues es la API pública de Zod: cada issue trae la ruta del campo y su motivo
    for (const issue of result.error.issues) {
      const variable = issue.path.join('.') || '(desconocida)';
      console.error(`   ${variable}: ${issue.message}`);
    }

    console.error('💡 Revisa tu archivo .env (puedes partir de env.example):');
    console.error('   JWT_SECRET=<32+ caracteres, genéralo con: npm run generate-secret>');
    console.error('   DATABASE_URL=postgresql://user:password@localhost:5433/diabetapp_dev');

    process.exit(1);
  }

  return result.data;
}

/** Configuración validada; el resto del código la usa en lugar de process.env. */
export const env = loadEnvConfig();
