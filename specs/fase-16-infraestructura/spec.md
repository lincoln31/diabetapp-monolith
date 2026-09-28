# Spec F16 — Infraestructura y despliegue del backend

| Campo | Valor |
|---|---|
| Fase | 16 |
| Estado | Implementada |
| Fecha | 2026-09-27 |
| Depende de | Fase 1 (config de entorno), Fase 2 (`TRUST_PROXY`, CORS), Fase 4 (CI, `prisma migrate deploy`) |
| Issues relacionados | Ninguno |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

Todo lo construido hasta la fase 15 corre **solo en local**: PostgreSQL en Docker, backend con `npm run dev`, y el celular habla con el PC por la misma red WiFi (`make up`). No hay ningún componente accesible fuera de esa red. Esto es correcto para desarrollar, pero significa que:

- Si el celular sale de la WiFi del PC, la app deja de funcionar (no hay backend que contactar).
- El PC tiene que estar encendido, con Docker y `make up` corriendo, para que la app sirva de algo.
- No hay ningún ambiente de "producción" real, ni siquiera modesto, contra el cual probar la app de forma parecida a como la usaría alguien más.

El proyecto es de una sola persona (dev), sin usuarios más allá de quien lo prueba, y sin presupuesto asignado a hosting (§8, decisión resuelta). El objetivo de esta fase **no** es lanzar la app al público, sino tener un backend real, accesible desde cualquier red, con el menor costo y complejidad posibles.

## 2. Objetivo

Tener el backend de DiabetApp corriendo en un servicio de hosting gratuito, con su base de datos PostgreSQL administrada (no en el PC), desplegado automáticamente al fusionar a `main`, de modo que la app pueda usarse desde el celular con datos móviles o cualquier WiFi, sin depender del PC.

## 3. Alcance

**Incluye:**
- Elegir y documentar el proveedor de hosting del backend y de la base de datos (§8).
- Preparar el repo para ese despliegue: comandos de build/start, variables de entorno de producción, migraciones automáticas, CORS y `TRUST_PROXY` para el dominio real de la app.
- Configurar el despliegue automático desde GitHub (al fusionar a `main`, o a una rama `production` — ver §8).
- Runbook manual (`specs/fase-16-infraestructura/plan.md`, §"Pasos manuales") para las partes que requieren crear cuentas o hacer clic en un panel: eso no lo puede hacer el asistente por el usuario.
- Apuntar el frontend (`EXPO_PUBLIC_API_URL`) al backend desplegado como alternativa a la IP local, sin romper `make up` (que sigue siendo el flujo de desarrollo diario).

**No incluye (fuera de esta fase):**
- Distribución de la app (Play Store, EAS Build, firma, política de privacidad): el usuario decidió mantener la development build instalada por USB/ADB por ahora (§8). Queda para una fase futura si cambia.
- Dominio propio, HTTPS personalizado más allá del que da el proveedor gratis, CDN, monitoreo/alertas, backups más allá de los que el proveedor haga por defecto.
- Migrar a un plan pago o a otro proveedor (Railway, un VPS): queda anotado como camino de salida si el plan gratuito se queda corto (§8), pero no se implementa ahora.
- Multiinquilino, escalado horizontal, colas de trabajo: no aplican a un backend de un solo usuario.

## 4. Historias de usuario

