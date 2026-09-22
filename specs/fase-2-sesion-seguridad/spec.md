# Spec F2 — Sesión y seguridad

| Campo | Valor |
|---|---|
| Fase | 2 |
| Estado | Borrador |
| Fecha | 2026-09-19 |
| Depende de | Fase 1 (contrato de API, `AppError`, `validate`) |
| Issues relacionados | Prepara #14 y #15 (perfil), #16 (notificaciones) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia | Impacto |
|---|---|---|
| H2.1 La sesión muere sin aviso | El JWT dura 1 h, no hay forma de renovarlo y la app no reacciona a un 401. | Tras una hora todo falla; el paciente no sabe que debe volver a entrar. |
| H2.2 No se restaura la sesión | Al abrir la app no se revisa el token guardado; `app/index.tsx` siempre muestra el login. | Hay que iniciar sesión cada vez que se abre la app. |
| H2.3 Rutas sin protección | Nada impide navegar a `/home` o `/modals/add-glucose` sin sesión. | Pantallas que fallan con 401 en lugar de redirigir al login. |
| H2.4 Cerrar sesión no invalida nada | `logout` solo borra el token local; el token sigue siendo válido en el servidor hasta que expira. | Un token robado no se puede revocar. |
| H2.5 Sin límite de intentos | `/auth/login` y `/auth/register` aceptan peticiones ilimitadas. | Ataques de fuerza bruta y creación masiva de cuentas. |
| H2.6 Revelación de cuentas | `GET /auth/check-email` es público y dice si un correo existe (la app no lo usa). | En una app de salud revela quién es paciente (principio P1). |
| H2.7 Diferencia de tiempos en el login | `bcrypt.compare` solo se ejecuta si el usuario existe. | Midiendo el tiempo se sabe si un correo está registrado. |
| H2.8 Token en almacenamiento sin cifrar | El token se guarda en `AsyncStorage`. | En un dispositivo comprometido el token se lee en texto plano. |
| H2.9 Contraseñas modificadas | `useAuth` aplica `trim()` a la contraseña antes de enviarla. | Una contraseña con espacios al inicio o final se guarda distinta de lo que escribió el usuario. |
| H2.10 `lastLoginAt` nunca se actualiza | Existe en `User` pero ningún código lo escribe. | Métricas de uso (RNF007 del proyecto) sin datos. |
| H2.11 Sin cabeceras de seguridad HTTP | No hay `helmet` ni equivalente. | Configuración por defecto de Express (`X-Powered-By`, sin `nosniff`…). |

## 2. Objetivo

Que el paciente **inicie sesión una vez y siga dentro** de forma segura mientras use la app, que **cerrar sesión la invalide de verdad**, y que la API resista los abusos básicos sin revelar quién está registrado.

## 3. Alcance

**Incluye:** H2.1 a H2.11.

**No incluye:**
- Recuperar contraseña ("¿Olvidaste tu contraseña?"), verificación de correo, cambio de contraseña, 2FA, login con Google/Apple: specs propias en el futuro.
- Ver y cerrar sesiones abiertas en otros dispositivos (el modelo de datos lo permitirá, pero sin pantalla).
- Reorganizar las pantallas en carpetas por funcionalidad (fase 3). Esta fase solo crea los grupos de rutas necesarios para protegerlas.

## 4. Historias de usuario

- **HU-2.1** Como paciente, quiero seguir con la sesión iniciada al volver a abrir la app, para registrar mi glucosa en segundos.
- **HU-2.2** Como paciente, quiero que la app renueve mi sesión sin que me dé cuenta mientras la uso.
- **HU-2.3** Como paciente, si mi sesión caduca de verdad, quiero volver al login con un mensaje claro, no ver errores sueltos.
- **HU-2.4** Como paciente, quiero que al cerrar sesión nadie pueda seguir usando mi sesión en este dispositivo.
- **HU-2.5** Como responsable de seguridad, quiero limitar los intentos de login y registro.
- **HU-2.6** Como paciente, quiero que nadie pueda averiguar si tengo cuenta en DiabetApp.

## 5. Requisitos funcionales

### Modelo de sesión (backend)

