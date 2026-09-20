# Tareas F0 — Correcciones urgentes

Implementa: [plan.md](plan.md) · Rama sugerida: `fix/fase-0-correcciones-urgentes`

`[P]` = se puede hacer en paralelo con otras tareas `[P]` del mismo bloque.

## Bloque A — Seguridad

- [x] **T0.1** Resolver la aclaración de la spec (entornos que usaron el secreto) y anotarla en `spec.md §8`. — RF-0.1
- [ ] **T0.2** Generar un secreto nuevo por entorno y actualizar `JWT_SECRET`; reiniciar los servicios. — RF-0.1 · depende de T0.1
- [x] **T0.3 [P]** Actualizar `.gitignore` raíz y `diabetapp-backend/.gitignore` con el patrón `.env*` y sus excepciones. — RF-0.2
- [x] **T0.4 [P]** Revisar `diabetapp-backend/env.example` (valores ficticios, puerto 5433). — RF-0.1

## Bloque B — Bugs

- [x] **T0.5 [P]** `Input.tsx`: importar `Text`. — RF-0.3
- [x] **T0.6 [P]** `auth.service.ts`: comprobar `isActive` en `loginUser` con el mismo error que credenciales inválidas. — RF-0.4
- [x] **T0.7 [P]** `env.ts`: reescribir el reporte de errores con `safeParse` + `issues`. — RF-0.5

## Bloque C — Limpieza

- [x] **T0.8 [P]** Eliminar `src/types/index.d.ts` y `migration.sql` del backend. — RF-0.6
- [x] **T0.9 [P]** Eliminar `package.json` y `package-lock.json` de la raíz. — RF-0.6
- [x] **T0.10 [P]** Eliminar `src/app.tsx` y `src/screens/LoginScreen.tsx` del frontend. — RF-0.6
- [x] **T0.11** Quitar imports sin uso en los archivos tocados (`import { string } from 'zod'`). — RF-0.6

## Bloque D — Verificación y cierre

- [~] **T0.12** (parcial: CA-0.1 y CA-0.3 pendientes de verificar) Ejecutar la verificación del plan (§3) y marcar CA-0.1 … CA-0.7 en el PR. — depende de todo lo anterior
- [x] **T0.13** Actualizar `CLAUDE.md` si menciona archivos eliminados y poner la fase en `Implementada` en `specs/README.md`.

## Trazabilidad

| RF | Tareas | CA |
|---|---|---|
| RF-0.1 | T0.1, T0.2, T0.4 | CA-0.1 |
| RF-0.2 | T0.3 | CA-0.2 |
| RF-0.3 | T0.5 | CA-0.3 |
| RF-0.4 | T0.6 | CA-0.4, CA-0.5 |
| RF-0.5 | T0.7 | CA-0.6 |
| RF-0.6 | T0.8 – T0.11 | CA-0.7 |