- **HU-16.1** Como desarrollador, quiero que el backend esté accesible desde internet, para poder usar la app desde cualquier red, no solo la WiFi del PC.
- **HU-16.2** Como desarrollador, quiero que un `git push` a `main` despliegue el backend solo, sin pasos manuales, para no tener que acordarme de subir nada a mano.
- **HU-16.3** Como desarrollador, quiero poder elegir en tiempo de arranque de la app si habla con mi PC local o con el backend desplegado, para seguir desarrollando local sin perder la opción de probar contra el real.
- **HU-16.4** Como desarrollador, quiero que ningún secreto de producción (`JWT_SECRET`, contraseña de la base de datos) quede en el repo, ni siquiera en un archivo de ejemplo con un valor real.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-16.1 | El backend DEBE quedar desplegado en un servicio de hosting con una URL pública HTTPS, sirviendo `/api/*` igual que en local. | HU-16.1 |
| RF-16.2 | La base de datos de producción DEBE ser PostgreSQL administrado (no SQLite ni un contenedor casero), con una `DATABASE_URL` propia, distinta de la de desarrollo y de tests. | HU-16.1 |
| RF-16.3 | El despliegue DEBE ejecutar `npx prisma migrate deploy` antes de arrancar el servidor, para que el esquema de producción quede al día con cada versión. | HU-16.1, HU-16.2 |
| RF-16.4 | Un push a la rama de despliegue (`main`, ver D-16.4 en el plan) DEBE disparar un nuevo despliegue sin intervención manual. | HU-16.2 |
| RF-16.5 | `CORS_ORIGIN` en producción DEBE restringirse a los orígenes reales de la app (no `*`), y `TRUST_PROXY` DEBE activarse (el proveedor entrega la IP del cliente por proxy). | HU-16.1 |
| RF-16.6 | `JWT_SECRET`, `DATABASE_URL` y el resto de variables sensibles DEBEN configurarse solo en el panel del proveedor de hosting, nunca en un commit. | HU-16.4 |
| RF-16.7 | `diabetapp-frontend/.env` DEBE poder apuntar `EXPO_PUBLIC_API_URL` a la URL pública del backend como alternativa a la IP local, documentado en `CLAUDE.md`. | HU-16.3 |
| RF-16.8 | El backend desplegado DEBE responder `GET /api/health` con éxito antes de considerarse verificado. | HU-16.1 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-16.1 | Costo mensual: **$0** (plan gratuito del proveedor elegido). Cualquier cambio a un plan pago requiere una decisión explícita nueva, no se activa por accidente (sin tarjeta cargada donde el proveedor lo permita). |
| RNF-16.2 | El plan gratuito puede tener latencia de arranque en frío (`cold start`) tras inactividad: es un trade-off aceptado (RNF-16.1), no un bug a corregir en esta fase. |
| RNF-16.3 | El flujo de desarrollo local (`make up`, Docker, `.env`) NO se modifica: el backend desplegado es una alternativa, no un reemplazo. |
| RNF-16.4 | Toda la configuración del despliegue que pueda vivir en el repo (build/start command, versión de Node, migraciones) vive en el repo, versionada; solo los secretos viven fuera. |
| RNF-16.5 | Cumple P1 y P8 de la [constitución](../constitucion.md): sin secretos versionados, sin infraestructura que el proyecto no necesite todavía (sin Kubernetes, sin colas, sin CDN). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-16.1 | El backend desplegado | Se hace `GET https://<url-del-backend>/api/health` desde cualquier red (datos móviles, otra WiFi) | Responde `200` con el cuerpo esperado | RF-16.1, RF-16.8 |
| CA-16.2 | Un usuario registrado en la base de datos de producción | Se hace login contra la URL pública | Responde `200` con `accessToken`/`refreshToken`, igual que en local | RF-16.1, RF-16.2 |
| CA-16.3 | Un cambio en `diabetapp-backend/` fusionado a `main` | Pasan unos minutos | El backend desplegado sirve el código nuevo, sin pasos manuales | RF-16.3, RF-16.4 |
| CA-16.4 | Una migración nueva de Prisma en el commit desplegado | Se revisa el esquema de la base de producción | Coincide con `schema.prisma` de esa versión | RF-16.3 |
| CA-16.5 | El repo público en GitHub | Se busca `JWT_SECRET`, contraseñas o `DATABASE_URL` reales en el historial | No aparece ninguno (solo `env.example` con valores ficticios) | RF-16.6 |
| CA-16.6 | `diabetapp-frontend/.env` con `EXPO_PUBLIC_API_URL` apuntando a la URL pública | Se ejecuta `npm start` y se abre la app (Expo Go o development build, sin `make up`) | La app funciona contra el backend desplegado | RF-16.7 |
| CA-16.7 | Una petición desde el dominio de la app | Se revisan las cabeceras de respuesta | `Access-Control-Allow-Origin` refleja el origen configurado, no `*` | RF-16.5 |

## 8. Decisiones

- **Resuelta (2026-09-27):** presupuesto **$0/mes**. Se acepta el *cold start* del plan gratuito como trade-off consciente (RNF-16.2), no como algo a optimizar ahora.
- **Resuelta (2026-09-27):** la distribución de la app (Play Store, EAS Build) **queda fuera de esta fase**; sigue instalándose la development build por USB/ADB. Se retoma en una fase futura si hace falta compartir la app con más gente.
- **Resuelta (2026-09-27):** proveedor de hosting del backend: **Render** (plan gratuito, "Web Service"), por integrarse directo con GitHub (despliegue automático sin escribir un *pipeline* propio) y no pedir tarjeta para el plan gratuito.
- **Resuelta (2026-09-27):** proveedor de la base de datos: **Neon** (Postgres administrado, plan gratuito **sin fecha de expiración**, a diferencia del Postgres gratuito de Render que expira). Compatible con Prisma sin cambios (misma `DATABASE_URL`).
- **`[NECESITA ACLARACIÓN]` → resuelta en el plan:** rama que dispara el despliegue. Ver D-16.4 en `plan.md`.
- **Camino de salida (no implementado ahora):** si el *cold start* o los límites del plan gratuito estorban de verdad, migrar el mismo backend a Railway (~$5/mes) es un cambio de proveedor, no de código: las variables de entorno y `prisma migrate deploy` son iguales.

## 9. Definición de terminado

- CA-16.1 … CA-16.7 verificados.
- `CLAUDE.md` documenta la URL del backend desplegado (o dónde encontrarla), cómo apuntar el frontend a producción, y las particularidades del proveedor elegido.
- `specs/README.md` marca la fase 16 como `Implementada`.