| ID | Requisito | HU |
|---|---|---|
| RF-2.1 | Login y registro DEBEN devolver un **token de acceso** de vida corta (15 min) y un **token de renovación** de vida larga (30 días), además del usuario: `{ user, accessToken, refreshToken, requiresOnboarding }`. | HU-2.1 |
| RF-2.2 | El token de renovación DEBE ser un valor aleatorio opaco (no un JWT). El servidor DEBE guardar solo su hash, nunca el valor. | HU-2.4 |
| RF-2.3 | `POST /api/auth/refresh` con `{ refreshToken }` DEBE devolver un par nuevo `{ accessToken, refreshToken }` e invalidar el token de renovación usado (**rotación**). | HU-2.2 |
| RF-2.4 | Si se presenta un token de renovación **ya usado o revocado**, el servidor DEBE revocar todos los tokens de renovación de esa cadena de sesión y responder 401 `UNAUTHENTICATED` (detección de reutilización). | HU-2.4 |
| RF-2.5 | Refrescar DEBE fallar con 401 `UNAUTHENTICATED` si el token de renovación está expirado o si el usuario está inactivo. | HU-2.3 |
| RF-2.6 | `POST /api/auth/logout` con `{ refreshToken }` DEBE revocar ese token de renovación y responder 200 aunque el token ya no fuera válido (operación idempotente). | HU-2.4 |
| RF-2.7 | DEBE existir `GET /api/auth/me` (autenticado) que devuelva el usuario actual. `GET /api/auth/verify-token` DEBE eliminarse. | HU-2.1 |
| RF-2.8 | El login exitoso DEBE actualizar `lastLoginAt`. | — |

### Protección de la API

| ID | Requisito | HU |
|---|---|---|
| RF-2.9 | `GET /api/auth/check-email` DEBE eliminarse. | HU-2.6 |
| RF-2.10 | El login DEBE tardar lo mismo (misma operación de hash) exista o no el correo. | HU-2.6 |
| RF-2.11 | El registro con un correo ya existente DEBE seguir respondiendo `EMAIL_IN_USE` (decisión de usabilidad; ver §8). | HU-2.6 |
| RF-2.12 | Límites de peticiones, respondiendo 429 `RATE_LIMITED` (nuevo código del catálogo) con cabecera `Retry-After`: **login** 5 intentos fallidos por combinación IP + correo cada 15 min; **registro** 5 por IP cada hora; **refresh** 30 por IP cada 15 min. | HU-2.5 |
| RF-2.13 | La API DEBE enviar cabeceras de seguridad estándar y NO DEBE enviar `X-Powered-By`. | — |
| RF-2.14 | El cuerpo JSON DEBE limitarse a 100 KB; uno mayor DEBE responder 413 `PAYLOAD_TOO_LARGE` (nuevo código del catálogo). | — |

### App móvil

