# Plan técnico F3 — Arquitectura del frontend

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

> Este plan asume aprobados `react-hook-form` + `zod` (§8 de la spec). Si se rechaza, D-3.5 se sustituye por un hook propio `useForm` y el resto no cambia.

## 1. Decisiones

### D-3.1 Estructura por funcionalidades

```
diabetapp-frontend/
├── app/                                  # SOLO rutas (RF-3.3)
│   ├── _layout.tsx                       # AuthProvider + Stack.Protected (de la fase 2)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx                     # export { default } from '@/src/features/auth/screens/LoginScreen'
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── index.tsx                     # → features/home/screens/HomeScreen
│       └── glucose/new.tsx               # → features/glucose/screens/AddGlucoseScreen
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── index.ts                  # API pública: AuthProvider, useSession, tipos
│   │   │   ├── AuthProvider.tsx          # (de la fase 2)
│   │   │   ├── api.ts                    # authApi.login/register/refresh/logout/me
│   │   │   ├── schemas.ts                # loginSchema, registerSchema (zod)
│   │   │   ├── types.ts                  # User, AuthTokens
│   │   │   ├── components/               # piezas usadas solo por auth (si las hay)
│   │   │   └── screens/
│   │   │       ├── LoginScreen.tsx
│   │   │       └── RegisterScreen.tsx
│   │   ├── glucose/
│   │   │   ├── index.ts
│   │   │   ├── api.ts                    # glucoseApi.list/get/create/update/remove
│   │   │   ├── schemas.ts                # createGlucoseSchema
│   │   │   ├── types.ts                  # GlucoseReading, MomentOfDay, ListGlucoseParams
│   │   │   ├── constants.ts              # MOMENT_OF_DAY_OPTIONS (etiquetas en español)
│   │   │   └── screens/AddGlucoseScreen.tsx
│   │   └── home/
│   │       ├── index.ts
│   │       └── screens/HomeScreen.tsx
│   └── shared/
│       ├── api/
│       │   ├── client.ts                 # axios + token + renovación (fase 2); SIN alertas
│       │   ├── errors.ts                 # class ApiError { code, message, fields?, status? } + toApiError()
│       │   └── types.ts                  # ApiSuccess<T>, ApiErrorBody, Paginated<T>
│       ├── session/
│       │   └── tokenStorage.ts           # (de la fase 2) + registro de onSessionExpired
│       ├── components/ui/                # Button, Input, Card, Header, Icon, Checkbox, FormError
│       ├── config/
│       │   └── env.ts                    # API_URL desde EXPO_PUBLIC_API_URL (RF-3.14)
│       ├── theme/
│       │   └── colors.ts                 # COLORS (antes en constants/config.ts)
│       ├── forms/
│       │   └── applyServerErrors.ts      # ApiError.fields → setError de react-hook-form
│       └── utils/
│           ├── dates.ts                  # formatDateInput, dateOfBirthToISO
│           └── showError.ts              # muestra un ApiError una sola vez
└── .env.example                          # EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

**Reglas de dependencia (RF-3.1):**

```
app/  ──►  features/*/index.ts | features/*/screens/*
features/X  ──►  shared/*   y   features/Y/index.ts   (nunca features/Y/<interno>)
shared/  ──►  (nada de features/)
```

`tokenStorage` vive en `shared/session` (no en `features/auth`) porque lo necesita `shared/api/client.ts`, y `shared` no puede depender de `features`. El `AuthProvider` sí vive en `features/auth`.

La regla se hace cumplir con ESLint `import/no-restricted-paths` (incluido en `eslint-config-expo` vía `eslint-plugin-import`) (T3.19).

### D-3.2 Servicios tipados

```ts
// features/glucose/api.ts
export const glucoseApi = {
  list: (params: ListGlucoseParams) => get<Paginated<GlucoseReading>>('/glucose', { params }),
  create: (input: CreateGlucoseInput) => post<GlucoseReading>('/glucose', input),
  …
};
```

`shared/api/client.ts` exporta helpers `get/post/put/del<T>` que desenvuelven `response.data.data` (y `meta` en `Paginated<T>`) y convierten cualquier error con `toApiError()` antes de relanzarlo. Las pantallas nunca ven axios (RF-3.6). `API_CONFIG.endpoints` desaparece: cada `api.ts` conoce sus rutas.

### D-3.3 Un único tipo de error y política de alertas

```ts
class ApiError extends Error {
  code: ApiErrorCode | 'NETWORK_ERROR'; // códigos del catálogo de la fase 1/2
  fields?: { field: string; message: string }[];
  status?: number;
}
```

- `toApiError(err)`: respuesta con `error.code` → `ApiError` con esos datos; sin respuesta (red/timeout) → `NETWORK_ERROR`; cualquier otra cosa → `INTERNAL_ERROR`.
- El interceptor **no** muestra `Alert` (RF-3.9); solo renueva tokens (fase 2).
- En las pantallas: `VALIDATION_ERROR` con `fields` → `applyServerErrors(form, error)`; el resto → `FormError` bajo el botón (formularios) o `showError(error)` (acciones fuera de formularios).

### D-3.4 Tipos del contrato

Se escriben a mano en `features/*/types.ts` siguiendo la tabla de endpoints de la fase 1 y 2. `MomentOfDay` es una unión de literales con los mismos valores que el enum de Prisma. (Generar tipos desde el backend con OpenAPI queda fuera de alcance: no hay OpenAPI todavía.)

### D-3.5 Formularios con `react-hook-form` + `zod`

- Dependencias: `react-hook-form`, `@hookform/resolvers`, `zod` (misma versión mayor que el backend).
- `useForm({ resolver: zodResolver(registerSchema), mode: 'onSubmit', reValidateMode: 'onChange' })` → errores de todos los campos al enviar y se actualizan al corregir (RF-3.10).
- Cada `Input` se conecta con `<Controller>` y recibe `error={errors.email?.message}`.
- `formState.isSubmitting` deshabilita el botón (RF-3.13).
- Los esquemas reproducen las reglas del backend: contraseña 8+ con mayúscula, minúscula y número; teléfono opcional 10–20; fecha `DD/MM/YYYY` real, no futura y ≥ 13 años; glucosa entera 20–600; notas ≤ 200.
- `src/utils/validation.ts` desaparece: su lógica pasa a los esquemas; `formatDateInput` y `dateOfBirthToISO` a `shared/utils/dates.ts`.

### D-3.6 Configuración

```ts
// shared/config/env.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL)
  throw new Error(
    'Falta EXPO_PUBLIC_API_URL. Copia .env.example a .env y pon la IP de tu PC, p. ej. http://192.168.1.20:3000/api',
  );
