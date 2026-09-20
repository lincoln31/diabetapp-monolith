# Tareas F1 — Bases del backend

Implementa: [plan.md](plan.md) · Rama sugerida: `refactor/fase-1-bases-backend`

`[P]` = paralelizable dentro del bloque. Un commit por tarea o por grupo pequeño, citando el ID (`refactor(api): T1.4 errorHandler`).

## Bloque A — Infraestructura compartida

- [ ] **T1.1** Separar `src/app.ts` (crea la app) de `src/server.ts` (solo `listen`). — RF-1.12
- [ ] **T1.2** `config/env.ts`: única carga de `dotenv`, añadir `CORS_ORIGIN` y `PRISMA_LOG_QUERIES`; sustituir todos los `process.env` del código por `env`. — RF-1.13 · depende de T1.1
- [ ] **T1.3 [P]** `shared/errors/errorCodes.ts` y `AppError.ts` con el catálogo de la spec. — RF-1.3, RF-1.7
- [ ] **T1.4** `shared/middleware/errorHandler.ts` (AppError, ZodError, Prisma P2002/P2025, JSON mal formado, genérico) y `notFound.ts`. — RF-1.2, RF-1.4, RF-1.5, RF-1.8 · depende de T1.3
- [ ] **T1.5 [P]** `shared/http/respond.ts` con `ok()`. — RF-1.1
- [ ] **T1.6** `shared/middleware/validate.ts` y ampliar `types/express.d.ts` con `req.validated`. — RF-1.9, RF-1.10 · depende de T1.3
- [ ] **T1.7** Mover `middleware/auth.middleware.ts` a `shared/middleware/authenticate.ts` lanzando `UNAUTHENTICATED` / `TOKEN_EXPIRED`. — RF-1.3 · depende de T1.3
- [ ] **T1.8 [P]** `requestLogger.ts` (solo development) y logs de Prisma según `PRISMA_LOG_QUERIES`; mensaje de arranque sin IP. — RF-1.21, RF-1.22, RF-1.23
- [ ] **T1.9** `modules/index.ts` con `registerModules` y módulo `health`. Montar todo en `app.ts` en este orden: logger → cors → json → módulos → notFound → errorHandler. — RF-1.6, RF-1.11 · depende de T1.4 – T1.8

## Bloque B — Base de datos

- [ ] **T1.10** Resolver las aclaraciones de la spec (§8) y anotarlas.
- [ ] **T1.11** Enums e índice en `schema.prisma`; `prisma migrate dev --create-only --name enums_and_glucose_index`. — RF-1.18, RF-1.20 · depende de T1.10
- [ ] **T1.12** Editar la migración generada con las conversiones `USING (CASE …)` del plan (D-1.6). — RF-1.19 · depende de T1.11
- [ ] **T1.13** Probar la migración sobre un volcado con datos de ejemplo (incluido `GESTACIONAL` y un `momentOfDay` inválido) y verificar CA-1.14 – CA-1.16. — depende de T1.12

## Bloque C — Módulo `auth`

- [ ] **T1.14** Renombrar `auth.validation.ts` → `auth.schemas.ts`, usar el enum `DiabetesType` de Prisma, inferir tipos y eliminar `auth.types.ts`. — RF-1.11, RF-1.18 · depende de T1.11
- [ ] **T1.15** `auth.service.ts`: lanzar `AppError` (`EMAIL_IN_USE`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`); tipar `createData` con `Prisma.UserCreateInput`; quitar `try/catch` que solo relanzan. — RF-1.7, RF-1.24
- [ ] **T1.16** `auth.controller.ts` y `auth.routes.ts`: controladores sin `try/catch`, `validate()` en las rutas, `ok()` en las respuestas; `verify-token` con `authenticate`. — RF-1.1, RF-1.9, RNF-1.1 · depende de T1.14, T1.15

## Bloque D — Módulo `glucose`

- [ ] **T1.17** Aplanar el módulo: `glucose.routes.ts`, `glucose.controller.ts`, `glucose.service.ts`, `glucose.schemas.ts`; borrar `glucose/index.ts`, las subcarpetas y `getGlucoseStats`. — RF-1.11, RF-1.24
- [ ] **T1.18** Esquemas: `createGlucoseSchema` con `z.enum(MomentOfDay)`; `updateGlucoseSchema` parcial y **no vacío**; `listGlucoseQuerySchema` (`from`, `to`, `page`, `limit` con `z.coerce`); `idParamsSchema`. — RF-1.9, RF-1.14, RF-1.17 · depende de T1.11
- [ ] **T1.19** Servicio: listado con filtros + paginación en `$transaction` (`findMany` + `count`); `update`/`delete` con `updateMany`/`deleteMany` por `{ id, userId }` y `NOT_FOUND` si `count === 0`. — RF-1.14 – RF-1.16
- [ ] **T1.20** Controlador y rutas con `validate()` y `ok()` (201 al crear, `meta` en el listado, `null` al borrar). — RF-1.1, RF-1.15 · depende de T1.18, T1.19

## Bloque E — Frontend

- [ ] **T1.21** `apiClient.ts`: tipos `ApiSuccess<T>`, `ApiErrorBody` y helper `getApiError()`. — RF-1.25
- [ ] **T1.22** `useAuth.ts` y `add-glucose.tsx`: decidir por `error.code` y mostrar `fields[0].message` / `message`. — RF-1.25 · depende de T1.21
- [ ] **T1.23 [P]** Revisar que la app no envíe `GESTACIONAL` en ningún sitio. — RF-1.26

## Bloque F — Verificación y cierre

- [ ] **T1.24** Crear `diabetapp-backend/requests.http` con una petición por CA-1.1 – CA-1.13. — Verificación
- [ ] **T1.25** Script local `prisma/seed-perf.ts` y medir RNF-1.3.
- [ ] **T1.26** Ejecutar toda la verificación del plan (§4) y marcar CA-1.1 … CA-1.20 en el PR.
- [ ] **T1.27** Actualizar `CLAUDE.md` (estructura de módulo, contrato, catálogo de errores) y el estado en `specs/README.md`.

## Trazabilidad

| RF | Tareas | CA |
|---|---|---|
| RF-1.1 | T1.5, T1.16, T1.20 | CA-1.1 |
| RF-1.2, RF-1.3 | T1.3, T1.4, T1.7 | CA-1.2, CA-1.4, CA-1.5 |
| RF-1.4 | T1.4 | CA-1.6 |
| RF-1.5 | T1.4 | CA-1.7 |
| RF-1.6 | T1.9 | CA-1.8 |
| RF-1.7, RF-1.8 | T1.3, T1.4, T1.15 | CA-1.2, CA-1.12 |
| RF-1.9, RF-1.10 | T1.6, T1.16, T1.18 | CA-1.3 |
| RF-1.11 | T1.9, T1.14, T1.17 | Revisión de código |
| RF-1.12 | T1.1 | CA-1.19 |
| RF-1.13 | T1.2 | CA-1.18 |
| RF-1.14, RF-1.15 | T1.18, T1.19, T1.20 | CA-1.9, CA-1.10, CA-1.11 |
| RF-1.16 | T1.19 | CA-1.12 |
| RF-1.17 | T1.18 | CA-1.13 |
| RF-1.18 – RF-1.20 | T1.11 – T1.13 | CA-1.14 – CA-1.16 |
| RF-1.21 – RF-1.23 | T1.8 | CA-1.17 |
| RF-1.24 | T1.15, T1.17 | Revisión de código |
| RF-1.25, RF-1.26 | T1.21 – T1.23 | CA-1.20 |
