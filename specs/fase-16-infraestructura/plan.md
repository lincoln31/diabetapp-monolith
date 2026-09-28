# Plan F16 — Infraestructura y despliegue del backend

Implementa: [spec.md](spec.md)

## 1. Resumen técnico

```
GitHub (main) ──push──▶ Render (auto-deploy)
                              │
                    build: npm ci && npx prisma generate && npm run build
                    release: npx prisma migrate deploy
                    start:   node dist/server.js
                              │
                              ▼
                     DATABASE_URL ──▶ Neon (Postgres administrado)
```

- **Render** aloja el backend como *Web Service* (Node), con auto-deploy nativo desde GitHub: no hace falta un job de despliegue en `.github/workflows/ci.yml`, la CI sigue siendo solo verificación (lint/tipos/tests), y Render dispara su propio build al ver un push en `main` con los checks de GitHub en verde.
- **Neon** aloja PostgreSQL. Se elige sobre el Postgres gratuito de Render porque el de Render expira (hay que recrear la base y migrar los datos); el de Neon no.
- El proyecto se describe en `render.yaml` (Render "Blueprint"), versionado en el repo: reproducible, sin reconfigurar todo a mano si hay que recrear el servicio.

## 2. Archivos afectados

| Archivo | Cambio |
|---|---|
| `render.yaml` (nuevo, raíz del repo) | Blueprint de Render: servicio web, `rootDir: diabetapp-backend`, comandos de build/start, variables de entorno declaradas (sin valores secretos). |
| `diabetapp-backend/env.example` | Se agrega un comentario con los valores esperados en producción (`CORS_ORIGIN`, `TRUST_PROXY`) a modo de referencia, sin cambiar los valores de desarrollo. |
| `CLAUDE.md` | Nueva sección corta bajo "Comandos" o "Arquitectura del backend": URL de producción (o dónde encontrarla en el panel de Render), cómo apuntar el frontend con `EXPO_PUBLIC_API_URL`, y la particularidad del *cold start*. |
| `specs/README.md` | Fila de la fase 16 añadida al índice; estado `Implementada` al cerrar. |

No se toca `diabetapp-backend/src/**` (el `TRUST_PROXY` y el `CORS_ORIGIN` configurables ya existen desde la fase 2) ni `.github/workflows/ci.yml`.

## 3. Decisiones técnicas

- **D-16.1** — Render Web Service (no "Background Worker" ni "Static Site"): el backend expone HTTP.
- **D-16.2** — `render.yaml` en la raíz del monorepo con `rootDir: diabetapp-backend`, para que Render instale/compile solo ese paquete (no hay *workspaces*, cada proyecto tiene su propio `package.json`, tal como documenta `CLAUDE.md`).
- **D-16.3** (revisada al desplegar) — `preDeployCommand` **no existe en el plan gratuito de Render** (Render lo rechaza: "pre-deploy command is not supported for free tier services"; es una función de los planes pagos). La migración va entonces al inicio de `startCommand` (`npx prisma migrate deploy && npm start`): se pierde la garantía de "si falla, no se sustituye la versión anterior" (eso solo lo da `preDeployCommand`/`release`), pero `prisma migrate deploy` es **idempotente** — no hace nada si el esquema ya está al día —, así que correrlo en cada arranque (no solo en cada despliegue) es seguro. Si el plan pasara a uno pago (§8 de la spec, camino de salida), se puede volver a `preDeployCommand` sin más cambios.
- **D-16.4** (resuelve el `[NECESITA ACLARACIÓN]` de la spec) — el despliegue se dispara desde `main`, igual que el resto del proyecto (`specs/README.md` ya usa `main`/`Develop` como ramas de integración); no se crea una rama `production` aparte para no duplicar el flujo de PRs.
- **D-16.5** — `CORS_ORIGIN` en producción: como la app es Expo (React Native, no web), las peticiones no llevan `Origin` de navegador; se deja `CORS_ORIGIN` en su valor por defecto salvo que en el futuro haya una versión web. RF-16.5 se cumple igual porque `TRUST_PROXY=1` sí es indispensable (si no, `express-rate-limit` limitaría por la IP del proxy de Render, no la del celular).
- **D-16.6** — `JWT_SECRET` de producción: se genera con el script que ya existe (`npm run generate-secret`, backend) y se pega una sola vez en el panel de Render; nunca se guarda en un archivo.
- **D-16.7** — El frontend no cambia de código: `EXPO_PUBLIC_API_URL` ya es la única fuente de la URL de la API (`shared/config/env.ts`); apuntar a producción es cambiar `diabetapp-frontend/.env` y reiniciar `npm start`, exactamente como cualquier otro cambio de esa variable.

