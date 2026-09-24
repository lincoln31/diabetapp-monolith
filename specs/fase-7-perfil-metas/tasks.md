# Tareas F7 — Perfil diabético y metas personales

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-7-perfil-metas`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [x] **T7.1** Resolver las aclaraciones de la spec (§8: umbrales de la alerta, `onboardingCompleted`, límites de validación) y anotarlas.

## Bloque A — Backend

- [x] **T7.2** `profile.schemas.ts`: `updateProfileSchema` y tipos (D-7.2). — RF-7.2, RF-7.3 · depende de T7.1
- [x] **T7.3** `ProfileService.get` y `update`, con la regla cruzada del rango y `onboardingCompleted` (D-7.2, D-7.3). — RF-7.1, RF-7.4, RF-7.13 · depende de T7.2
- [x] **T7.4** Controlador, rutas `GET`/`PUT /profile` con `authenticate`, y registro en `modules/index.ts`. — RF-7.5 · depende de T7.3
- [x] **T7.5 [P]** Tests de integración `test/profile.test.ts`: perfil propio, parcial, `null`, cuerpo vacío, límites y enums, rango incoherente con valor guardado, sin sesión, y `/glucose/stats` con el rango nuevo. — CA-7.1 – CA-7.8 · depende de T7.4
- [x] **T7.6 [P]** Añadir `GET`/`PUT /profile` a `requests.http`. — depende de T7.4
- [x] **T7.7** Revisar que ningún log imprima valores de salud del perfil. — RNF-7.2 · depende de T7.4

## Bloque B — Frontend: perfil

- [ ] **T7.8** Funcionalidad `profile/`: `types.ts`, `api.ts`, `constants.ts` (etiquetas en español) y `index.ts` (D-7.5). — RF-7.7 · depende de T7.4
- [ ] **T7.9** `schemas.ts` (`profileFormSchema`, mismas reglas que el backend, campos vacíos → `null`) con tests unitarios: rango incoherente, límites, vacíos. — RF-7.8, RF-7.9 · depende de T7.8
- [ ] **T7.10** Hook `useProfile()` (loading/success/error). — RF-7.7, RF-7.12 · depende de T7.8
- [ ] **T7.11** `ProfileScreen`: formulario precargado, `Picker` de tipo de diabetes y actividad, guardado, confirmación y `router.back()`. — RF-7.7 – RF-7.10 · depende de T7.9, T7.10
- [ ] **T7.12** Ruta `app/(app)/profile.tsx`, entrada en `(app)/_layout.tsx` y botón «Mi perfil» en `DashboardScreen`. — RF-7.7 · depende de T7.11
- [ ] **T7.13** Zona de ESLint `glucose → profile` (solo `index.ts`) en `eslint.config.js` (D-7.6). — depende de T7.8

## Bloque C — Frontend: alerta de rango (#21)

- [ ] **T7.14** `getRangeStatus` en `glucose/rangeStatus.ts` con tests unitarios: bordes exactos, `null`/`null`, un solo límite, valor no numérico. — RF-7.11, RF-7.12 · depende de T7.1
- [ ] **T7.15** Aviso de rango en `AddGlucoseScreen` con `useWatch` + `useProfile()`; no bloquea el guardado. — RF-7.11, RF-7.12 · depende de T7.10, T7.13, T7.14
- [ ] **T7.16 [P]** Test de componente del bloque de aviso (bajo / alto / dentro / sin rango). — CA-7.12 – CA-7.14 · depende de T7.15

## Bloque D — Verificación y cierre

- [ ] **T7.17** ⏳ (requiere dispositivo) Recorrido en dispositivo: CA-7.9 – CA-7.15.
- [ ] **T7.18** `npx tsc --noEmit`, lint y tests completos en ambos proyectos.
- [ ] **T7.19** Marcar CA-7.1 … CA-7.15 en el PR; cerrar #14, #15 y #21; cerrar #13, #17 y #18 con un comentario que apunte al código que ya los cubre; actualizar `CLAUDE.md` y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-7.1, RF-7.5 | T7.3, T7.4 | CA-7.1, CA-7.7 |
| RF-7.2 | T7.2, T7.3 | CA-7.2, CA-7.3, CA-7.4 |
| RF-7.3 | T7.2 | CA-7.5 |
| RF-7.4 | T7.3 | CA-7.6 |
| RF-7.6 | — (sin cambios en `/stats` ni `/hba1c`) | CA-7.8 |
| RF-7.7 | T7.8, T7.10 – T7.12 | CA-7.9 |
| RF-7.8, RF-7.9 | T7.9, T7.11 | CA-7.10 |
| RF-7.10 | T7.11 | CA-7.11 |
| RF-7.11, RF-7.12 | T7.14 – T7.16 | CA-7.12 – CA-7.15 |
| RF-7.13 | T7.3 | — (test de T7.5) |
| RNF-7.1 | T7.5, T7.9, T7.14 | — |
| RNF-7.2 | T7.7 | — |
