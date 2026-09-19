import { z, ZodError } from 'zod';
import { config } from 'dotenv';

config();
// Esquema para validar variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  DATABASE_URL: z.string('DATABASE_URL debe ser una URL válida'),
});

// Función para validar y cargar variables de entorno
export function loadEnvConfig() {
  try {
    const envConfig = envSchema.parse(process.env);
    
    // Log de configuración (sin mostrar secretos en producción)
    if (envConfig.NODE_ENV === 'development') {
      console.log('✅ Configuración de entorno cargada correctamente');
      console.log(`   NODE_ENV: ${envConfig.NODE_ENV}`);
      console.log(`   PORT: ${envConfig.PORT}`);
      console.log(`   JWT_SECRET: ${envConfig.JWT_SECRET.substring(0, 8)}...`);
    }
    
    return envConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error en la configuración de variables de entorno:');
      (error as ZodError)._zod.def.forEach((err: any) => {
        console.error(`   ${err.key}: ${err.message}`);
      });
    } else {
        console.error(`   ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    console.error('💡 Asegúrate de crear un archivo .env con las siguientes variables:');
    console.error('   JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro');
    console.error('   DATABASE_URL=tu_url_de_base_de_datos');
    
    process.exit(1);
  }
}

// Exportar la configuración validada
export const env = loadEnvConfig();
