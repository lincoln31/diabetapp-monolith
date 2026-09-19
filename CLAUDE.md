# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

DiabetApp es una app móvil para el seguimiento de la diabetes (lecturas de glucosa, perfil médico, metas). Monorepo con dos proyectos independientes, cada uno con su propio `package.json` y `node_modules` (el `package.json` de la raíz es residual; no hay workspaces):

- `diabetapp-backend/` — API REST: Express 5 + TypeScript (CommonJS) + Prisma + PostgreSQL, validación con Zod 4, JWT + bcrypt.
- `diabetapp-frontend/` — App Expo (SDK 53, React Native 0.79, React 19) con Expo Router, Axios y AsyncStorage.

El código, los comentarios y los mensajes al usuario están en español.

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
```

Requiere `.env` (ignorado por git) con `DATABASE_URL` (p. ej. `postgresql://user:password@localhost:5433/diabetapp_dev`) y `JWT_SECRET`.

No hay framework de tests configurado (`npm test` solo falla).

### Frontend (`cd diabetapp-frontend`)

```bash
npm start            # expo start
npm run android | ios | web
npm run lint         # expo lint (eslint-config-expo)
npx tsc --noEmit     # chequeo de tipos
```

No hay tests en el frontend.

## Arquitectura del backend

- `src/server.ts` monta middlewares (logger de peticiones, CORS abierto, `express.json()`), las rutas bajo `/api/<módulo>` y un handler 404 final que lista rutas disponibles (mantener esa lista al día al añadir rutas).
- Módulos por dominio en `src/modules/<dominio>/` con la separación: `*.routes.ts` → `*.controller.ts` → `*.service.ts` (clase con acceso a Prisma), más `*.validation.ts` (esquemas Zod) y `*.types.ts`. Existen `auth` (`register`, `login`, `check-email`, `verify-token`) y `glucose` (CRUD en `/api/glucose`; este módulo usa subcarpetas `controllers/`, `routes/`, `services/`, `validation/`).
- Convención de errores: el servicio lanza `new Error('CODIGO_EN_MAYUSCULAS')` (p. ej. `USER_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `DATABASE_ERROR`) y el controlador hace `switch (error.message)` para mapearlo a status HTTP. Las respuestas siguen el formato `{ success, message, data? | code? | errors? }`; los errores de Zod se devuelven como `errors: [{ field, message }]`.
- `src/config/db.ts` exporta un `PrismaClient` singleton (cacheado en `global` fuera de producción).
- Modelos Prisma (`prisma/schema.prisma`): `User` (tabla `users`, id `cuid`, muchos campos opcionales de perfil/metas; los "enums" como `typeOfDiabetes` son `String`) y `GlucoseReading` (tabla `glucose_readings`, relación con `User` con `onDelete: Cascade`). `diabetapp-backend/migration.sql` es un script suelto, no parte de las migraciones de Prisma.
- `src/config/env.ts` valida las variables de entorno con Zod al arrancar (`JWT_SECRET` de 32+ caracteres; si falta algo el proceso termina). `npm run generate-secret` genera uno.
- Rutas protegidas: `authenticateToken` (`src/middleware/auth.middleware.ts`) verifica el JWT y deja `req.user.id` (tipado en `src/types/express.d.ts`).
- `momentOfDay` de las lecturas es un enum validado en `glucoseValidation.ts` (`BEFORE_BREAKFAST`, `AFTER_LUNCH`, …); el frontend debe enviar esos mismos valores. `value` es entero (20–600 mg/dL).

## Arquitectura del frontend

- Las rutas viven en `app/` (Expo Router, file-based): `_layout.tsx` es un simple `<Slot />`; `index.tsx` es la pantalla de login, `register.tsx`, `home.tsx` y `modals/add-glucose.tsx`.
- La lógica reutilizable está en `src/` (ver `REFACTORING.md`):
  - `src/constants/config.ts` — fuente única de `API_CONFIG` (baseURL por plataforma: `localhost` en iOS, IP LAN `192.168.1.9` en Android — ajustar a la IP local de la máquina), endpoints, `COLORS` y reglas de validación.
  - `src/api/apiClient.ts` — instancia Axios que inyecta `Authorization: Bearer <token>` desde AsyncStorage (clave `TOKEN_STORAGE_KEY`, que `useAuth` guarda al hacer login y borra en logout) y muestra `Alert` globales para errores de red/500; deja pasar 401 y 409 para que la pantalla los maneje.
  - `src/hooks/useAuth.ts` — login/registro/logout con validación y alertas.
  - `src/components/ui/` — componentes base (`Button`, `Input`, `Card`, `Header`, `Icon`, `Checkbox`) exportados desde `index.ts`. Usar estos y `COLORS` en vez de estilos ad hoc.
- `src/app.tsx` y `src/screens/LoginScreen.tsx` son restos anteriores a Expo Router; no están enrutados. Las carpetas raíz `components/`, `hooks/`, `constants/` son del template de Expo (tema claro/oscuro) y la app actual usa principalmente `src/`.
- Las rutas se importan con paths relativos (`../src/...`); existe el alias `@/*` → raíz del frontend.

## Desajustes conocidos entre frontend y backend

Tenerlos en cuenta al tocar cualquiera de los dos lados:

- El registro del frontend envía `phone` y `dateOfBirth` (formato `DD/MM/AAAA`), mientras que el backend espera `birthDate` en ISO y no conoce `phone`; además el backend no devuelve `token` al registrar.
- Las reglas de contraseña difieren (frontend `minPasswordLength: 6`; backend mínimo 8 con mayúscula, minúscula y número).
