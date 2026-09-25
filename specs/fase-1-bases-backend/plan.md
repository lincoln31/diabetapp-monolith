# Plan técnico F1 — Bases del backend

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-1.1 Estructura de carpetas

```
diabetapp-backend/src/
├── app.ts                    # crea y configura la app Express (sin listen)      RF-1.12
├── server.ts                 # importa app + env y hace listen                   RF-1.12
├── config/
│   ├── env.ts                # única lectura de process.env (Zod)                RF-1.13
│   └── db.ts                 # PrismaClient singleton; log según env             RF-1.22
├── shared/
│   ├── errors/
│   │   ├── errorCodes.ts     # catálogo code → { status, defaultMessage }        RF-1.3
│   │   └── AppError.ts       # class AppError extends Error { code, status, fields? }
│   ├── http/
│   │   └── respond.ts        # ok(res, data, { status?, meta? })                 RF-1.1
│   └── middleware/
│       ├── authenticate.ts   # (antes middleware/auth.middleware.ts)
│       ├── validate.ts       # validate({ body?, query?, params? })              RF-1.9
│       ├── errorHandler.ts   # AppError | ZodError | Prisma → respuesta          RF-1.2, RF-1.4, RF-1.8
│       ├── notFound.ts                                                          RF-1.5
│       └── requestLogger.ts  # solo en development                               RF-1.21
├── modules/
│   ├── index.ts              # registerModules(router): una línea por módulo     RNF-1.2
│   ├── health/
│   │   └── health.routes.ts                                                     RF-1.6
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.schemas.ts   # Zod + tipos inferidos (sustituye .validation y .types)
│   └── glucose/
│       ├── glucose.routes.ts
│       ├── glucose.controller.ts
│       ├── glucose.service.ts
│       └── glucose.schemas.ts
└── types/
    └── express.d.ts          # req.user, req.validated
```

**Forma de módulo (RF-1.11):** `<m>.routes.ts` → `<m>.controller.ts` → `<m>.service.ts`, con `<m>.schemas.ts` para Zod. Los tipos de entrada se infieren de los esquemas (`z.infer`), por eso desaparece `*.types.ts`. Se elige la forma **plana** de `auth` porque con 4 archivos por módulo las subcarpetas no aportan.

### D-1.2 Errores

```ts
// shared/errors/errorCodes.ts
export const ERROR_CODES = {
  VALIDATION_ERROR:    { status: 400, message: 'Datos de entrada inválidos' },
  INVALID_CREDENTIALS: { status: 401, message: 'Email o contraseña incorrectos' },
  UNAUTHENTICATED:     { status: 401, message: 'Debes iniciar sesión' },
  TOKEN_EXPIRED:       { status: 401, message: 'Tu sesión expiró' },
  FORBIDDEN:           { status: 403, message: 'No tienes permiso para esta acción' },
  NOT_FOUND:           { status: 404, message: 'Recurso no encontrado' },
  EMAIL_IN_USE:        { status: 409, message: 'El correo electrónico ya está registrado' },
  CONFLICT:            { status: 409, message: 'El recurso ya existe' },
  INTERNAL_ERROR:      { status: 500, message: 'Error interno del servidor' },
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

// shared/errors/AppError.ts
export class AppError extends Error {
  constructor(public code: ErrorCode, message?: string, public fields?: FieldError[]) { … }
  get status() { return ERROR_CODES[this.code].status; }
}
```

`errorHandler(err, req, res, next)` decide en este orden:

| Tipo de error                                        | Respuesta                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `AppError`                                           | `status` y `code` del catálogo; `message` propio o el por defecto     |
| `ZodError` (por si algún servicio usa `parse`)       | 400 `VALIDATION_ERROR` + `fields`                                     |
| `Prisma.PrismaClientKnownRequestError` `P2002`       | 409 `CONFLICT`                                                        |
| `Prisma.PrismaClientKnownRequestError` `P2025`       | 404 `NOT_FOUND`                                                       |
| `SyntaxError` de `express.json()` (body mal formado) | 400 `VALIDATION_ERROR`                                                |
| Cualquier otro                                       | 500 `INTERNAL_ERROR`, mensaje genérico; `console.error(err)` completo |

**Express 5** propaga solo los errores de las funciones `async` rechazadas al `errorHandler`, así que los controladores **no** necesitan `try/catch` (RNF-1.1).

