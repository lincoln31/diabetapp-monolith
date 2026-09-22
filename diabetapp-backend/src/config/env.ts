import { z } from 'zod';
import { config } from 'dotenv';

config();
// Esquema para validar variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z
    .string('JWT_SECRET es obligatoria')
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  DATABASE_URL: z
    .string('DATABASE_URL debe ser una URL válida')
    .min(1, 'DATABASE_URL es obligatoria'),
});

// Función para validar y cargar variables de entorno
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

  const envConfig = result.data;

  // Nunca se imprime el secreto, ni siquiera parcialmente
  if (envConfig.NODE_ENV === 'development') {
    console.log('✅ Configuración de entorno cargada correctamente');
    console.log(`   NODE_ENV: ${envConfig.NODE_ENV}`);
    console.log(`   PORT: ${envConfig.PORT}`);
  }

  return envConfig;
}

// Exportar la configuración validada
export const env = loadEnvConfig();
