# Tareas F16 — Infraestructura y despliegue del backend

Implementa: [plan.md](plan.md) · Rama: `docs/fase-16-infraestructura`

`👤` = paso manual del usuario (cuenta/panel web); el resto lo hace el asistente en el repo.

## Bloque 0 — Repo

- [x] **T16.1** Crear `render.yaml` en la raíz con el servicio web, `rootDir: diabetapp-backend`, `buildCommand`, `startCommand`, `healthCheckPath` y las variables `sync: false` para los secretos. — RF-16.1, RF-16.3, RF-16.6
- [x] **T16.2** Añadir `preDeployCommand: npx prisma migrate deploy` al blueprint. — RF-16.3
- [x] **T16.3** Confirmar `npm run generate-secret` en `diabetapp-backend/package.json` (ya existe desde fase 2, genera 32+ caracteres). — RF-16.6
- [x] **T16.4** Documentar en `CLAUDE.md` la sección de despliegue: proveedor elegido, cómo apuntar `EXPO_PUBLIC_API_URL` a producción, y el trade-off del *cold start*. — RF-16.7, RNF-16.2

## Bloque 1 — Cuentas y despliegue 👤

- [x] **T16.5** 👤 Crear cuenta en Neon y el proyecto Postgres; guardar la `DATABASE_URL` (con "-pooler") y la `DIRECT_URL` (la misma, sin "-pooler" — ver D-16.8). — RF-16.2
- [x] **T16.6** 👤 Crear cuenta en Render, conectar el repo de GitHub y crear el Blueprint desde `render.yaml`. — RF-16.1, RF-16.4
- [ ] **T16.7** 👤 Pegar `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET` en el panel de Render (variables `sync: false`). — RF-16.6
- [ ] **T16.8** 👤 Esperar el primer despliegue y confirmar `GET /api/health` en la URL pública. — CA-16.1

## Bloque 2 — Verificación

- [ ] **T16.9** Registrar un usuario y hacer login contra la URL de producción (`requests.http` o `curl`), confirmar el contrato `{ success, data }` igual que en local. — CA-16.2
- [ ] **T16.10** Revisar en el panel de Neon que las tablas de `schema.prisma` existen tras `migrate deploy`. — CA-16.4
- [ ] **T16.11** Cambiar `diabetapp-frontend/.env` a la URL de producción, `npm start`, y hacer un recorrido corto de la app (login, Hoy, registrar una lectura) contra el backend desplegado; volver a la IP local al terminar. — CA-16.6, RF-16.7
- [ ] **T16.12** Revisar que el repo (incluido el historial de commits de esta fase) no tenga ningún secreto real. — CA-16.5

## Bloque 3 — Cierre

- [ ] **T16.13** Actualizar `specs/README.md`: fila de la fase 16 en el índice y estado `Implementada`.
- [ ] **T16.14** Abrir el PR de esta fase con la URL pública del backend en la descripción (sin secretos).

## Trazabilidad

| RF/RNF | Tareas | CA |
|---|---|---|
| RF-16.1 | T16.1, T16.6, T16.8 | CA-16.1 |
| RF-16.2 | T16.5 | CA-16.2 |
| RF-16.3 | T16.1, T16.2 | CA-16.3, CA-16.4 |
| RF-16.4 | T16.6 | CA-16.3 |
| RF-16.5 | — (D-16.5, `TRUST_PROXY` ya existente) | CA-16.7 |
| RF-16.6 | T16.3, T16.7 | CA-16.5 |
| RF-16.7 | T16.4, T16.11 | CA-16.6 |
| RF-16.8 | T16.8 | CA-16.1 |