### D-1.3 Validación

```ts
validate({ body?: ZodType, query?: ZodType, params?: ZodType })
```

- `body` → se reemplaza `req.body` por el resultado de `parse` (ya convertido).
- `query` y `params` → en **Express 5 `req.query` es de solo lectura**, así que el resultado se guarda en `req.validated.query` / `req.validated.params` (tipado en `types/express.d.ts`).
- Si falla, se lanza `AppError('VALIDATION_ERROR', undefined, fields)`; `fields` se construye con `issue.path.join('.')` y `issue.message`.

### D-1.4 Respuestas de éxito

`ok(res, data, { status = 200, meta })` envía `{ success: true, data, ...(meta && { meta }) }`. Se usa `status: 201` al crear. Borrar devuelve `ok(res, null)`.

### D-1.5 Autenticación en el nuevo formato

`authenticate.ts` conserva la lógica actual (cabecera `Bearer`, `jwt.verify` con `env.JWT_SECRET`) pero lanza `AppError('UNAUTHENTICATED')` o `AppError('TOKEN_EXPIRED')`. Los códigos antiguos `ACCESS_TOKEN_REQUIRED`, `INVALID_TOKEN_FORMAT`, `INVALID_TOKEN`, `SERVER_CONFIGURATION_ERROR` desaparecen (el último ya no puede ocurrir: `env.ts` exige `JWT_SECRET` al arrancar). `verifyTokenController` pasa a usar el mismo middleware.

### D-1.6 Enums de Prisma y migración

```prisma
enum MomentOfDay   { BEFORE_BREAKFAST AFTER_BREAKFAST BEFORE_LUNCH AFTER_LUNCH BEFORE_DINNER AFTER_DINNER BEFORE_SLEEP OTHER }
enum DiabetesType  { TYPE_1 TYPE_2 GESTATIONAL PREDIABETES }
enum ActivityLevel { SEDENTARY LIGHT MODERATE ACTIVE }
enum InsulinType   { RAPID LONG_ACTING MIXED NONE }

model GlucoseReading {
  …
  momentOfDay MomentOfDay @default(OTHER)
  @@index([userId, timestamp])
}
```

`prisma migrate dev --create-only` genera la migración, y **se edita a mano** antes de aplicarla para convertir los datos (RF-1.19), porque Prisma por defecto haría `DROP COLUMN` + `ADD COLUMN`:

```sql
CREATE TYPE "MomentOfDay" AS ENUM (…);
ALTER TABLE "glucose_readings"
  ALTER COLUMN "momentOfDay" TYPE "MomentOfDay"
  USING (CASE WHEN "momentOfDay" IN ('BEFORE_BREAKFAST', …, 'OTHER')
              THEN "momentOfDay"::"MomentOfDay"
              ELSE 'OTHER'::"MomentOfDay" END);
-- Igual para typeOfDiabetes (con 'GESTACIONAL' → 'GESTATIONAL'), activityLevel, insulinType (resto → NULL)
CREATE INDEX "glucose_readings_userId_timestamp_idx" ON "glucose_readings"("userId", "timestamp");
```

Los esquemas Zod usan `z.enum(MomentOfDay)` importando el enum generado por Prisma (`@prisma/client`), para que exista **una sola lista** de valores.

### D-1.7 Paginación con offset

Se elige `page`/`limit` (offset) en lugar de cursor: el historial se consulta por rangos de fechas y el volumen por usuario es bajo (≈ 4 lecturas/día ≈ 1 500/año). El servicio ejecuta `findMany` y `count` en una `prisma.$transaction` para que `total` sea coherente.

### D-1.8 Actualizar y borrar en una operación

- `update`: `prisma.glucoseReading.updateMany({ where: { id, userId }, data })` → si `count === 0` lanza `NOT_FOUND`; después `findUniqueOrThrow` para devolver la lectura.
- `delete`: `deleteMany({ where: { id, userId } })` → si `count === 0` lanza `NOT_FOUND`.

### D-1.9 Configuración

`env.ts` añade `CORS_ORIGIN` (opcional, por defecto `*`) y `PRISMA_LOG_QUERIES` (booleano, por defecto `false`). `dotenv` se carga solo dentro de `env.ts`. `server.ts` usa `env.PORT`. Mensaje de arranque: `Servidor escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`.

