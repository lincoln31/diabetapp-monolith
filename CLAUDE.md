# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

DiabetApp es una app móvil para el seguimiento de la diabetes (lecturas de glucosa, perfil médico, metas). Monorepo con dos proyectos independientes, cada uno con su propio `package.json` y `node_modules` (no hay workspaces):

- `diabetapp-backend/` — API REST: Express 5 + TypeScript (CommonJS) + Prisma + PostgreSQL, validación con Zod 4, JWT + bcrypt.
- `diabetapp-frontend/` — App Expo (SDK 53, React Native 0.79, React 19) con Expo Router, Axios y AsyncStorage.

El código, los comentarios y los mensajes al usuario están en español.

## Proceso de trabajo

El plan de mejora se sigue con especificaciones (SDD) en `specs/`: `specs/README.md` explica el flujo (spec → plan → tareas → implementación → verificación) y `specs/constitucion.md` los principios obligatorios. Antes de cambiar arquitectura, contrato de API o estructura de carpetas, consulta la spec de la fase correspondiente; si el cambio no está previsto, actualiza primero la spec.

La CI (`.github/workflows/ci.yml`) ejecuta en cada PR hacia `Develop` o `main`: formato, lint, tipos, migraciones y tests, en dos trabajos (`backend` y `frontend`). Node se fija con `.nvmrc`.

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

```bash
npm test                     # jest: tests de integración contra diabetapp_test
npm test -- -t "login"       # un test concreto por su nombre
npm test -- --coverage       # cobertura (umbral: 80 % de líneas)
npm run lint                 # eslint con tipos
npm run typecheck            # tsc --noEmit
npm run format:check         # prettier
```

Los tests usan `.env.test` y la base `diabetapp_test` del mismo contenedor; cada test arranca con las tablas vacías. `requests.http` sirve para probar a mano.

### Frontend (`cd diabetapp-frontend`)

```bash
npm start            # expo start
npm run android | ios | web
npm run lint         # expo lint (eslint-config-expo + reglas de dependencia)
npm run typecheck    # tsc --noEmit
```

```bash
npm test                     # jest-expo + @testing-library/react-native
npm run format:check         # prettier
```

Requiere `.env` con `EXPO_PUBLIC_API_URL` (parte de `.env.example`).

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
- **Módulos**: `health`, `auth` (register, login, refresh, logout, me) y `glucose` (CRUD en `/api/glucose` con `?from&to&page&limit` y `meta` de paginación). Añadir un módulo = carpeta en `modules/` más una línea en `modules/index.ts`.
- **Sesión**: token de acceso JWT de 15 min (solo `sub`, sin datos personales) + token de renovación opaco de 30 días, del que la BD guarda **solo el hash SHA-256** (`refresh_tokens`). Cada `POST /auth/refresh` rota el token; si llega uno ya usado se revoca toda la cadena de sesión (`familyId`). `logout` revoca y es idempotente.
- **Protección**: `express-rate-limit` en login (5 fallos por IP+correo/15 min), registro (5 por IP/hora) y refresh (30 por IP/15 min) → `RATE_LIMITED`; `helmet()`; body máximo 100 KB → `PAYLOAD_TOO_LARGE`. El login siempre compara un hash, exista o no el correo, para no revelar qué cuentas existen.
- **Recursos de usuario**: se consultan y modifican filtrando por `userId` en la misma operación (`updateMany` / `deleteMany`); una lectura de otro usuario responde `NOT_FOUND`.
- **Prisma**: enums nativos `MomentOfDay`, `DiabetesType`, `ActivityLevel` e `InsulinType`; los esquemas Zod los importan de `@prisma/client` para tener una sola lista de valores. `glucose_readings` tiene índice `(userId, timestamp)`.
- **Logs**: una línea por petición solo en desarrollo, sin body ni cabeceras; el SQL de Prisma solo con `PRISMA_LOG_QUERIES=true`.

## Arquitectura del frontend

