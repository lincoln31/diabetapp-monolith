# Plan F17 — Calculadora de dosis de insulina

## Decisiones técnicas

- **D-17.1** Dos columnas nuevas en `User`: `insulinCarbRatio Float?` e `insulinSensitivityFactor Float?`. Mismo patrón que `targetHba1c`/`weight`: opcionales, `null` las borra, sin tabla aparte.
- **D-17.2** Rangos de validación (Zod, backend y frontend): ratio `1–100` g/unidad, factor `1–200` mg/dL/unidad. Son los rangos clínicos habituales (ratios típicos 5–30 g/u, factores típicos 15–100 mg/dL/u); se deja margen amplio en vez de acotar de más.
- **D-17.3** Sin endpoint ni lógica nueva en el backend más allá de guardar/leer los dos campos en `profile`: el cálculo de dosis es puro y vive en el frontend (RNF-17.1), igual que `calculateCarbs` de la fase 10.
- **D-17.4** La tabla de alimentos (`foodTable.ts`, en `features/education`) se transcribe completa de la lista compartida por el usuario (bibliografía UIS/ADA/universidades colombianas citada en la fuente), como un array `FoodItem[]` con `id`, `name`, `category`, `portion` (texto), `portionGrams` y `carbsGrams`. Sin fetch, sin paginación: ~130 elementos en memoria no pesan nada.
- **D-17.5** `insulinCalculator.ts` expone `calculateInsulinDose({ carbsGrams, currentGlucose, targetGlucose, carbRatio, sensitivityFactor })`: función pura, sin acceso a red ni a `Date`. Corrección nunca negativa (`Math.max(0, …)`); total redondeado al 0.5 más cercano (`Math.round(total / 0.5) * 0.5`).
- **D-17.6** La meta de corrección es `(targetGlucoseMin + targetGlucoseMax) / 2` leída del perfil (ver spec §8); si falta alguno de los dos, no hay meta y la calculadora no muestra corrección (mensaje explicando por qué).
- **D-17.7** Nueva pantalla `InsulinCalculatorScreen` en `features/education` (no en `features/glucose`, para no duplicar el patrón "sin backend" de educación); reutiliza `useProfile` de `features/profile` para leer ratio, factor y rango. Ruta `app/(app)/education/insulin-calculator.tsx`.
- **D-17.8** `GlucoseForm` (features/glucose) navega a `/education/insulin-calculator` pasando el valor de glucosa actual como param de ruta (`router.push({ pathname: '/education/insulin-calculator', params: { glucose: value } })`); la calculadora lee `useLocalSearchParams` y precarga ese valor si viene. Esto crea una dependencia `glucose → education`, agregada como zona nueva en `import/no-restricted-paths` (igual que la zona `glucose → notifications` de la fase 13): solo se permite importar desde `education/index.ts`.
- **D-17.9** El botón en `GlucoseForm` se muestra siempre bajo el campo de glucosa (no condicionado a que haya valor): sin valor, la calculadora abre sin precargar nada.
- **D-17.10** `EducationHubScreen` agrega una segunda entrada «Calculadora de dosis de insulina» (icono `pulse`), sin quitar la de carbohidratos.

## Archivos afectados

### Backend
- `prisma/schema.prisma`: dos columnas nuevas en `User`.
- `prisma/migrations/<ts>_insulin_dose_fields/`: migración generada.
- `src/modules/profile/profile.schemas.ts`: validación de los dos campos.
- `src/modules/profile/profile.service.ts`: agregarlos a `profileFields`.
- `test/profile.test.ts`: casos nuevos (guardar, borrar, rechazar fuera de rango) y actualizar el objeto exacto del test de "perfil propio".

### Frontend
- `src/features/profile/types.ts`, `schemas.ts`: campos nuevos (número opcional, mismo patrón que `targetHba1c`).
- `src/features/profile/screens/ProfileScreen.tsx`: nueva sección «Insulina» con los dos campos y una nota de ayuda.
- `src/features/education/foodTable.ts` (nuevo): datos de la tabla.
- `src/features/education/insulinCalculator.ts` (nuevo): función pura.
- `src/features/education/screens/InsulinCalculatorScreen.tsx` (nuevo).
- `src/features/education/screens/EducationHubScreen.tsx`: segunda entrada.
- `src/features/education/index.ts`: exporta la pantalla nueva.
- `app/(app)/education/insulin-calculator.tsx` (nuevo): ruta fina.
- `src/features/glucose/components/GlucoseForm.tsx`: botón «Calcular dosis de insulina».
- `eslint.config.js`: zona `glucose → education`.
- Tests: `insulinCalculator.test.ts`, `foodTable` (smoke test de forma de los datos), `ProfileScreen` (campos nuevos), `GlucoseForm` (botón navega con el param), `InsulinCalculatorScreen` (buscador, cálculo, aviso sin configurar).

## Riesgos

- Transcribir ~130 alimentos a mano puede tener algún error de tipeo frente a la tabla original: se revisa una vez transcrita contra la fuente antes de dar la tarea por terminada.
- El redondeo a 0.5 unidades es una convención (jeringas/plumas suelen marcar medias unidades); si el usuario usa una pluma que no marca medias unidades, puede ajustar a mano — no es parte del alcance.
