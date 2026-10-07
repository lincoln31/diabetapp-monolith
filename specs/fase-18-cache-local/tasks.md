# Tareas F18 — Caché local para el *cold start* del backend

- [x] T18.1 `shared/cache/queryCache.ts` (`readCache`/`writeCache`). (RF-18.1, RNF-18.1, RNF-18.2)
- [x] T18.2 `shared/cache/useStaleQuery.ts`. (RF-18.1 – RF-18.5)
- [x] T18.3 Tests de `useStaleQuery`: sin caché (éxito y error), con caché y éxito en segundo plano, con caché y fallo en segundo plano. (CA-18.1 – CA-18.4)
- [x] T18.4 [P] Reescribir `useDashboardStats.ts` sobre `useStaleQuery`. (D-18.6)
- [x] T18.5 [P] Reescribir `useStreak.ts` sobre `useStaleQuery`.
- [x] T18.6 [P] Reescribir `useHba1cProjection.ts` sobre `useStaleQuery`.
- [x] T18.7 [P] Reescribir `useLatestReading.ts` sobre `useStaleQuery`.
- [x] T18.8 [P] Reescribir `useTodayMedications.ts` sobre `useStaleQuery` (conservando `logIntake`).
- [x] T18.9 `npm run lint`, `npm run typecheck`, `npm test` en el frontend (sin tocar el backend).
- [x] T18.10 Actualizar `CLAUDE.md` (sección de arquitectura del frontend) y `specs/README.md` (índice + estado `Implementada`).
