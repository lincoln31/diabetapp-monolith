# Tareas F11 — Medicación y adherencia

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-11-medicacion`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [x] **T11.1** Resolver las 4 aclaraciones de la spec (§8: #35 fuera, archivar, definición de adherencia, sin deshacer) y anotarlas.

## Bloque A — Backend: datos y CRUD

- [x] **T11.2** Modelos `Medication` y `MedicationIntake` en `schema.prisma` + migración `medications` (D-11.1). — RF-11.1, RNF-11.2 · depende de T11.1
- [x] **T11.3** `medications.schemas.ts` (Zod: nombre, dosis, horarios `HH:mm` únicos y ordenados, notas, `takenAt`). — RF-11.2 · depende de T11.2
- [x] **T11.4** `MedicationsService`: `create`, `list` (con `takenToday` en una consulta agrupada), `update`, `archive`; todo filtrado por `userId`/`active`. — RF-11.2, RF-11.3, RF-11.6, RNF-11.1 · depende de T11.3
- [x] **T11.5** `logIntake(userId, id, takenAt?)`: exige medicamento propio y activo. — RF-11.4, RF-11.7 · depende de T11.4
- [x] **T11.6** Controladores + rutas, registradas en `modules/index.ts` (`/adherence` antes de `/:id`). — RF-11.6 · depende de T11.5
- [x] **T11.7 [P]** Tests de integración CRUD, aislamiento entre usuarios, archivado y tomas. — CA-11.1 – CA-11.8 · depende de T11.6

## Bloque B — Backend: adherencia

- [x] **T11.8** `medications.adherence.ts` (función pura, D-11.4) con tests unitarios: sin medicamentos, creado hoy, tope por día, ventana de 7 y 30, hoy incluido. — RF-11.5 · depende de T11.2
- [x] **T11.9** `MedicationsService.getAdherence(userId)`: una consulta de medicamentos activos + una de tomas agrupadas por día local (`User.timezone`). — RF-11.5, RNF-11.1, RNF-11.4 · depende de T11.8
- [x] **T11.10** Ruta `GET /medications/adherence`. — depende de T11.9
- [x] **T11.11 [P]** Test de integración de adherencia (con tomas en varios días, otro usuario, sin medicamentos). — CA-11.9 – CA-11.12 · depende de T11.10
- [x] **T11.12 [P]** Añadir las rutas nuevas a `requests.http`. — depende de T11.10

## Bloque C — Frontend

- [x] **T11.13** Funcionalidad `medications/`: `types.ts`, `api.ts`, `schemas.ts` (mismas reglas), `index.ts`. — depende de T11.10
- [x] **T11.14** Hooks `useMedications()` (con `logIntake` y estado de carga por medicamento) y `useAdherence()`. — RF-11.13 · depende de T11.13
- [x] **T11.15** `MedicationsScreen`: lista con «X de Y hoy», botón «Registrar toma», estado vacío, error con reintento. — RF-11.8, RF-11.11, RF-11.13 · depende de T11.14
- [x] **T11.16** `MedicationForm` + `MedicationFormScreen` (alta/edición, lista dinámica de horarios, dejar de usar con confirmación). — RF-11.9, RF-11.10 · depende de T11.14
- [x] **T11.17** Rutas `app/(app)/medications/{index,form}.tsx`, entradas en `(app)/_layout.tsx`. — depende de T11.15, T11.16
- [x] **T11.18** `AdherenceCard` y su lugar en `DashboardScreen` (con `refresh` en `refreshAll`) + botón «Mis Medicamentos». — RF-11.12 · depende de T11.14
- [x] **T11.19 [P]** Tests de componente: lista con contador, estado vacío, esquema del formulario, tarjeta de adherencia. — CA-11.13, CA-11.14, CA-11.15 · depende de T11.15 – T11.18

## Bloque D — Verificación y cierre

- [ ] **T11.20** ⏳ (requiere dispositivo) Recorrido: CA-11.13 – CA-11.16 (incluido backend apagado).
- [x] **T11.21** `tsc`, lint y tests completos de ambos proyectos; medir CA de RNF-11.1 con `seed-perf`.
- [ ] **T11.22** Marcar CA-11.1 … CA-11.16 en el PR; cerrar #29 – #34; comentar en #35 el enlace a la fase de notificaciones; actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-11.1, RNF-11.2 | T11.2 | CA-11.1 |
| RF-11.2 | T11.3, T11.4, T11.6 | CA-11.1 – CA-11.4 |
| RF-11.3 | T11.4 | CA-11.6 |
| RF-11.4, RF-11.7 | T11.5 | CA-11.7, CA-11.8 |
| RF-11.5 | T11.8 – T11.10 | CA-11.9 – CA-11.12 |
| RF-11.6 | T11.4, T11.6 | CA-11.5 |
| RF-11.8, RF-11.11, RF-11.13 | T11.14, T11.15 | CA-11.13, CA-11.14, CA-11.16 |
| RF-11.9, RF-11.10 | T11.16 | CA-11.1, CA-11.2 |
| RF-11.12 | T11.18 | CA-11.15 |
| RNF-11.1 | T11.4, T11.9 | — |
| RNF-11.3 | T11.7, T11.11, T11.19 | — |
| RNF-11.4 | T11.9 | CA-11.9 |