| ID | Requisito | HU |
|---|---|---|
| RF-2.15 | Los tokens DEBEN guardarse en el almacenamiento seguro del sistema (Keychain en iOS, Keystore en Android), no en `AsyncStorage`. | HU-2.4 |
| RF-2.16 | Al abrir la app, mientras se comprueba la sesión, DEBE mostrarse la pantalla de carga (splash); después, la pantalla principal si hay sesión válida o el login si no. | HU-2.1 |
| RF-2.17 | Toda la app DEBE conocer en un único lugar el estado de sesión (`cargando`, `autenticado` con su usuario, `no autenticado`). | HU-2.1 |
| RF-2.18 | Las pantallas privadas DEBEN ser inaccesibles sin sesión (redirigen al login) y las de login/registro inaccesibles con sesión (redirigen a la principal). | HU-2.1 |
| RF-2.19 | Si una petición recibe `TOKEN_EXPIRED`, la app DEBE renovar el token **una sola vez** aunque haya varias peticiones en curso, y repetirlas con el token nuevo sin que el usuario lo note. | HU-2.2 |
| RF-2.20 | Si la renovación falla, la app DEBE borrar la sesión, llevar al login y mostrar "Tu sesión expiró. Inicia sesión de nuevo." una sola vez. | HU-2.3 |
| RF-2.21 | DEBE existir una acción visible de "Cerrar sesión" en la pantalla principal, que llame a `logout`, borre los tokens y lleve al login. Si el servidor no responde, DEBE cerrar la sesión local igualmente. | HU-2.4 |
| RF-2.22 | La app NO DEBE modificar la contraseña escrita (sin `trim`). | — |
| RF-2.23 | Ante 429 `RATE_LIMITED`, la app DEBE mostrar "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." | HU-2.5 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-2.1 | Ningún token (acceso o renovación) DEBE aparecer en logs del servidor ni de la app. |
| RNF-2.2 | La diferencia de tiempo medio del login entre "correo existe" y "correo no existe" DEBE ser < 10 % (100 intentos de cada). |
| RNF-2.3 | Abrir la app con sesión válida DEBE llevar a la pantalla principal en < 1,5 s en un dispositivo de gama media con el backend en la red local. |
| RNF-2.4 | Los límites de RF-2.12 DEBEN ser configurables por variable de entorno, con los valores de la spec por defecto. |
| RNF-2.5 | Si el backend está detrás de un proxy (Render, Railway, Nginx), la IP usada en los límites DEBE ser la del cliente, configurable por entorno. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-2.1 | Credenciales válidas | `POST /auth/login` | 200 con `accessToken` (expira en 15 min), `refreshToken` y `user`; `lastLoginAt` actualizado | RF-2.1, RF-2.8 |
| CA-2.2 | Un login correcto | Se revisa la tabla de tokens | Existe una fila con el **hash**; el valor devuelto no aparece en la BD | RF-2.2 |
| CA-2.3 | Un `refreshToken` válido R1 | `POST /auth/refresh` | 200 con un par nuevo (R2); volver a usar R1 → 401 **y** R2 también queda revocado | RF-2.3, RF-2.4 |
| CA-2.4 | Un `refreshToken` de un usuario desactivado o expirado | `POST /auth/refresh` | 401 `UNAUTHENTICATED` | RF-2.5 |
| CA-2.5 | Una sesión activa | `POST /auth/logout` y después `POST /auth/refresh` con el mismo token | Logout 200; refresh 401. Repetir el logout → 200 | RF-2.6 |
| CA-2.6 | Un `accessToken` válido | `GET /auth/me` | 200 con el usuario; `GET /auth/verify-token` → 404 | RF-2.7 |
| CA-2.7 | — | `GET /auth/check-email?email=x` | 404 | RF-2.9 |
| CA-2.8 | 100 logins con correo inexistente y 100 con correo existente + contraseña incorrecta | Se mide el tiempo medio | Diferencia < 10 % | RF-2.10, RNF-2.2 |
| CA-2.9 | 5 logins fallidos seguidos para `a@b.com` desde la misma IP | 6.º intento (aunque la contraseña sea correcta) | 429 `RATE_LIMITED` con `Retry-After`; otro correo desde la misma IP sigue pudiendo intentarlo | RF-2.12 |
| CA-2.10 | 5 registros desde una IP en una hora | 6.º registro | 429 `RATE_LIMITED` | RF-2.12 |
| CA-2.11 | Cualquier respuesta de la API | Se inspeccionan las cabeceras | Sin `X-Powered-By`; con `X-Content-Type-Options: nosniff` | RF-2.13 |
| CA-2.12 | Un body JSON de 200 KB | Cualquier `POST` | 413 `PAYLOAD_TOO_LARGE` | RF-2.14 |
| CA-2.13 | Sesión iniciada | Se cierra la app por completo y se vuelve a abrir | Aparece el splash y luego la pantalla principal, sin pasar por el login | RF-2.15, RF-2.16 |
| CA-2.14 | Sin sesión | Se abre un enlace profundo a la pantalla de glucosa | Se muestra el login | RF-2.18 |
| CA-2.15 | Sesión iniciada | Se intenta volver al login con "atrás" | No es posible; se queda en la app | RF-2.18 |
| CA-2.16 | Un `accessToken` expirado y 3 peticiones lanzadas a la vez | La app las ejecuta | Se hace **una** llamada a `/auth/refresh` y las 3 peticiones terminan bien | RF-2.19 |
| CA-2.17 | Un `refreshToken` revocado en el servidor | La app hace una petición | Vuelve al login con el mensaje de sesión expirada, mostrado una vez | RF-2.20 |
| CA-2.18 | Sesión iniciada y backend apagado | Pulsar "Cerrar sesión" | Se vuelve al login y los tokens del dispositivo se han borrado | RF-2.21 |
| CA-2.19 | Una cuenta registrada con la contraseña `" Abcdef12 "` (con espacios) | Login con la misma contraseña | Funciona; con `"Abcdef12"` sin espacios, falla | RF-2.22 |
| CA-2.20 | Revisión del código de la app y del backend | Se buscan tokens en `console.log` / logs | No aparecen | RNF-2.1 |

## 8. Decisiones

- **Resuelta (2026-09-19):** se aprueba el modelo con **token de acceso corto + token de renovación rotativo** (RF-2.1 a RF-2.6), por ser el estándar en apps de salud y permitir revocar sesiones de verdad.
- **Resuelta (2026-09-19):** duraciones aprobadas: token de acceso **15 min**, token de renovación **30 días**.
- **Decisión tomada (RF-2.11):** el registro seguirá diciendo "correo ya registrado". Ocultarlo exigiría verificación por correo (fuera de alcance). El límite de registros (RF-2.12) reduce su abuso. Revisar cuando exista verificación de correo.

## 9. Definición de terminado

- CA-2.1 … CA-2.20 verificados y marcados en el PR.
- `CLAUDE.md` actualizado (flujo de sesión, grupos de rutas, almacenamiento seguro).
- Estado `Implementada` en [specs/README.md](../README.md).
