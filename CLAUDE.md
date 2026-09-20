# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

DiabetApp es una app móvil para el seguimiento de la diabetes (lecturas de glucosa, perfil médico, metas). Monorepo con dos proyectos independientes, cada uno con su propio `package.json` y `node_modules` (no hay workspaces):

- `diabetapp-backend/` — API REST: Express 5 + TypeScript (CommonJS) + Prisma + PostgreSQL, validación con Zod 4, JWT + bcrypt.
- `diabetapp-frontend/` — App Expo (SDK 53, React Native 0.79, React 19) con Expo Router, Axios y AsyncStorage.

El código, los comentarios y los mensajes al usuario están en español.

## Proceso de trabajo

El plan de mejora se sigue con especificaciones (SDD) en `specs/`: `specs/README.md` explica el flujo (spec → plan → tareas → implementación → verificación) y `specs/constitucion.md` los principios obligatorios. Antes de cambiar arquitectura, contrato de API o estructura de carpetas, consulta la spec de la fase correspondiente; si el cambio no está previsto, actualiza primero la spec.

## Comandos

### Backend (`cd diabetapp-backend`)

```bash
docker compose up -d        # PostgreSQL en localhost:5433 (user/password, db diabetapp_dev)
npm run dev                 # nodemon + ts-node sobre src/server.ts (puerto 3000 o $PORT)
npm run build               # tsc -> dist/
npm start                   # node dist/server.js
npx prisma migrate dev --name <nombre>   # crear/aplicar migración tras editar schema.prisma
npx prisma generate         # regenerar el cliente
npx prisma studio
npx ts-node prisma/seed-perf.ts <email>   # solo local: 10 000 lecturas para medir rendimiento
```

Requiere `.env` (ignorado por git; parte de `env.example`) con `DATABASE_URL` (p. ej. `postgresql://user:password@localhost:5433/diabetapp_dev`) y `JWT_SECRET`.

No hay framework de tests configurado (`npm test` solo falla); mientras tanto, `requests.http` tiene una petición por criterio de aceptación de la fase 1.

### Frontend (`cd diabetapp-frontend`)

```bash
npm start            # expo start
npm run android | ios | web
npm run lint         # expo lint (eslint-config-expo)
npx tsc --noEmit     # chequeo de tipos
```

No hay tests en el frontend.

## Arquitectura del backend

```
src/
├── app.ts                 # crea la app Express (sin escuchar): logger → cors → json → módulos → notFound → errorHandler
├── server.ts              # solo hace listen
├── config/                # env.ts (única lectura de process.env, validada con Zod) y db.ts (PrismaClient)
├── shared/
│   ├── errors/            # errorCodes.ts (catálogo) y AppError
│   ├── http/respond.ts    # ok(res, data, { status, meta })
│   └── middleware/        # authenticate, validate, errorHandler, notFound, requestLogger
├── modules/
│   ├── index.ts           # registerModules(): una línea por módulo
│   └── <dominio>/         # <d>.routes.ts → <d>.controller.ts → <d>.service.ts + <d>.schemas.ts
└── types/express.d.ts     # req.user y req.validated
```

- **Contrato de API**: éxito `{ success: true, data, meta? }`; error `{ success: false, error: { code, message, fields? } }`. Un `field` vacío dentro de `fields` significa que el error es del formulario completo, no de un campo.
- **Códigos de error** (`shared/errors/errorCodes.ts`): `VALIDATION_ERROR` 400; `INVALID_CREDENTIALS`, `UNAUTHENTICATED` y `TOKEN_EXPIRED` 401; `FORBIDDEN` 403; `NOT_FOUND` 404; `EMAIL_IN_USE` y `CONFLICT` 409; `INTERNAL_ERROR` 500. La app decide por `code`, nunca por el mensaje ni por el status.
- **Errores**: cualquier capa lanza `new AppError('CODIGO')` y el `errorHandler` lo traduce (mapea Prisma P2002 → `CONFLICT` y P2025 → `NOT_FOUND`). Los controladores **no** llevan `try/catch`: Express 5 envía al manejador las promesas rechazadas.
- **Validación**: `validate({ body, query, params })` en la ruta. El `body` validado reemplaza a `req.body`; query y params se leen con `validatedQuery<T>(req)` y `validatedParams<T>(req)`, porque en Express 5 son de solo lectura. Los tipos se infieren del esquema con `z.infer`.
- **Módulos**: `health`, `auth` (register, login, check-email, verify-token) y `glucose` (CRUD en `/api/glucose` con `?from&to&page&limit` y `meta` de paginación). Añadir un módulo = carpeta en `modules/` más una línea en `modules/index.ts`.
- **Recursos de usuario**: se consultan y modifican filtrando por `userId` en la misma operación (`updateMany` / `deleteMany`); una lectura de otro usuario responde `NOT_FOUND`.
- **Prisma**: enums nativos `MomentOfDay`, `DiabetesType`, `ActivityLevel` e `InsulinType`; los esquemas Zod los importan de `@prisma/client` para tener una sola lista de valores. `glucose_readings` tiene índice `(userId, timestamp)`.
- **Logs**: una línea por petición solo en desarrollo, sin body ni cabeceras; el SQL de Prisma solo con `PRISMA_LOG_QUERIES=true`.

## Arquitectura del frontend

- Las rutas viven en `app/` (Expo Router, file-based): `_layout.tsx` es un simple `<Slot />`; `index.tsx` es la pantalla de login, `register.tsx`, `home.tsx` y `modals/add-glucose.tsx`.
- La lógica reutilizable está en `src/` (ver `REFACTORING.md`):
  - `src/constants/config.ts` — fuente única de `API_CONFIG` (baseURL por plataforma: `localhost` en iOS, IP LAN `192.168.1.9` en Android — ajustar a la IP local de la máquina), endpoints, `COLORS` y reglas de validación.
  - `src/api/apiClient.ts` — instancia Axios que inyecta `Authorization: Bearer <token>` desde AsyncStorage (clave `TOKEN_STORAGE_KEY`, que `useAuth` guarda al hacer login y borra en logout) y muestra `Alert` globales para errores de red/500; deja pasar 401 y 409 para que la pantalla los maneje.
  - `src/hooks/useAuth.ts` — login/registro/logout con validación y alertas.
  - `src/components/ui/` — componentes base (`Button`, `Input`, `Card`, `Header`, `Icon`, `Checkbox`) exportados desde `index.ts`. Usar estos y `COLORS` en vez de estilos ad hoc.
- Las carpetas raíz `components/`, `hooks/`, `constants/` son del template de Expo (tema claro/oscuro) y la app actual usa principalmente `src/`.
- Las rutas se importan con paths relativos (`../src/...`); existe el alias `@/*` → raíz del frontend.

## Contrato frontend ↔ backend

- El frontend valida los formularios con las mismas reglas que los esquemas Zod del backend (contraseña 8+ con mayúscula, minúscula y número; teléfono opcional 10–20 caracteres). Si cambias una regla, cámbiala en `src/utils/validation.ts` y en el `*.schemas.ts` correspondiente.
- Fechas: la app captura `DD/MM/YYYY` y envía ISO (`dateOfBirthToISO`); el backend recibe `birthDate` con `z.string().datetime()`.
- Registro y login devuelven `data: { user, token, requiresOnboarding }`; `useAuth` guarda el token en ambos casos.
- Errores: la app los normaliza con `getApiError(error)` de `src/api/apiClient.ts` y decide por `code`.
- `momentOfDay` usa los valores del enum `MomentOfDay` del backend.