- Las rutas viven en `app/` (Expo Router, file-based) y están separadas en dos grupos: `(auth)/login.tsx` y `(auth)/register.tsx` (solo sin sesión) y `(app)/index.tsx` y `(app)/glucose/new.tsx` (solo con sesión). `app/_layout.tsx` monta `<AuthProvider>` y usa `Stack.Protected` con el estado de sesión; mantiene el splash hasta saber si hay sesión.
- Los archivos de `app/` son **finos**: solo layout y `export { Pantalla as default } from '@/src/features/...'`. Nunca llevan lógica ni estilos.

```
src/
├── features/                    # una carpeta por funcionalidad, todas con la misma forma
│   ├── auth/                    # AuthProvider.tsx, api.ts, schemas.ts, types.ts, screens/, index.ts
│   ├── glucose/                 # api.ts, schemas.ts, types.ts, constants.ts, screens/, index.ts
│   └── home/
└── shared/
    ├── api/                     # client.ts (get/post/put/del tipados), errors.ts (ApiError), types.ts
    ├── session/                 # tokenStorage.ts (expo-secure-store) y sessionEvents.ts
    ├── components/ui/           # Button, Input, Card, Header, Icon, Checkbox, FormError
    ├── config/                  # env.ts (EXPO_PUBLIC_API_URL) y app.ts
    ├── forms/applyServerErrors.ts
    ├── theme/colors.ts          # COLORS
    └── utils/                   # dates.ts, showError.ts
```

- **Reglas de dependencia** (las vigila ESLint con `import/no-restricted-paths`): `shared/` nunca importa de `features/`, y una funcionalidad solo importa de otra a través de su `index.ts`.
- **Llamadas a la API**: siempre por el servicio de la funcionalidad (`authApi`, `glucoseApi`), que devuelve el `data` ya tipado. Las pantallas no importan el cliente HTTP ni axios.
- **Errores**: el cliente convierte todo en `ApiError` (`code`, `message`, `fields`) y **no muestra alertas**. En formularios, `applyServerErrors` coloca cada mensaje bajo su campo y lo demás va a `<FormError>`; fuera de formularios, `showError()`.
- **Formularios**: `react-hook-form` + `zod` (`zodResolver`). Los esquemas de cada funcionalidad repiten las reglas del backend; si cambia una, cámbiala en ambos lados.
- **Configuración**: `EXPO_PUBLIC_API_URL` en `.env` (hay `.env.example`). Si falta, la app falla al arrancar con un mensaje explicativo. Tras editar `.env` hay que reiniciar `npm start`.
- **Imports** con el alias `@/` (p. ej. `@/src/shared/components/ui`); los relativos solo dentro de la misma carpeta.
- **Iconos**: `Icon` con nombres semánticos tipados (`AppIconName`) sobre Ionicons de `@expo/vector-icons`.

## Contrato frontend ↔ backend

- El frontend valida los formularios con las mismas reglas que los esquemas Zod del backend (contraseña 8+ con mayúscula, minúscula y número; teléfono opcional 10–20 caracteres). Ambos usan Zod 4: si cambias una regla, cámbiala en `src/features/<x>/schemas.ts` y en el `*.schemas.ts` del backend.
- Fechas: la app captura `DD/MM/YYYY` y envía ISO (`shared/utils/dates.ts`); el backend recibe `birthDate` en ISO. El campo se llama `dateOfBirth` en el formulario y `birthDate` en la API (hay un alias al mapear errores).
- Registro y login devuelven `data: { user, accessToken, refreshToken, requiresOnboarding }`; `AuthProvider` guarda ambos tokens en el almacenamiento seguro. Las contraseñas se envían tal cual las escribe el usuario (sin `trim`).
- Errores: la app los normaliza con `toApiError(error)` de `src/shared/api/errors.ts` y decide por `code`.
- `momentOfDay` usa los valores del enum `MomentOfDay` del backend.
