# Tareas F17 — Calculadora de dosis de insulina

## Backend

- [x] T17.1 Agregar `insulinCarbRatio`/`insulinSensitivityFactor` a `schema.prisma` y crear la migración. (RF-17.1)
- [x] T17.2 Validar ambos campos en `profile.schemas.ts` (D-17.2). (RF-17.1)
- [x] T17.3 Agregarlos a `profileFields` en `profile.service.ts`. (RF-17.1)
- [x] T17.4 Tests en `profile.test.ts`: guardar, borrar con `null`, rechazar fuera de rango; actualizar el objeto exacto del test de "perfil propio". (CA-17.1)

## Frontend — perfil

- [x] T17.5 [P] Campos nuevos en `profile/types.ts` y `profile/schemas.ts` (texto↔número, igual patrón que `targetHba1c`). (RF-17.1)
- [x] T17.6 Sección «Insulina» en `ProfileScreen.tsx` con los dos campos y ayuda. (RF-17.1, CA-17.1)

## Frontend — tabla de alimentos y cálculo

- [x] T17.7 [P] `features/education/foodTable.ts` con los ~130 alimentos transcritos. (RF-17.2)
- [x] T17.8 [P] `features/education/insulinCalculator.ts` (`calculateInsulinDose`, pura) + tests. (RF-17.4, RF-17.5, RNF-17.3)

## Frontend — pantalla y navegación

- [x] T17.9 `InsulinCalculatorScreen.tsx`: buscador de alimentos, entrada manual de CHO, glucosa actual (con precarga desde param), resultado o aviso de configuración faltante. (RF-17.3, RF-17.6, CA-17.2 – CA-17.6)
- [x] T17.10 Ruta `app/(app)/education/insulin-calculator.tsx` + export en `education/index.ts`. (RF-17.8)
- [x] T17.11 Segunda entrada en `EducationHubScreen.tsx`. (RF-17.8, CA-17.8)
- [x] T17.12 Botón en `GlucoseForm.tsx` que navega con el valor de glucosa como param; zona nueva en `eslint.config.js`. (RF-17.7, CA-17.7, D-17.8)
- [x] T17.13 Tests de `InsulinCalculatorScreen` y del botón nuevo en `GlucoseForm.test.tsx`.

## Cierre

- [x] T17.14 `npm run lint`, `npm run typecheck`, `npm test` en ambos proyectos.
- [x] T17.15 Actualizar `CLAUDE.md` (perfil y módulo de educación) y `specs/README.md` (índice + estado `Implementada`).
