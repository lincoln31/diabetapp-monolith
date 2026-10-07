# Plan F18 — Caché local para el *cold start* del backend

## Decisiones técnicas

- **D-18.1** `shared/cache/queryCache.ts`: `readCache<T>(key)`/`writeCache<T>(key, value)` sobre `AsyncStorage`, con prefijo `diabetapp.cache.` y `try/catch` que traga cualquier fallo (RNF-18.2) — mismo patrón que `features/notifications/seenAchievements.ts`.
- **D-18.2** `shared/cache/useStaleQuery.ts`: hook genérico que reemplaza el `useState` + `load()` manual que repetían `useDashboardStats`, `useStreak`, `useHba1cProjection`, `useLatestReading` y `useTodayMedications` (los cinco hooks de «Hoy»). Un solo lugar para la lógica de "mostrar caché, pedir en segundo plano, no pisar con un error si ya hay algo" (RF-18.1 – RF-18.5), en vez de repetirla cinco veces.
- **D-18.3** Al enfocar la pantalla por primera vez: se lee la caché (si hay) y se muestra de inmediato con `status: 'success'`, `stale: true`; después se llama al `fetcher` real. Si responde, reemplaza los datos y guarda la caché nueva (`stale: false`). Si falla y ya había datos (de la caché o de una carga anterior en la sesión), se quedan como estaban — el `status` nunca pasa a `'error'` mientras haya algo que mostrar; solo se usa `'error'` cuando no hay nada (RF-18.5, igual que el comportamiento de hoy para ese caso).
- **D-18.4** `fetcher` y `getErrorMessage` se guardan en una `ref` dentro de `useStaleQuery`, no como dependencias de `useCallback`: así `load` no cambia de identidad en cada render y `useFocusEffect` no se dispara de más (cada hook sigue pasando una función inline nueva en cada render, como ya hacían antes).
- **D-18.5** Los cinco hooks de `features/dashboard/hooks/` se reescriben sobre `useStaleQuery`, conservando exactamente su forma pública (mismos nombres de campo: `stats`, `streak`, `projection`, `reading`, `medications`, `refresh`, `busyId`, `logIntake`) para no tocar `DashboardScreen.tsx` ni sus tests, que mockean los hooks por módulo.
- **D-18.6** `useDashboardStats` sigue calculando `status: 'empty'` por encima del `'success'` de `useStaleQuery` (cuando `periods['30'].count === 0`), igual que antes.
- **D-18.7** No se tocó `useExerciseSummary` (en `features/exercise`, usado también por la pestaña Actividad): mismo patrón, pero se dejó fuera del alcance de esta fase (ver spec §3).

## Archivos afectados

- `src/shared/cache/queryCache.ts` (nuevo)
- `src/shared/cache/useStaleQuery.ts` (nuevo)
- `src/shared/cache/__tests__/useStaleQuery.test.tsx`, `useStaleQuery.staleFresh.test.tsx`, `useStaleQuery.offline.test.tsx` (nuevos; separados en tres archivos para que cada escenario tenga su propio *test runner* de React aislado, evitando falsos negativos por un `act()` de un test anterior que todavía no había terminado de asentarse)
- `src/features/dashboard/hooks/{useDashboardStats,useStreak,useHba1cProjection,useLatestReading,useTodayMedications}.ts` (reescritos sobre `useStaleQuery`)

## Riesgos

- Si el paciente borra los datos de la app (o reinstala), no hay caché la primera vez: mismo comportamiento que hoy (esqueleto + error si falla).
- Datos desactualizados se ven como si fueran actuales por un momento (sin indicador, D-18 de la spec): aceptado porque el *cold start* dura ~45 s como mucho y se resuelve solo.
