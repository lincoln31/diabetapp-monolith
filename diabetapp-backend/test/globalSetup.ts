import { execSync } from 'child_process';
import { config } from 'dotenv';

/** Prepara la base de datos de pruebas antes de toda la suite. */
export default function globalSetup(): void {
  config({ path: '.env.test', quiet: true });

  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}
