# Tareas F19 — Registrar la insulina aplicada y ver su efecto

## Backend

- [x] T19.1 Agregar `insulinUnits` a `schema.prisma` y crear la migración. (RF-19.1)
- [x] T19.2 Validar el campo en `glucose.schemas.ts` (0.5–100, opcional). (RF-19.2)
- [x] T19.3 Agregarlo a `readingFields` en `glucose.service.ts`.
- [x] T19.4 Tests en `glucose.test.ts`: guardar, opcional, fuera de rango. (CA-19.2)

## Frontend

- [x] T19.5 [P] `insulinEffect.ts` (`calculateInsulinEffect`, `formatInsulinEffectMessage`) + tests. (RF-19.3, RF-19.4, RNF-19.1)
- [x] T19.6 [P] Campos nuevos en `glucose/types.ts` y `glucose/schemas.ts` (+ tests de schema). (RF-19.1, RF-19.2, CA-19.2)
- [x] T19.7 Campo plegado en `GlucoseForm.tsx` + lógica de comparación al guardar, con `catch` que no bloquea si falla la consulta. (RF-19.1, RF-19.3, RF-19.4, RNF-19.2, CA-19.1, CA-19.3, CA-19.4, CA-19.5)
- [x] T19.8 Actualizar fixtures de `GlucoseReading` en tests existentes (`GlucoseHistoryScreen.test.tsx`, `history.test.ts`) con `insulinUnits`.
- [x] T19.9 Tests nuevos en `GlucoseForm.test.tsx`: campo se guarda, aviso de efecto al guardar.

## Cierre

- [x] T19.10 `npm run lint`, `npm run typecheck`, `npm test` en ambos proyectos.
- [x] T19.11 Actualizar `CLAUDE.md` (módulo `glucose`) y `specs/README.md` (índice + estado `Implementada`).
