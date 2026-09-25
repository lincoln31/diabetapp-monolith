# Tareas F8 — Rachas y meta diaria de glucometrías

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-8-rachas-meta-diaria`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones y limpieza

- [x] **T8.1** Resolver las aclaraciones de la spec (§8: qué día cuenta, metas por la vía del perfil, límites de la meta diaria) y anotarlas.
- [x] **T8.2** Cerrar #56 y #57 con un comentario que apunte a `test/auth.*.test.ts` y `.github/workflows/ci.yml` (fase 4). — H8.4

## Bloque A — Backend

- [x] **T8.3** `calculateStreaks(days, today)` en `glucose.streak.ts`, con tests unitarios: hoy/ayer, sin hoy, hueco, dos rachas, días repetidos, hueco rellenado, lista vacía, cruce de mes y de año. — RF-8.2 – RF-8.6 · depende de T8.1
- [x] **T8.4** `GlucoseService.getStreak(userId)`: consulta agrupada por día local + «hoy» + meta y zona del usuario (D-8.2). — RF-8.1, RF-8.2, RNF-8.1 · depende de T8.3
- [x] **T8.5** Controlador y ruta `GET /glucose/streak` **antes** de `GET /glucose/:id`. — RF-8.7 · depende de T8.4
- [x] **T8.6 [P]** Tests de integración: racha con lecturas de varios días, sin lecturas, otro usuario, lectura en el borde de medianoche (Bogotá vs UTC), lectura retroactiva que une dos rachas, `todayCount`/`goalReachedToday`. — CA-8.1 – CA-8.10 · depende de T8.5
- [x] **T8.7** `dailyGlucoseChecks` (1–20) en `profile.schemas.ts` y `profileFields`, con tests en `profile.test.ts`. — RF-8.8, CA-8.11 · depende de T8.1
- [x] **T8.8 [P]** Añadir `GET /glucose/streak` a `requests.http`. — depende de T8.5
- [x] **T8.9** Medir CA-8.17 con `prisma/seed-perf.ts`. — RNF-8.2 · depende de T8.5

## Bloque B — Frontend

- [x] **T8.10** `StreakStats` en `dashboard/types.ts` y `streakApi.get()` en `dashboard/api.ts`. — RF-8.1 · depende de T8.5
- [x] **T8.11** Hook `useStreak()` (loading/success/error + `refresh`, D-8.5). — RF-8.12 · depende de T8.10
- [x] **T8.12** Ícono `flame` en `Icon.tsx` y `StreakCard` (con racha, sin racha, meta cumplida). — RF-8.9 – RF-8.11 · depende de T8.10
- [x] **T8.13** Sumar `<StreakCard />` a `DashboardScreen` y a `refreshAll`. — RF-8.9, RF-8.12, RF-8.13 · depende de T8.11, T8.12
- [x] **T8.14** Campo «Lecturas por día» en el perfil: `types.ts`, `schemas.ts` (con tests) y `ProfileScreen`. — RF-8.14 · depende de T8.7
- [x] **T8.15 [P]** Tests de componente de `StreakCard`. — CA-8.12, CA-8.13 · depende de T8.12

## Bloque C — Verificación y cierre

- [x] **T8.16** Recorrido en dispositivo (moto g34 5G): CA-8.12, CA-8.14, CA-8.15, CA-8.16 (racha de 5 días con avance de hoy; registrar y volver actualiza el avance solo; cambiar la meta diaria en el perfil se refleja al volver, incluida la marca de meta cumplida; backend apagado no rompe el dashboard). CA-8.13 (invitación sin racha) no se recorrió en dispositivo por tiempo; queda cubierta por el test de integración CA-8.3 y el test de componente de `StreakCard`.
- [x] **T8.17** `npx tsc --noEmit`, lint y tests completos en ambos proyectos.
- [~] **T8.18** (parcial: #25 y #26 se cierran al fusionar el PR) Marcar CA-8.1 … CA-8.17 en el PR; cerrar #25 y #26; cerrar #22, #23, #24 con el comentario de §8; actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-8.1 | T8.4, T8.5, T8.10 | CA-8.1, CA-8.10 |
| RF-8.2 | T8.3, T8.4 | CA-8.5, CA-8.6 |
| RF-8.3, RF-8.4 | T8.3 | CA-8.1 – CA-8.4 |
| RF-8.5 | T8.3, T8.6 | CA-8.7 |
| RF-8.6, RF-8.7 | T8.4, T8.5 | CA-8.8, CA-8.9 |
| RF-8.8 | T8.7 | CA-8.11 |
| RF-8.9 – RF-8.11 | T8.12, T8.13 | CA-8.12, CA-8.13 |
| RF-8.12, RF-8.13 | T8.11, T8.13 | CA-8.14, CA-8.15 |
| RF-8.14 | T8.14 | CA-8.16 |
| RNF-8.1, RNF-8.2 | T8.4, T8.9 | CA-8.17 |
