import { z } from 'zod';
import { config } from 'dotenv';

// Único punto del backend que lee process.env (spec fase 1, RF-1.13).
// En tests se usa .env.test, que apunta a la base de datos de pruebas.
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true });

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
  // Sesión (spec fase 2): token de acceso corto + token de renovación largo
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // Límites de peticiones (spec fase 2, RF-2.12)
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_REFRESH_MAX: z.coerce.number().int().positive().default(30),
  // Número de proxies de confianza (Render/Railway: 1). false = sin proxy
  TRUST_PROXY: z
    .union([z.coerce.number().int().min(0), z.enum(['false', 'true'])])
    .default('false')
    .transform((value) => (value === 'false' ? false : value === 'true' ? 1 : value)),
  // Coste de bcrypt: se baja solo en tests para que no tarden
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
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
