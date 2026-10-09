# Plan F19 — Registrar la insulina aplicada y ver su efecto

## Decisiones técnicas

- **D-19.1** `GlucoseReading` (Prisma) gana `insulinUnits Float?`. Mismo patrón que el resto de campos opcionales del modelo (`notes`, etc.): columna nullable, sin tabla aparte.
- **D-19.2** Validación (Zod, backend y frontend): 0.5–100, igual rango conceptual que `insulinCarbRatio`/`insulinSensitivityFactor` de la fase 17 (números con sentido clínico, no arbitrarios).
- **D-19.3** `insulinEffect.ts` (en `features/glucose`, frontend): `calculateInsulinEffect({ previous, current })` pura — compara `previous.insulinUnits` contra el tiempo transcurrido (`current.timestamp - previous.timestamp`), devuelve `null` fuera de la ventana de 1–4 h o sin insulina registrada. `formatInsulinEffectMessage` arma el texto en español (bajó/subió/igual, singular/plural de «unidad»).
- **D-19.4** `GlucoseForm.tsx`: tras crear una lectura, pide las 2 más recientes (`glucoseApi.list({ page: 1, limit: 2 })`) — la que no es la recién creada es la «anterior». Si `calculateInsulinEffect` da resultado, ese mensaje reemplaza al `toast.show('Medición guardada…')` genérico; si la petición falla, se captura y se usa el mensaje genérico (RNF-19.2) — no bloquea el guardado ni el regreso a la pantalla anterior.
- **D-19.5** Sin endpoint ni lógica nueva en el backend más allá de guardar/leer el campo: el cálculo de efecto es puro en el frontend, mismo patrón que `calculateInsulinDose` de la fase 17.

## Archivos afectados

### Backend
- `prisma/schema.prisma`: columna `insulinUnits` en `GlucoseReading`.
- `prisma/migrations/<ts>_glucose_insulin_units/`: migración generada.
- `src/modules/glucose/glucose.schemas.ts`: validación del campo nuevo.
- `src/modules/glucose/glucose.service.ts`: `readingFields` incluye `insulinUnits` (create/update ya pasan el `data` completo por spread, sin cambios ahí).
- `test/glucose.test.ts`: casos nuevos (guardar, opcional, fuera de rango).

### Frontend
- `src/features/glucose/types.ts`: `insulinUnits` en `GlucoseReading` y `CreateGlucoseInput`.
- `src/features/glucose/schemas.ts`: campo de texto opcional, mismo patrón que los números opcionales de otras fases.
- `src/features/glucose/insulinEffect.ts` (nuevo): `calculateInsulinEffect` + `formatInsulinEffectMessage`.
- `src/features/glucose/components/GlucoseForm.tsx`: campo plegado «Agregar unidades de insulina aplicadas» (igual patrón que notas) + lógica de comparación al guardar.
- Tests: `insulinEffect.test.ts` (nuevo), `schemas.test.ts`, `GlucoseForm.test.tsx` (casos nuevos), y actualización de fixtures (`GlucoseReading` ahora exige `insulinUnits`) en `GlucoseHistoryScreen.test.tsx`/`history.test.ts`.

## Riesgos

- Si el paciente edita manualmente la hora de una lectura para que caiga "casualmente" dentro de la ventana de 1–4 h de otra con insulina, vería una comparación que no corresponde a la realidad — riesgo aceptado, es el mismo nivel de confianza que ya existe en el resto del registro manual de fechas de la app.
- Pedir las 2 lecturas más recientes tras cada creación agrega una petición extra al guardar; es liviana (misma paginación ya usada en el dashboard) y no bloquea visualmente el regreso a la pantalla anterior.
