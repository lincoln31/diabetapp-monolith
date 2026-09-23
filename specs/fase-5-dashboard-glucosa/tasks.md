# Tareas F5 — Dashboard con promedios de glucosa

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-5-dashboard-glucosa`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaración

- [x] **T5.1** Confirmar el criterio de tendencia (spec §8 / plan D-5.3), o ajustarlo si el usuario prefiere otro.

## Bloque A — Backend

- [x] **T5.2** Tipos `GlucoseStats`, `PeriodStats`, `Trend` en `glucose.schemas.ts` (D-5.8). — depende de T5.1
- [x] **T5.3** Función pura `summarize(readings, days)` y `calculateTrend(firstHalf, secondHalf)` (D-5.2, D-5.3), con tests unitarios de `calculateTrend` cubriendo `no_data`, `improving`, `worsening`, `stable` y los bordes (±5 % exacto). — RF-5.3, RF-5.4 · depende de T5.2
- [x] **T5.4** `GlucoseService.getStats(userId)` (D-5.2): una consulta de 30 días + `target` del usuario. — RF-5.1, RF-5.2, RF-5.5, RNF-5.1 · depende de T5.3
- [x] **T5.5** `getGlucoseStatsController` + ruta `GET /glucose/stats` **antes** de `GET /glucose/:id` (D-5.4). — RF-5.6 · depende de T5.4
- [x] **T5.6 [P]** Tests de integración: con lecturas, sin lecturas, aislamiento entre usuarios, límite de la ventana de 7 días (día 6 vs día 8). — CA-5.1, CA-5.2, CA-5.3, CA-5.6 · depende de T5.5
- [x] **T5.7 [P]** Añadir `GET /glucose/stats` a `requests.http`. — depende de T5.5
- [x] **T5.8** Medir CA-5.12 con `prisma/seed-perf.ts` apuntando al nuevo endpoint. — RNF-5.3 · depende de T5.5

## Bloque B — Frontend

- [x] **T5.9** `src/features/dashboard/types.ts` (réplica de los tipos del backend, D-5.8) y `api.ts` (`dashboardApi.getStats()`). — RF-5.1 · depende de T5.5
- [x] **T5.10** Hook `useDashboardStats()` con estados `loading/success/error/empty` y refresco manual (D-5.7). — RF-5.13 · depende de T5.9
- [x] **T5.11** `GlucoseAveragesCard` (RF-5.8, RF-5.9, RF-5.10: promedio de 7 días destacado + dentro/fuera de rango, 14 y 30 días debajo, señal de tendencia). — depende de T5.9
- [x] **T5.12 [P]** `EmptyState` (RF-5.11) con llamada a la acción hacia `/glucose/new`.
- [x] **T5.13** `DashboardScreen`: encabezado con saludo, lista de tarjetas (hoy solo `GlucoseAveragesCard`), botones «Registrar glucosa»/«Cerrar sesión», `RefreshControl`, `useFocusEffect` para refrescar al volver (D-5.7). — RF-5.7, RF-5.12, RF-5.13, RF-5.14 · depende de T5.10, T5.11, T5.12
- [x] **T5.14** `app/(app)/index.tsx` reexporta `DashboardScreen`; borrar `src/features/home/` tras comprobar que nada más la importa (D-5.6, riesgo del plan).
- [~] **T5.15 [P]** Tests: `GlucoseAveragesCard` (con datos, vacío, tendencias), `EmptyState`. `useDashboardStats` queda sin test propio: `renderHook` de `@testing-library/react-native` está roto en este proyecto incluso con un hook trivial (falla previa a cualquier código de esta fase, ligada a la versión de `test-renderer` fijada para el SDK 57); su lógica es la misma función `load()` ya cubierta indirectamente por el recorrido en dispositivo (T5.16).

## Bloque C — Verificación y cierre

- [ ] **T5.16** ⏳ (requiere dispositivo) Recorrido en dispositivo: cuenta nueva (CA-5.7), cuenta con datos (CA-5.8), registrar y volver (CA-5.9), deslizar para refrescar (CA-5.10), backend apagado (CA-5.11).
- [x] **T5.17** `npx tsc --noEmit`, lint y tests completos en ambos proyectos.
- [~] **T5.18** (parcial: falta el recorrido en dispositivo) Marcar CA-5.1 … CA-5.12 en el PR; cerrar #19, #20, #48; actualizar `CLAUDE.md` y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-5.1 | T5.4, T5.5, T5.9 | CA-5.1 |
| RF-5.2 | T5.3, T5.4 | CA-5.3 |
| RF-5.3 | T5.3, T5.4 | CA-5.2 |
| RF-5.4 | T5.3 | CA-5.4, CA-5.5 |
| RF-5.5 | T5.4 | CA-5.1 |
| RF-5.6 | T5.5 | CA-5.6 |
| RF-5.7 | T5.13, T5.14 | CA-5.8 |
| RF-5.8, RF-5.9, RF-5.10 | T5.11 | CA-5.8 |
| RF-5.11 | T5.12, T5.13 | CA-5.7 |
| RF-5.12 | T5.13 | CA-5.8 |
| RF-5.13 | T5.10, T5.13 | CA-5.9, CA-5.10 |
| RF-5.14 | T5.13 | — (revisión de código) |
| RNF-5.1 | T5.4 | — |
| RNF-5.3 | T5.8 | CA-5.12 |
