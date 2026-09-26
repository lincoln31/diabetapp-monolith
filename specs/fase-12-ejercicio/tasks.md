# Tareas F12 — Actividad física

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-12-ejercicio`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [ ] **T12.1** Resolver las aclaraciones de la spec (§8: #40 sin gráficos, definición de correlación, meta editable, tipos de actividad, sin editar) y anotarlas.

## Bloque A — Backend: datos y CRUD

- [ ] **T12.2** Enum `ActivityType` y modelo `ExerciseActivity` en `schema.prisma` + migración `exercise` (D-12.1). — RF-12.1, RNF-12.2 · depende de T12.1
- [ ] **T12.3** `exercise.schemas.ts` (Zod: tipo, duración 1–600, inicio no futuro, notas, paginación). — RF-12.2 · depende de T12.2
- [ ] **T12.4** `ExerciseService`: `create`, `list` (paginado, mismo formato que glucosa), `remove` (`deleteMany` por `id` + `userId`). — RF-12.2 – RF-12.4, RF-12.8 · depende de T12.3
- [ ] **T12.5** Controladores + rutas registradas en `modules/index.ts` (`/summary` antes de `/:id`). — depende de T12.4
- [ ] **T12.6 [P]** Tests de integración: alta válida e inválida, historial con rango y paginación, borrado propio y ajeno, sin sesión. — CA-12.1 – CA-12.5 · depende de T12.5

## Bloque B — Backend: resumen y correlación

- [ ] **T12.7** `exercise.correlation.ts` (función pura, D-12.4) con tests unitarios: sin datos, por debajo del umbral, ponderado por lecturas, días sin lecturas. — RF-12.6 · depende de T12.2
- [ ] **T12.8** `ExerciseService.getSummary(userId)`: consultas fijas por día local (D-12.4). — RF-12.5, RNF-12.1, RNF-12.3 · depende de T12.7
- [ ] **T12.9** Ruta `GET /exercise/summary`. — depende de T12.8
- [ ] **T12.10 [P]** Test de integración del resumen (hoy y 7 días, correlación suficiente e insuficiente, aislamiento entre usuarios). — CA-12.6 – CA-12.10 · depende de T12.9
- [ ] **T12.11** `exerciseGoalMinutes` en el perfil: `profile.schemas.ts`, `profile.service.ts` y tests (5–300, no nulo). — RF-12.7 · depende de T12.1
- [ ] **T12.12 [P]** Añadir las rutas nuevas a `requests.http`. — depende de T12.9

## Bloque C — Frontend

- [ ] **T12.13** Funcionalidad `exercise/`: `types.ts`, `api.ts`, `schemas.ts`, `constants.ts`, `index.ts`. — depende de T12.9
- [ ] **T12.14** `timer.ts` (lógica pura) con tests unitarios y `useStopwatch()` (repinta cada segundo, calcula con `Date.now()`). — RF-12.11 · depende de T12.1
- [ ] **T12.15** Hooks `useExercise()` (lista paginada, borrar) y `useExerciseSummary()`. — RF-12.9, RF-12.12 · depende de T12.13
- [ ] **T12.16** `ExerciseScreen`: avance de hoy, historial con «Cargar más», estado vacío, borrar con confirmación. — RF-12.9, RF-12.12 · depende de T12.15
- [ ] **T12.17** `ExerciseFormScreen`: tipo, duración, notas; duración precargada desde el cronómetro. — RF-12.10 · depende de T12.13
- [ ] **T12.18** `StopwatchScreen`: iniciar, pausar, reanudar, terminar → formulario con minutos. — RF-12.11 · depende de T12.14, T12.17
- [ ] **T12.19** Rutas `app/(app)/exercise/{index,form,timer}.tsx`, entradas en `(app)/_layout.tsx`. — depende de T12.16 – T12.18
- [ ] **T12.20** `ExerciseSummaryCard` + su lugar en `DashboardScreen` (con `refresh` en `refreshAll`) y botón «Ejercicio». — RF-12.13 · depende de T12.15
- [ ] **T12.21** Campo «Meta de ejercicio» en `ProfileScreen`, `profile/types.ts` y `profile/schemas.ts` (mismas reglas que el backend). — RF-12.14 · depende de T12.11
- [ ] **T12.22 [P]** Tests de componente: historial con avance, estado vacío, esquema del formulario, tarjeta de resumen (con y sin correlación). — CA-12.12, CA-12.13, CA-12.17 · depende de T12.16 – T12.20

## Bloque D — Verificación y cierre

- [ ] **T12.23** ⏳ (requiere dispositivo) Recorrido: CA-12.12 – CA-12.18 (incluidos segundo plano del cronómetro y backend apagado).
- [ ] **T12.24** `tsc`, lint y tests completos de ambos proyectos; medir RNF-12.1 con `seed-perf`.
- [ ] **T12.25** Marcar CA-12.1 … CA-12.18 en el PR; cerrar #36 – #40 (#40 con el comentario de §8); actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-12.1, RNF-12.2 | T12.2 | CA-12.1 |
| RF-12.2 | T12.3, T12.4 | CA-12.1, CA-12.2 |
| RF-12.3 | T12.4 | CA-12.3 |
| RF-12.4 | T12.4 | CA-12.4, CA-12.5 |
| RF-12.5 | T12.8, T12.9 | CA-12.6, CA-12.7 |
| RF-12.6 | T12.7, T12.8 | CA-12.8, CA-12.9 |
| RF-12.7 | T12.11 | CA-12.11 |
| RF-12.8 | T12.4, T12.8 | CA-12.5, CA-12.10 |
| RF-12.9, RF-12.12 | T12.15, T12.16 | CA-12.12, CA-12.16 |
| RF-12.10 | T12.17 | CA-12.2, CA-12.13, CA-12.18 |
| RF-12.11 | T12.14, T12.18 | CA-12.14, CA-12.15 |
| RF-12.13 | T12.20 | CA-12.17 |
| RF-12.14 | T12.21 | CA-12.11 |
| RNF-12.1 | T12.8 | — |
| RNF-12.3 | T12.8 | CA-12.6 |
| RNF-12.4 | T12.6, T12.10, T12.22 | — |