## 4. `render.yaml` (contenido de referencia)

```yaml
services:
  - type: web
    name: diabetapp-backend
    runtime: node
    plan: free
    rootDir: diabetapp-backend
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npx prisma migrate deploy && npm start
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: TRUST_PROXY
        value: "1"
      - key: JWT_SECRET
        sync: false        # se pega a mano en el panel; nunca en este archivo
      - key: DATABASE_URL
        sync: false        # ídem: URL de Neon con la contraseña incluida
```

`sync: false` es lo que le dice a Render "esta variable existe pero no la definas aquí": queda vacía en el blueprint y se completa una sola vez en el panel web, cumpliendo RF-16.6.

## 5. Pasos manuales (fuera del alcance del asistente)

Estos pasos requieren una cuenta y un navegador; el asistente los documenta y guía, pero los ejecuta el usuario:

1. Crear una cuenta en [neon.tech](https://neon.tech) (gratis, sin tarjeta) y un proyecto Postgres. Copiar la `DATABASE_URL` que da Neon (incluye usuario, contraseña y `?sslmode=require`).
2. Crear una cuenta en [render.com](https://render.com) (gratis, sin tarjeta) y conectarla con el repositorio de GitHub.
3. En Render, "New Blueprint" apuntando a este repo: detecta `render.yaml` solo.
4. En el panel del servicio creado, pegar `DATABASE_URL` (de Neon) y `JWT_SECRET` (generado con `npm run generate-secret`) en las variables marcadas `sync: false`.
5. Esperar el primer despliegue y verificar `GET https://<url-que-da-render>/api/health` (CA-16.1).
6. Copiar esa URL a `diabetapp-frontend/.env` (`EXPO_PUBLIC_API_URL=https://<url>/api`) para probar la app contra producción (CA-16.6), y documentarla en `CLAUDE.md`.

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| *Cold start* del plan gratuito de Render hace lenta la primera petición tras inactividad | Aceptado (RNF-16.2); si molesta en el uso diario, el camino de salida a Railway (§8 de la spec) no cambia código. |
| El plan gratuito de Render duerme el servicio tras 15 min sin tráfico | Mismo trade-off; no se agrega un *cron* externo para mantenerlo despierto (violaría P8, simplicidad, por un problema aceptado). |
| Migraciones que fallan en el arranque (plan gratuito, sin `preDeployCommand`) | El servicio no llega a levantar (`npx prisma migrate deploy && npm start` corta la cadena), así que no queda sirviendo a medio migrar; Render lo marca como fallido y se ve en los logs. Es peor que el `preDeployCommand` de los planes pagos (ahí la versión anterior sigue respondiendo mientras se corrige), pero aceptable para RNF-16.1 ($0/mes). |
| `JWT_SECRET` distinto entre desarrollo y producción invalida sesiones viejas al desplegar por primera vez | Esperado: es la primera vez que existe un `JWT_SECRET` de producción, no hay sesiones previas que perder. |

## 7. Definición de terminado del plan

- `render.yaml` en la raíz, revisado.
- Runbook (§5) seguido por el usuario, con el backend respondiendo en su URL pública.
- `CLAUDE.md` y `specs/README.md` actualizados (ver tasks.md).
