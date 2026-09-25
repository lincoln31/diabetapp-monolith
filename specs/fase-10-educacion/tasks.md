# Tareas F10 — Contenido educativo

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-10-educacion`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [ ] **T10.1** Resolver las aclaraciones de la spec (§8: sin backend, fecha local para el tip, hub «Educación») y anotarlas.

## Bloque A — Contenido y lógica pura

- [ ] **T10.2** `constants.ts`: `TIPS` (≥ 15), `GUIDES`, `FAQS` (D-10.2, D-10.4). — RF-10.2, RF-10.5 · depende de T10.1
- [ ] **T10.3 [P]** `getTipOfTheDay` con tests unitarios: mismo día, día siguiente, vuelta de ciclo al agotar el catálogo. — RF-10.1, RF-10.2 · depende de T10.2
- [ ] **T10.4 [P]** `calculateCarbs` con tests unitarios (incluido el redondeo de raciones). — RF-10.3 · depende de T10.1
- [ ] **T10.5 [P]** `schemas.ts` de la calculadora (obligatorio, numérico, > 0) con tests: vacío, texto, negativo, cero. — RF-10.4, RNF-10.2 · depende de T10.1

## Bloque B — Pantallas

- [ ] **T10.6** `useTipOfTheDay()` y `TipCard`; sumarla al `DashboardScreen`. — RF-10.1 · depende de T10.3
- [ ] **T10.7** `CarbCalculatorScreen` con `react-hook-form`, recálculo con `useWatch` (D-10.3). — RF-10.3, RF-10.4 · depende de T10.4, T10.5
- [ ] **T10.8** `GuidesScreen`: guías + acordeón de FAQs. — RF-10.5 · depende de T10.2
- [ ] **T10.9** `EducationHubScreen` con las dos opciones; rutas `app/(app)/education/{index,calculator,guides}.tsx`, entradas en `(app)/_layout.tsx` y botón «Educación» en `DashboardScreen`. — RF-10.6 · depende de T10.7, T10.8
- [ ] **T10.10 [P]** Test de componente del acordeón de FAQs (una abierta cierra la anterior). — CA-10.7 · depende de T10.8

## Bloque C — Verificación y cierre

- [ ] **T10.11** ⏳ (requiere dispositivo) Recorrido en dispositivo: CA-10.7, CA-10.8, CA-10.9 (con el backend apagado).
- [ ] **T10.12** `npx tsc --noEmit`, lint y tests completos del frontend (sin cambios en el backend).
- [ ] **T10.13** Marcar CA-10.1 … CA-10.9 en el PR; cerrar #43, #44, #45; cerrar #41 y #42 con el comentario de §8; actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-10.1, RF-10.2 | T10.2, T10.3, T10.6 | CA-10.1 – CA-10.3 |
| RF-10.3 | T10.4, T10.7 | CA-10.4 |
| RF-10.4 | T10.5, T10.7 | CA-10.5, CA-10.6 |
| RF-10.5 | T10.2, T10.8 | CA-10.7 |
| RF-10.6 | T10.9 | CA-10.8 |
| RNF-10.1 | D-10.1 (sin código de backend) | CA-10.9 |
| RNF-10.2 | T10.5 | CA-10.5, CA-10.6 |
| RNF-10.3 | T10.3, T10.4, T10.5 | — |
