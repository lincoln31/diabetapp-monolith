# Plan técnico F0 — Correcciones urgentes

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-0.1 Rotar el secreto en lugar de reescribir el historial

- **Decisión:** se invalida el secreto cambiándolo (RF-0.1); **no** se reescribe el historial con `git filter-repo`.
- **Motivo:** el repositorio es público y el commit ya pudo ser clonado o indexado; borrar el historial no "des-publica" el secreto. Reescribirlo obliga a todos los colaboradores a re-clonar y rompe los PR abiertos. Un secreto rotado deja de tener valor.
- **Alternativa descartada:** `git filter-repo --path diabetapp-backend/.env_prueba --invert-paths` + force push. Solo tendría sentido si el archivo contuviera algo que no se puede rotar (no es el caso: la contraseña de BD es la de desarrollo local de `docker-compose.yml`).

### D-0.2 Mismo camino de error para usuario desactivado

El chequeo de `isActive` se hace dentro del flujo existente de `loginUser`, lanzando el mismo error interno que "usuario no encontrado" para que el controlador responda igual (`INVALID_CREDENTIALS`). La contraseña se sigue comparando antes, para no introducir diferencias de tiempo entre "desactivado" e "inexistente" más allá de las que ya existen (el problema de tiempos se resuelve en la fase 2, RF-2.6).

### D-0.3 Errores de entorno con la API pública de Zod

Se usa `safeParse` y `error.issues` (API pública de Zod 4), imprimiendo `issue.path.join('.')` y `issue.message`. Se elimina el acceso a `_zod.def`.

## 2. Cambios por archivo

### Repositorio

| Archivo                                    | Cambio                                                                                           | RF     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------ |
| `.gitignore` (raíz)                        | Sustituir `.env` / `.env.*` / `!.env.example` por `.env*` + `!.env.example` + `!**/env.example`. | RF-0.2 |
| `diabetapp-backend/.gitignore`             | Sustituir `.env` por `.env*`.                                                                    | RF-0.2 |
| `package.json`, `package-lock.json` (raíz) | Eliminar.                                                                                        | RF-0.6 |

### Backend

| Archivo                            | Cambio                                                                                                                                                                                                             | RF             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `src/modules/auth/auth.service.ts` | Añadir `isActive: true` al `select` de `loginUser`; tras comparar la contraseña, si `!user.isActive` lanzar `USER_NOT_FOUND` (que ya se traduce a `INVALID_CREDENTIALS`). Eliminar `import { string } from 'zod'`. | RF-0.4, RF-0.6 |
| `src/config/env.ts`                | Reescribir `loadEnvConfig` con `envSchema.safeParse(process.env)`; si falla, imprimir cada `issue` como `   ${path}: ${message}` y `process.exit(1)`. Eliminar el `import { ZodError }` y el `try/catch`.          | RF-0.5         |
| `src/types/index.d.ts`             | Eliminar (duplica `express.d.ts` e importa un módulo inexistente).                                                                                                                                                 | RF-0.6         |
| `migration.sql`                    | Eliminar.                                                                                                                                                                                                          | RF-0.6         |
| `env.example`                      | Revisar que solo tenga valores ficticios y que `DATABASE_URL` apunte al puerto 5433 de `docker-compose.yml`.                                                                                                       | RF-0.1         |

### Frontend

| Archivo                                      | Cambio                                                 | RF     |
| -------------------------------------------- | ------------------------------------------------------ | ------ |
| `src/components/ui/Input.tsx`                | Añadir `Text` al import de `react-native`.             | RF-0.3 |
| `src/app.tsx`, `src/screens/LoginScreen.tsx` | Eliminar (y la carpeta `src/screens/` si queda vacía). | RF-0.6 |

### Operación (fuera del código)

1. Generar un secreto nuevo por entorno: `npm run generate-secret` (backend).
2. Actualizar la variable `JWT_SECRET` en cada entorno listado en la aclaración de la spec.
3. Reiniciar el backend. Todas las sesiones existentes quedan invalidadas (efecto esperado: los usuarios vuelven a iniciar sesión).

## 3. Verificación

| CA              | Cómo se verifica                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-0.1          | Firmar un token de prueba con el secreto antiguo (en local, sin publicarlo) y llamar a `GET /api/glucose` del entorno → 401.                 |
| CA-0.2          | `git check-ignore -v diabetapp-backend/.env_prueba diabetapp-frontend/.env.local .env diabetapp-backend/env.example`                         |
| CA-0.3          | Pantalla temporal o prop `error` en el registro; comprobar en Expo Go.                                                                       |
| CA-0.4 / CA-0.5 | Con la BD local: crear usuario, `UPDATE users SET "isActive" = false`, llamar al login y comparar el cuerpo con el de contraseña incorrecta. |
| CA-0.6          | `env -u JWT_SECRET DATABASE_URL= npx ts-node -e "require('./src/config/env')"; echo $?`                                                      |
| CA-0.7          | `npx tsc --noEmit` en ambos proyectos; `git ls-files` sin los archivos eliminados.                                                           |

## 4. Riesgos

| Riesgo                                                  | Mitigación                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Algún script o persona usa el `package.json` de la raíz | Se comprobó que solo declara `jsonwebtoken`, que ya está en el backend. |
| Rotar el secreto cierra las sesiones activas            | Esperado y aceptable (el token dura 1 h).                               |