## 2. Cambios en el frontend (RF-1.25, RF-1.26)

| Archivo                      | Cambio                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/api/apiClient.ts`       | Añadir el tipo `ApiErrorBody` y un helper `getApiError(error)` que devuelva `{ code, message, fields }` (o un error de red). El interceptor sigue igual en esta fase (la política de alertas cambia en la fase 3). |
| `src/hooks/useAuth.ts`       | Usar `getApiError`: `INVALID_CREDENTIALS` → "Credenciales incorrectas"; `EMAIL_IN_USE` → "Email ya registrado"; `VALIDATION_ERROR` → `fields[0].message`.                                                          |
| `app/modals/add-glucose.tsx` | Igual: `VALIDATION_ERROR` → mensaje del campo; `UNAUTHENTICATED` / `TOKEN_EXPIRED` → "Sesión expirada".                                                                                                            |

## 3. Contrato de endpoints tras la fase

| Método y ruta                | Auth | Entrada validada                               | Éxito                                                  |
| ---------------------------- | ---- | ---------------------------------------------- | ------------------------------------------------------ |
| `GET /api/health`            | No   | —                                              | 200 `{ status }`                                       |
| `POST /api/auth/register`    | No   | body `registerSchema`                          | 201 `{ user, token, requiresOnboarding }`              |
| `POST /api/auth/login`       | No   | body `loginSchema`                             | 200 `{ user, token, requiresOnboarding }`              |
| `GET /api/auth/check-email`  | No   | query `{ email }`                              | 200 `{ email, available }` _(se elimina en la fase 2)_ |
| `GET /api/auth/verify-token` | Sí   | —                                              | 200 `{ user, tokenInfo }`                              |
| `GET /api/glucose`           | Sí   | query `{ from?, to?, page?, limit? }`          | 200 `GlucoseReading[]` + `meta`                        |
| `GET /api/glucose/:id`       | Sí   | params `{ id }`                                | 200 `GlucoseReading`                                   |
| `POST /api/glucose`          | Sí   | body `createGlucoseSchema`                     | 201 `GlucoseReading`                                   |
| `PUT /api/glucose/:id`       | Sí   | params + body `updateGlucoseSchema` (no vacío) | 200 `GlucoseReading`                                   |
| `DELETE /api/glucose/:id`    | Sí   | params `{ id }`                                | 200 `null`                                             |

## 4. Verificación

Hasta que exista la suite de la fase 4, se añade `diabetapp-backend/requests.http` (formato REST Client / JetBrains HTTP Client) con una petición por CA para ejecutarlas a mano. Estas mismas peticiones serán la base de los tests de integración de la fase 4.

| CA                | Cómo                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-1.1 – CA-1.13  | `requests.http` contra la BD local                                                                                                                                  |
| CA-1.14 – CA-1.16 | `psql` sobre la BD local tras `prisma migrate dev`; para CA-1.15, cargar antes un volcado con datos de ejemplo (incluido `GESTACIONAL` y un `momentOfDay` inválido) |
| CA-1.17           | `NODE_ENV=production npm start` y revisar la consola                                                                                                                |
| CA-1.18           | `grep -rn "process.env" src` → solo `config/env.ts`                                                                                                                 |
| CA-1.19           | `node -e "require('./dist/app')"` termina sin quedarse escuchando                                                                                                   |
| CA-1.20           | Expo Go contra el backend local                                                                                                                                     |
| RNF-1.3           | Script `prisma/seed-perf.ts` (solo local) que inserta 10 000 lecturas y mide `GET /api/glucose`                                                                     |

## 5. Riesgos

| Riesgo                             | Mitigación                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Cambio de formato rompe la app     | RF-1.25 se implementa en el mismo PR; se prueba CA-1.20 antes de fusionar.                                                         |
| La migración de enums pierde datos | Migración editada a mano (D-1.6) y probada con un volcado (CA-1.15) antes de aplicarla en cualquier BD compartida.                 |
| Refactor grande sin tests          | PR dividido en commits por bloque de tareas; `requests.http` como red de seguridad; la fase 4 (backend) empieza justo después.     |
| `z.enum` con enums de Prisma       | Zod 4 acepta enums nativos de TypeScript en `z.enum(...)`; si diera problemas, usar `z.nativeEnum` o `Object.values(MomentOfDay)`. |
