# Plan técnico F2 — Sesión y seguridad

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

> Este plan asume aprobado el modelo con token de renovación (§8 de la spec). Si se elige la alternativa de un único JWT, se eliminan D-2.1 a D-2.3 y las tareas del bloque A.

## 1. Decisiones — Backend

### D-2.1 Tabla de tokens de renovación

```prisma
model RefreshToken {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash    String    @unique          // SHA-256 del token, en hex        RF-2.2
  familyId     String                     // cadena de sesión (un login = una familia)
  expiresAt    DateTime
  revokedAt    DateTime?
  replacedById String?                    // token que lo sustituyó al rotar
  createdAt    DateTime  @default(now())

  @@index([userId])
  @@index([familyId])
  @@map("refresh_tokens")
}
```

- Valor del token: `crypto.randomBytes(32).toString('base64url')` (256 bits).
- Hash: **SHA-256** (no bcrypt): el token ya tiene entropía máxima, no necesita un hash lento, y se busca por igualdad.
- Limpieza: en cada login se borran los tokens del usuario con `expiresAt < now()`. No se necesita tarea programada.

### D-2.2 Token de acceso

- JWT HS256 firmado con `env.JWT_SECRET`, `expiresIn: env.ACCESS_TOKEN_TTL` (por defecto `15m`).
- Payload: `{ sub: userId }`. Se **quita el `email`** del payload: un JWT se lee sin la clave y no debe llevar datos personales (P1).
- `authenticate` lee `sub` y deja `req.user = { id }`.

### D-2.3 Rotación y detección de reutilización (`AuthService.refresh`)

Todo dentro de `prisma.$transaction`:

```
1. buscar RefreshToken por tokenHash = sha256(token)
2. no existe                     → UNAUTHENTICATED
3. revokedAt != null             → revocar TODA la familia (updateMany familyId) → UNAUTHENTICATED   (RF-2.4)
4. expiresAt < now               → UNAUTHENTICATED                                                   (RF-2.5)
5. user.isActive = false         → revocar familia → UNAUTHENTICATED                                 (RF-2.5)
6. crear token nuevo (misma familyId, expiresAt = now + REFRESH_TOKEN_TTL_DAYS)
7. marcar el actual: revokedAt = now, replacedById = nuevo.id
8. devolver { accessToken nuevo, refreshToken nuevo }
```

`logout(token)`: `updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: now } })` y siempre 200 (RF-2.6).

### D-2.4 Tiempos constantes en el login

Al arrancar se calcula una vez `DUMMY_HASH = bcrypt.hashSync(<cadena aleatoria>, 12)`. Si el usuario no existe **o** está inactivo, se ejecuta `bcrypt.compare(password, DUMMY_HASH)` y se lanza `INVALID_CREDENTIALS`. Así siempre hay exactamente una comparación bcrypt (RF-2.10).

### D-2.5 Límites de peticiones

- Librería: `express-rate-limit` (almacén en memoria: suficiente con una sola instancia del backend; si se escala a varias, cambiar a Redis — anotado como riesgo).
- `handler` lanza `AppError('RATE_LIMITED')`; la librería añade `Retry-After` (`standardHeaders: 'draft-7'`).
- Login: `keyGenerator = ip + ':' + email.toLowerCase()`, `skipSuccessfulRequests: true` (solo cuentan los fallos), `limit = env.RATE_LIMIT_LOGIN_MAX` (5), ventana 15 min.
- Registro: por IP, `env.RATE_LIMIT_REGISTER_MAX` (5) / 1 h.
- Refresh: por IP, `env.RATE_LIMIT_REFRESH_MAX` (30) / 15 min.
- `app.set('trust proxy', env.TRUST_PROXY)` (por defecto `false`; en Render/Railway `1`) (RNF-2.5).

### D-2.6 Cabeceras y tamaño del body

- `helmet()` con la configuración por defecto (quita `X-Powered-By`, añade `nosniff`, etc.).
- `express.json({ limit: '100kb' })`. El `errorHandler` traduce `err.type === 'entity.too.large'` a `AppError('PAYLOAD_TOO_LARGE')`.

### D-2.7 Cambios en el catálogo de errores y en `env`

| Nuevo `code` | HTTP |
|---|---|
| `RATE_LIMITED` | 429 |
| `PAYLOAD_TOO_LARGE` | 413 |

Nuevas variables (todas con valor por defecto): `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_TTL_DAYS=30`, `RATE_LIMIT_LOGIN_MAX=5`, `RATE_LIMIT_REGISTER_MAX=5`, `RATE_LIMIT_REFRESH_MAX=30`, `TRUST_PROXY=false`. Se añaden a `env.example`.

### D-2.8 Endpoints de `auth` tras la fase

