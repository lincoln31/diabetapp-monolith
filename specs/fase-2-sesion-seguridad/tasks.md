# Tareas F2 — Sesión y seguridad

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-2-sesion-seguridad`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [x] **T2.1** Resolver las aclaraciones de la spec (§8: modelo de sesión y duraciones) y anotarlas.

## Bloque A — Tokens de renovación (backend)

- [x] **T2.2** Modelo `RefreshToken` en `schema.prisma` + migración `add_refresh_tokens`. — RF-2.2 · depende de T2.1
- [x] **T2.3** Nuevas variables en `env.ts` y `env.example` (TTL, límites, `TRUST_PROXY`). — RNF-2.4, RNF-2.5
- [x] **T2.4** Utilidades de tokens: `generateRefreshToken()`, `hashToken()`, `signAccessToken(userId)` con payload `{ sub }`; adaptar `authenticate` a `sub`. — RF-2.1, RF-2.2 · depende de T2.3
- [x] **T2.5** `AuthService`: login y registro emiten el par de tokens y crean la familia; login actualiza `lastLoginAt` y limpia tokens expirados. — RF-2.1, RF-2.8 · depende de T2.2, T2.4
- [x] **T2.6** `AuthService.refresh` con rotación y detección de reutilización (plan D-2.3). — RF-2.3 – RF-2.5 · depende de T2.5
- [x] **T2.7** `AuthService.logout` idempotente. — RF-2.6 · depende de T2.5
- [x] **T2.8** Rutas `POST /refresh`, `POST /logout`, `GET /me`; eliminar `check-email` y `verify-token`. — RF-2.3, RF-2.6, RF-2.7, RF-2.9 · depende de T2.6, T2.7

## Bloque B — Protección de la API (backend)

- [x] **T2.9 [P]** Login con tiempo constante (`DUMMY_HASH`). — RF-2.10
- [x] **T2.10 [P]** `express-rate-limit` en login, registro y refresh; códigos `RATE_LIMITED` en el catálogo; `trust proxy`. — RF-2.12, RNF-2.5
- [x] **T2.11 [P]** `helmet()`, `express.json({ limit: '100kb' })` y `PAYLOAD_TOO_LARGE` en catálogo y `errorHandler`. — RF-2.13, RF-2.14
- [x] **T2.12** Revisar que ningún log imprima tokens ni correos. — RNF-2.1

## Bloque C — Sesión en la app

- [x] **T2.13** Instalar `expo-secure-store` y crear `src/session/tokenStorage.ts` (con copia en memoria y borrado de la clave antigua de `AsyncStorage`). — RF-2.15
- [x] **T2.14** Comprobar que la versión instalada de `expo-router` soporta `Stack.Protected`. — Riesgo del plan
- [x] **T2.15** `src/session/AuthProvider.tsx` con `useSession()`, `signIn`, `signUp`, `signOut` y arranque de sesión (D-2.10); borrar `useAuth.ts`. — RF-2.16, RF-2.17 · depende de T2.13
- [x] **T2.16** Renovación única en `apiClient.ts` + callback `onSessionExpired` (D-2.12). — RF-2.19, RF-2.20 · depende de T2.15
- [x] **T2.17** Reorganizar rutas en `(auth)` y `(app)` con `Stack.Protected` y splash (D-2.11); quitar la navegación manual tras login y registro. — RF-2.16, RF-2.18 · depende de T2.14, T2.15
- [x] **T2.18** Botón "Cerrar sesión" en la pantalla principal. — RF-2.21 · depende de T2.17
- [x] **T2.19 [P]** Quitar `trim()` de contraseñas; mensaje para `RATE_LIMITED`. — RF-2.22, RF-2.23

## Bloque D — Verificación y cierre

- [x] **T2.20** Añadir a `requests.http` las peticiones de CA-2.1 – CA-2.12.
- [x] **T2.21** Script `scripts/timing-login.ts` y medir CA-2.8.
- [ ] **T2.22** ⏳ (requiere dispositivo) Probar CA-2.13 – CA-2.19 en dispositivo con `ACCESS_TOKEN_TTL=10s`.
- [~] **T2.23** (parcial: falta marcar CA-2.13 a CA-2.19) Marcar CA-2.1 … CA-2.20 en el PR; actualizar `CLAUDE.md` y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF          | Tareas                            | CA               |
| ----------------- | --------------------------------- | ---------------- |
| RF-2.1, RF-2.2    | T2.2, T2.4, T2.5                  | CA-2.1, CA-2.2   |
| RF-2.3 – RF-2.5   | T2.6, T2.8                        | CA-2.3, CA-2.4   |
| RF-2.6            | T2.7, T2.8                        | CA-2.5           |
| RF-2.7            | T2.8                              | CA-2.6           |
| RF-2.8            | T2.5                              | CA-2.1           |
| RF-2.9            | T2.8                              | CA-2.7           |
| RF-2.10           | T2.9                              | CA-2.8           |
| RF-2.11           | — (se mantiene el comportamiento) | CA-1.2           |
| RF-2.12           | T2.10                             | CA-2.9, CA-2.10  |
| RF-2.13, RF-2.14  | T2.11                             | CA-2.11, CA-2.12 |
| RF-2.15 – RF-2.17 | T2.13, T2.15                      | CA-2.13          |
| RF-2.18           | T2.17                             | CA-2.14, CA-2.15 |
| RF-2.19, RF-2.20  | T2.16                             | CA-2.16, CA-2.17 |
| RF-2.21           | T2.18                             | CA-2.18          |
| RF-2.22, RF-2.23  | T2.19                             | CA-2.19          |
| RNF-2.1           | T2.12                             | CA-2.20          |
