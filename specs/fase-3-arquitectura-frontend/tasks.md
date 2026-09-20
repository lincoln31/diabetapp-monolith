# Tareas F3 — Arquitectura del frontend

Implementa: [plan.md](plan.md) · Rama sugerida: `refactor/fase-3-arquitectura-frontend`

`[P]` = paralelizable dentro del bloque. Mover archivos con `git mv`.

## Bloque 0 — Aclaraciones

- [x] **T3.1** Resolver la aclaración de la spec (§8: `react-hook-form` + `zod`) y anotarla.

## Bloque A — Zona compartida

- [x] **T3.2** Crear `src/shared/` y mover `components/ui` → `shared/components/ui`, `tokenStorage` → `shared/session`. Actualizar imports al alias `@/`. — RF-3.1, RF-3.5
- [x] **T3.3** `shared/config/env.ts` con `EXPO_PUBLIC_API_URL` y error explicativo; crear `.env.example`. — RF-3.14, RF-3.15
- [x] **T3.4** `shared/theme/colors.ts` (desde `constants/config.ts`). — RF-3.1
- [x] **T3.5** `shared/api/types.ts` y `errors.ts` (`ApiError`, `toApiError`, `NETWORK_ERROR`). — RF-3.7, RF-3.8
- [x] **T3.6** `shared/api/client.ts`: helpers `get/post/put/del<T>`, conversión de errores, **sin alertas**; conservar la renovación de la fase 2. — RF-3.6, RF-3.9 · depende de T3.3, T3.5
- [x] **T3.7 [P]** `shared/utils/dates.ts` y `shared/utils/showError.ts`. — RF-3.9
- [x] **T3.8 [P]** Componente `FormError` y `shared/forms/applyServerErrors.ts`. — RF-3.12 · depende de T3.1

## Bloque B — Funcionalidades

- [x] **T3.9** `features/auth`: `types.ts`, `api.ts`, `schemas.ts`; mover `AuthProvider` y hacer que use `authApi`; `index.ts` público. — RF-3.2, RF-3.6, RF-3.7, RF-3.11 · depende de T3.6
- [x] **T3.10** `LoginScreen` y `RegisterScreen` en `features/auth/screens` con `react-hook-form`, errores por campo, `FormError` y botón deshabilitado al enviar. — RF-3.10, RF-3.12, RF-3.13 · depende de T3.8, T3.9
- [x] **T3.11** `features/glucose`: `types.ts`, `api.ts`, `schemas.ts`, `constants.ts`, `AddGlucoseScreen` con el mismo patrón de formulario. — RF-3.2, RF-3.6, RF-3.10 – RF-3.13 · depende de T3.8
- [x] **T3.12 [P]** `features/home`: mover `HomeScreen`. — RF-3.2
- [x] **T3.13** Dejar los archivos de `app/` como reexportaciones finas. — RF-3.3 · depende de T3.10 – T3.12

## Bloque C — Apariencia y limpieza

- [x] **T3.14** Revisar los nombres usados hoy en `Icon.tsx`, completar la tabla de D-3.7 y reescribir `Icon` con Ionicons y `AppIconName`. — RF-3.16
- [x] **T3.15 [P]** Desinstalar `react-native-vector-icons`. — RF-3.4
- [x] **T3.16 [P]** Arreglar los tipos de `Button.tsx` (D-3.8). — RF-3.18
- [x] **T3.17 [P]** `app.json`: `name` y `scheme`. — RF-3.17
- [x] **T3.18** Borrar `components/`, `hooks/`, `constants/`, `scripts/` de la raíz, imágenes del template, `src/constants`, `src/utils`, `src/api`, `src/hooks`, `src/session` ya vacíos, y el script `reset-project` de `package.json`. — RF-3.4
- [x] **T3.19** Regla ESLint `import/no-restricted-paths` con las reglas de dependencia de D-3.1. — RF-3.1

## Bloque D — Verificación y cierre

- [x] **T3.20** `npx tsc --noEmit` y `npm run lint` a 0 errores / 0 advertencias. — RF-3.18, RNF-3.3
- [ ] **T3.21** ⏳ (requiere dispositivo) Recorrido en dispositivo de CA-3.5 – CA-3.15.
- [~] **T3.22** (parcial: faltan CA-3.5 a CA-3.15 en dispositivo) Marcar CA-3.1 … CA-3.16 en el PR; actualizar `CLAUDE.md` (estructura, reglas de dependencia, política de errores, `.env`) y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-3.1, RF-3.2 | T3.2, T3.4, T3.9, T3.11, T3.12, T3.19 | CA-3.1, CA-3.4 |
| RF-3.3 | T3.13 | CA-3.2 |
| RF-3.4 | T3.15, T3.18 | CA-3.1, CA-3.13 |
| RF-3.5 | T3.2 | Revisión de código |
| RF-3.6, RF-3.7 | T3.5, T3.6, T3.9, T3.11 | CA-3.3 |
| RF-3.8, RF-3.9 | T3.5, T3.6, T3.7 | CA-3.7, CA-3.9 |
| RF-3.10 – RF-3.13 | T3.8, T3.10, T3.11 | CA-3.5, CA-3.6, CA-3.8, CA-3.10 |
| RF-3.14, RF-3.15 | T3.3 | CA-3.11, CA-3.12 |
| RF-3.16 | T3.14 | CA-3.13, CA-3.14 |
| RF-3.17 | T3.17 | CA-3.15 |
| RF-3.18, RNF-3.3 | T3.16, T3.20 | CA-3.16 |