| Método y ruta | Auth | Límite | Body | Respuesta `data` |
|---|---|---|---|---|
| `POST /api/auth/register` | No | registro | `registerSchema` | `{ user, accessToken, refreshToken, requiresOnboarding }` (201) |
| `POST /api/auth/login` | No | login | `loginSchema` | `{ user, accessToken, refreshToken, requiresOnboarding }` |
| `POST /api/auth/refresh` | No | refresh | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST /api/auth/logout` | No* | — | `{ refreshToken }` | `null` |
| `GET /api/auth/me` | Sí | — | — | `{ user }` |
| ~~`GET /api/auth/check-email`~~ | — | — | — | eliminado |
| ~~`GET /api/auth/verify-token`~~ | — | — | — | eliminado (sustituido por `/me`) |

\* `logout` no exige token de acceso: debe funcionar aunque haya expirado. Solo puede revocar el token de renovación que se le presenta.

## 2. Decisiones — App móvil

### D-2.9 Almacenamiento

`expo-secure-store` (instalar con `npx expo install expo-secure-store`). Módulo `src/session/tokenStorage.ts`:

```ts
getTokens(): Promise<{ accessToken, refreshToken } | null>
setTokens(tokens): Promise<void>
clearTokens(): Promise<void>
```

Guarda una copia en memoria para no leer SecureStore en cada petición. Al arrancar borra la clave antigua `userToken` de `AsyncStorage`.

### D-2.10 Estado de sesión con Context

`src/session/AuthProvider.tsx` expone `useSession()`:

```ts
type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' };

signIn(email, password): Promise<void>
signUp(data): Promise<void>
signOut(): Promise<void>
```

- La lógica de red de `useAuth.ts` pasa aquí; `useAuth` desaparece (las pantallas usan `useSession`).
- Arranque: `getTokens()` → si no hay, `unauthenticated`; si hay, `GET /auth/me` (el interceptor renueva si hace falta) → `authenticated`; si falla con `UNAUTHENTICATED`, `clearTokens()` → `unauthenticated`. Un error de red con tokens guardados deja `authenticated` con el último usuario conocido (guardado junto a los tokens) para no expulsar al paciente sin conexión.

### D-2.11 Rutas protegidas (Expo Router v5)

```
app/
├── _layout.tsx            # <AuthProvider> + SplashScreen + Stack con Stack.Protected
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx          # antes app/index.tsx
│   └── register.tsx       # antes app/register.tsx
└── (app)/
    ├── _layout.tsx
    ├── index.tsx          # antes app/home.tsx (+ botón "Cerrar sesión")
    └── glucose/
        └── new.tsx        # antes app/modals/add-glucose.tsx (presentation: 'modal')
```

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={session.status === 'authenticated'}>
    <Stack.Screen name="(app)" />
  </Stack.Protected>
  <Stack.Protected guard={session.status === 'unauthenticated'}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>
</Stack>
```

`SplashScreen.preventAutoHideAsync()` al cargar el módulo y `SplashScreen.hideAsync()` cuando `status !== 'loading'` (RF-2.16). Las pantallas ya no navegan tras login/registro: el cambio de estado de sesión mueve al usuario solo.

### D-2.12 Renovación en el cliente HTTP (una sola vez)

En `apiClient.ts`:

```ts
let refreshing: Promise<string> | null = null;

// interceptor de respuesta
if (code === 'TOKEN_EXPIRED' && !config._retry && !isAuthEndpoint(config.url)) {
  config._retry = true;
  refreshing ??= doRefresh().finally(() => { refreshing = null; });
  const newAccessToken = await refreshing;          // todas las peticiones esperan la misma promesa
  config.headers.Authorization = `Bearer ${newAccessToken}`;
  return apiClient(config);
}
```

- `doRefresh()` usa una instancia de axios **sin interceptores** (evita bucles), guarda el par nuevo con `setTokens`.
- Si `doRefresh()` falla → llama a `onSessionExpired()`, un callback que registra el `AuthProvider` (evita la dependencia circular `apiClient` ↔ `AuthProvider`). El provider borra tokens, pasa a `unauthenticated` y muestra la alerta de RF-2.20 con una bandera para no repetirla.

### D-2.13 Otros cambios en la app

- Quitar `trim()` de las contraseñas en login y registro (RF-2.22). El correo sí se sigue normalizando.
- `RATE_LIMITED` → mensaje de RF-2.23 en login y registro.

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-2.1 – CA-2.7, CA-2.9 – CA-2.12 | Nuevas peticiones en `requests.http`; consultas a `refresh_tokens` con `psql`. Para expiraciones, arrancar con `ACCESS_TOKEN_TTL=10s`. |
| CA-2.8 | Script local `scripts/timing-login.ts` (100 + 100 peticiones, media y diferencia). |
| CA-2.13 – CA-2.19 | Expo Go en un dispositivo; para CA-2.16 usar `ACCESS_TOKEN_TTL=10s` y la pantalla principal lanzando 3 peticiones; para CA-2.17 revocar el token con `psql`. |
| CA-2.20 | `grep -rn "console.log" diabetapp-backend/src diabetapp-frontend/src diabetapp-frontend/app` y revisar cada aparición. |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| Dos renovaciones simultáneas con el mismo token (p. ej. dos pestañas o un reintento de red) disparan la detección de reutilización y cierran la sesión | La app garantiza una sola renovación en curso (D-2.12). Si en la práctica ocurre, añadir un periodo de gracia de 10 s en el que el token recién rotado devuelve el mismo par (cambio de spec). |
| `express-rate-limit` en memoria no funciona con varias instancias | Anotado; al desplegar más de una instancia, usar `rate-limit-redis`. |
| Cambio de nombre `token` → `accessToken` rompe versiones antiguas de la app | La app aún no está publicada; backend y app se actualizan en el mismo PR. |
| `Stack.Protected` requiere Expo Router ≥ 5 | El proyecto usa `expo-router ^5.1.4` (SDK 53). Verificar antes de empezar (T2.14). |
| SecureStore limita cada valor a ~2 KB | Los tokens ocupan < 300 bytes; el usuario guardado se limita a `id`, `email`, `firstName`, `lastName`, `onboardingCompleted`. |