export const env = { API_URL, API_TIMEOUT_MS: 10000 };
```

Expo inyecta las variables `EXPO_PUBLIC_*` en el bundle al arrancar `expo start` (hay que reiniciarlo tras cambiar `.env`). `.env` ya está ignorado por `.gitignore` (fase 0).

### D-3.7 Iconos

`@expo/vector-icons` (ya instalado, viene con Expo) con **Ionicons**. `Icon` acepta `name: AppIconName`, una unión de nombres semánticos mapeados a Ionicons:

| `AppIconName`     | Ionicons                          |
| ----------------- | --------------------------------- |
| `email`           | `mail-outline`                    |
| `lock`            | `lock-closed-outline`             |
| `eye` / `eye-off` | `eye-outline` / `eye-off-outline` |
| `user`            | `person-outline`                  |
| `phone`           | `call-outline`                    |
| `calendar`        | `calendar-outline`                |
| `clock`           | `time-outline`                    |
| `drop`            | `water-outline`                   |
| `notes`           | `document-text-outline`           |
| `logout`          | `log-out-outline`                 |

(La lista final sale de revisar los nombres usados hoy en `Icon.tsx`; T3.14.) Se desinstala `react-native-vector-icons`.

### D-3.8 Tipos de `Button`

Los arrays de estilo se tipan como `StyleProp<ViewStyle>[]` / `StyleProp<TextStyle>[]` y los accesos dinámicos (`styles[`${size}Text`]`) se sustituyen por mapas tipados (`SIZE_TEXT_STYLES[size]`).

### D-3.9 `app.json`

`"name": "DiabetApp"`, `"scheme": "diabetapp"`. `slug` no se cambia (identifica el proyecto en EAS; cambiarlo no aporta nada ahora).

## 2. Mapa de migración de archivos

| Origen                                                                                 | Destino                                                                                                                                       |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(auth)/login.tsx` (pantalla completa)                                             | `src/features/auth/screens/LoginScreen.tsx`                                                                                                   |
| `app/(auth)/register.tsx`                                                              | `src/features/auth/screens/RegisterScreen.tsx`                                                                                                |
| `app/(app)/index.tsx`                                                                  | `src/features/home/screens/HomeScreen.tsx`                                                                                                    |
| `app/(app)/glucose/new.tsx`                                                            | `src/features/glucose/screens/AddGlucoseScreen.tsx`                                                                                           |
| `src/session/AuthProvider.tsx`                                                         | `src/features/auth/AuthProvider.tsx`                                                                                                          |
| `src/session/tokenStorage.ts`                                                          | `src/shared/session/tokenStorage.ts`                                                                                                          |
| `src/api/apiClient.ts`                                                                 | `src/shared/api/client.ts` (+ `errors.ts`, `types.ts`)                                                                                        |
| `src/components/ui/*`                                                                  | `src/shared/components/ui/*`                                                                                                                  |
| `src/constants/config.ts`                                                              | `COLORS` → `shared/theme/colors.ts`; `API_CONFIG` → `shared/config/env.ts` + `features/*/api.ts`; `VALIDATION_CONFIG`/`APP_CONFIG` → esquemas |
| `src/utils/validation.ts`                                                              | `features/*/schemas.ts` + `shared/utils/dates.ts`                                                                                             |
| `components/`, `hooks/`, `constants/`, `scripts/` (raíz), `assets/images/*react-logo*` | Eliminados                                                                                                                                    |

Se mueven con `git mv` para conservar el historial de cada archivo.

## 3. Verificación

| CA                | Cómo                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| CA-3.1, CA-3.2    | Revisión de árbol (`git ls-files diabetapp-frontend`) y de `app/`.                            |
| CA-3.3, CA-3.4    | `grep -rn "shared/api/client\|axios" src/features/*/screens`; regla ESLint de D-3.1 en verde. |
| CA-3.5 – CA-3.10  | Expo Go en dispositivo (CA-3.9 con el backend apagado).                                       |
| CA-3.11, CA-3.12  | Arrancar sin `.env` y con `.env`, en Android e iOS (o un emulador de cada uno).               |
| CA-3.13 – CA-3.16 | Recorrido visual; `tsc`; `npm run lint`; build de desarrollo para ver el nombre.              |

## 4. Riesgos

| Riesgo                                            | Mitigación                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Mover muchos archivos rompe imports               | Un commit por funcionalidad; `tsc` tras cada uno.                 |
| La fase 2 aún no está fusionada al empezar        | La fase 3 depende de la 2; no empezar hasta tenerla en `Develop`. |
| `zod` en React Native aumenta el bundle           | ~15 KB gzip; aceptable. Se reutiliza en backend y app.            |
| Olvidar reiniciar `expo start` tras editar `.env` | Documentado en `CLAUDE.md` y en `.env.example`.                   |
