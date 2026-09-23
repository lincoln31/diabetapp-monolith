# Tareas F6 — Reportes exportables y proyección de HbA1c

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-6-reportes-hba1c`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones

- [x] **T6.1** Confirmar las 4 aclaraciones de la spec (§8: librería de PDF, librerías de guardar/compartir, umbral de lecturas para HbA1c, alcance del export), o ajustarlas si el usuario prefiere otra opción.

## Bloque A — Backend: proyección de HbA1c

- [x] **T6.2** Función pura `projectHba1c(readings)` en `glucose.hba1c.ts` (D-6.2), con tests unitarios: sin lecturas, por debajo del umbral, exactamente en el umbral, por encima, y el redondeo a un decimal. — RF-6.1, RF-6.2 · depende de T6.1
- [x] **T6.3** `GlucoseService.getHba1cProjection(userId)` (D-6.3): una consulta de 90 días + `targetHba1c` del usuario. — RF-6.1, RF-6.3, RNF-6.1 · depende de T6.2
- [x] **T6.4** `getHba1cProjectionController` + ruta `GET /glucose/hba1c` **antes** de `GET /glucose/:id` (D-6.5). — RF-6.4 · depende de T6.3
- [x] **T6.5 [P]** Tests de integración: con lecturas suficientes, por debajo del umbral, aislamiento entre usuarios. — CA-6.1, CA-6.2, CA-6.3 · depende de T6.4

## Bloque B — Backend: exportar reportes

- [x] **T6.6** `npm install pdfkit @types/pdfkit` en el backend (D-6.4). — depende de T6.1
- [x] **T6.7 [P]** `GlucoseService.getAllForExport(userId)`: todas las lecturas del usuario ordenadas por fecha, más nombre del paciente. — depende de T6.4
- [x] **T6.8 [P]** Generador de CSV (`glucose.export.csv.ts`) con tests: encabezados, una fila por lectura, escapado de comas/comillas en notas, caso sin lecturas. — RF-6.5, RF-6.8 · depende de T6.7
- [x] **T6.9 [P]** Generador de PDF (`glucose.export.pdf.ts` con `pdfkit`): cabecera con nombre y rango de fechas, tabla de lecturas, caso sin lecturas. — RF-6.6, RF-6.8 · depende de T6.6, T6.7
- [x] **T6.10** Controladores + rutas `GET /glucose/export/csv` y `GET /glucose/export/pdf`, con `Content-Type`/`Content-Disposition` correctos, **antes** de `GET /glucose/:id` (D-6.5). — RF-6.7 · depende de T6.8, T6.9
- [x] **T6.11 [P]** Tests de integración de ambos endpoints (`Content-Type`, primera fila del CSV, cabecera `%PDF-` del PDF, caso sin lecturas). — CA-6.4, CA-6.5, CA-6.6 · depende de T6.10
- [x] **T6.12 [P]** Añadir las tres rutas nuevas a `requests.http`. — depende de T6.4, T6.10

## Bloque C — Frontend: tarjeta de HbA1c

- [x] **T6.13** `hba1cApi.getProjection()` y tipo `Hba1cProjection` en `dashboard/{api,types}.ts` (D-6.1). — depende de T6.4
- [x] **T6.14** Hook `useHba1cProjection()`, mismo patrón que `useDashboardStats` (D-6.7). — depende de T6.13
- [x] **T6.15 [P]** `Hba1cCard`: proyección destacada, comparación con `targetHba1c` si existe, mensaje de datos insuficientes (RF-6.9 – RF-6.11); no se muestra si el dashboard general está en estado `empty`. — depende de T6.14
- [x] **T6.16** Sumar `<Hba1cCard />` a la lista de tarjetas de `DashboardScreen`. — depende de T6.15

## Bloque D — Frontend: exportar reporte

- [x] **T6.17** `npx expo install expo-file-system expo-sharing` (D-6.6). — depende de T6.1
- [x] **T6.18** `getFile()` en `shared/api/client.ts`: variante de `get()` para respuesta de texto/binaria (D-6.6), sin tocar el contrato tipado existente. — depende de T6.17
- [x] **T6.19** `exportApi.download(format)` en `dashboard/api.ts` + hook `useExportReport()` (estado `idle/loading/error`) que escribe el archivo con `expo-file-system` y lo comparte con `expo-sharing` (D-6.6). — RF-6.12 – RF-6.14 · depende de T6.18
- [x] **T6.20 [P]** `ExportReportButton`: elegir CSV/PDF, señal de carga, error legible si falla. — RF-6.12 – RF-6.14 · depende de T6.19
- [x] **T6.21** Sumar `<ExportReportButton />` a `DashboardScreen`, junto a «Registrar glucosa»/«Cerrar sesión». — depende de T6.20

## Bloque E — Verificación y cierre

- [ ] **T6.22** ⏳ (requiere dispositivo) Recorrido en dispositivo: cuenta con datos suficientes (CA-6.7), cuenta con datos insuficientes (CA-6.8), exportar CSV y PDF (CA-6.9), backend apagado al exportar (CA-6.10).
- [x] **T6.23** `npx tsc --noEmit`, lint y tests completos en ambos proyectos.
- [~] **T6.24** (parcial: falta el recorrido en dispositivo) Marcar CA-6.1 … CA-6.10 en el PR; cerrar #46, #47, #49 y #50; actualizar `CLAUDE.md` y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-6.1, RF-6.2 | T6.2, T6.3 | CA-6.1, CA-6.2 |
| RF-6.3 | T6.3 | CA-6.1 |
| RF-6.4 | T6.4 | CA-6.3 |
| RF-6.5, RF-6.8 | T6.7, T6.8 | CA-6.4, CA-6.6 |
| RF-6.6, RF-6.8 | T6.7, T6.9 | CA-6.5, CA-6.6 |
| RF-6.7 | T6.10 | CA-6.4, CA-6.5 |
| RF-6.9 – RF-6.11 | T6.13 – T6.16 | CA-6.7, CA-6.8 |
| RF-6.12 – RF-6.14 | T6.17 – T6.21 | CA-6.9, CA-6.10 |
| RNF-6.1 | T6.3 | — |
| RNF-6.3 | T6.5, T6.11 | — |
| RNF-6.4 | T6.19 | CA-6.9 |
