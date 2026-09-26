# Tareas F9 — Logros

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-9-logros`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [x] **T9.1** Resolver las aclaraciones de la spec (§8: sin tabla de logros, catálogo de 6 logros, pantalla dedicada en vez de tarjeta) y anotarlas.

## Bloque A — Backend

- [x] **T9.2** `achievements.catalog.ts` con los 6 logros (D-9.2). — RF-9.2 · depende de T9.1
- [x] **T9.3** `GlucoseService.getLongestStreak(userId)`: reutiliza `calculateStreaks` sobre la misma consulta agrupada por día de `getStreak` (D-8.2), sin el parámetro «hoy». — depende de T9.2
- [x] **T9.4** `AchievementsService.get(userId)`: aplica el catálogo a `readingsCount` (`count()`) y `longestStreak` (D-9.3). — RF-9.1, RF-9.3, RNF-9.1 · depende de T9.3
- [x] **T9.5** Controlador y ruta `GET /achievements`, registrada en `modules/index.ts`. — RF-9.4 · depende de T9.4
- [x] **T9.6 [P]** Tests de integración: sin lecturas, racha y volumen que cruzan algunos umbrales, logro de racha que sigue desbloqueado con la racha actual en 0, aislamiento entre usuarios, sin sesión. — CA-9.1 – CA-9.5 · depende de T9.5
- [x] **T9.7 [P]** Añadir `GET /achievements` a `requests.http`. — depende de T9.5
- [x] **T9.8** Medir CA-9.9 con `prisma/seed-perf.ts`. — RNF-9.2 · depende de T9.5

## Bloque B — Frontend

- [x] **T9.9** Funcionalidad `achievements/`: `types.ts`, `api.ts`, `index.ts` (D-9.5). — RF-9.1 · depende de T9.5
- [x] **T9.10** Hook `useAchievements()` (loading/success/error), mismo patrón que `useProfile`. — RF-9.9 · depende de T9.9
- [x] **T9.11** Ícono `trophy` en `Icon.tsx` y `AchievementsScreen`: lista con desbloqueados distinguidos visualmente y «X de Y» en los bloqueados. — RF-9.6 – RF-9.9 · depende de T9.10
- [x] **T9.12** Ruta `app/(app)/achievements.tsx`, entrada en `(app)/_layout.tsx` y botón «Mis Logros» en `DashboardScreen`. — RF-9.6 · depende de T9.11
- [x] **T9.13 [P]** Test de componente de la lista de logros (desbloqueado, bloqueado con progreso). — CA-9.6, CA-9.7 · depende de T9.11

## Bloque C — Verificación y cierre

- [x] **T9.14** Recorrido en dispositivo (moto g34 5G): CA-9.6, CA-9.7 y CA-9.8. Con una racha de 10 días y 10 lecturas en total, los 6 logros mostraron exactamente el estado esperado (3 desbloqueados, 3 con "X de Y"); con el backend apagado, mensaje de error con "Reintentar", sin pantalla en blanco.
- [x] **T9.15** `npx tsc --noEmit`, lint y tests completos en ambos proyectos.
- [~] **T9.16** (parcial: #28 se cierra al fusionar el PR) Marcar CA-9.1 … CA-9.9 en el PR; cerrar #28; cerrar #27 con el comentario de §8; actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-9.1, RF-9.2 | T9.2, T9.4, T9.5 | CA-9.1, CA-9.2 |
| RF-9.3 | T9.4 | CA-9.3 |
| RF-9.4 | T9.5 | CA-9.4, CA-9.5 |
| RF-9.5 | T9.4 | CA-9.1 |
| RF-9.6 | T9.11, T9.12 | CA-9.6 |
| RF-9.7, RF-9.8 | T9.11 | CA-9.6, CA-9.7 |
| RF-9.9 | T9.10, T9.11 | CA-9.8 |
| RNF-9.1, RNF-9.2 | T9.3, T9.4, T9.8 | CA-9.9 |
