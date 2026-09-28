# Plan técnico F11 — Medicación y adherencia

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-11.1 Esquema (resuelve la aclaración de la spec §8; #29)

```prisma
model Medication {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name           String
  dosage         String            // texto libre: "500 mg", "10 unidades"
  scheduledTimes String[]          // horas locales "HH:mm", ordenadas
  notes          String?
  active         Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  intakes        MedicationIntake[]

  @@index([userId, active])
  @@map("medications")
}

model MedicationIntake {
  id           String     @id @default(cuid())
  medicationId String
  medication   Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
  userId       String     // duplicado a propósito: filtra por usuario sin JOIN (patrón de la fase 1)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  takenAt      DateTime
  createdAt    DateTime   @default(now())

  @@index([userId, takenAt])
  @@index([medicationId])
  @@map("medication_intakes")
}
```

Se descomenta `medications Medication[]` en `User` y se agrega `medicationIntakes MedicationIntake[]`. Migración: `npx prisma migrate dev --name medications`. No se tocan `currentMedications` ni `insulinType`.

### D-11.2 Módulo `medications`

```
src/modules/medications/
├── medications.routes.ts
├── medications.controller.ts
├── medications.service.ts
├── medications.schemas.ts
└── medications.adherence.ts     # función pura del cálculo (D-11.4)
```

Registrado con una línea en `modules/index.ts`.

### D-11.3 Endpoints

| Método y ruta | Descripción |
|---|---|
| `POST /api/medications` | Crea (`name`, `dosage`, `scheduledTimes`, `notes?`). |
| `GET /api/medications` | Lista solo los activos, con `takenToday`. |
| `PUT /api/medications/:id` | Edita nombre, dosis, horarios y notas (todo el recurso). |
| `DELETE /api/medications/:id` | **Archiva** (`active=false`); idempotente sobre un medicamento ya archivado → `NOT_FOUND` (se filtra por `active: true`). |
| `POST /api/medications/:id/intakes` | Registra una toma (`takenAt?`, por defecto ahora). |
| `GET /api/medications/adherence` | Adherencia 7 y 30 días. **Se declara antes de `/:id`** (lección de D-6.5). |

Validación Zod: `name` 1–80 caracteres (trim), `dosage` 1–40, `notes` ≤ 300, `scheduledTimes` de 1 a 10 valores `HH:mm` (regex `^([01]\d|2[0-3]):[0-5]\d$`), sin repetidos, se guardan ordenados. `takenAt` ISO, no futuro con margen de 5 min.

Todas las operaciones sobre un id filtran por `userId` (y `active` donde aplica) en la misma consulta (`updateMany`), como en `glucose`.

Respuesta de la lista (`data`):

```jsonc
{ "medications": [
  { "id": "…", "name": "Metformina", "dosage": "850 mg",
    "scheduledTimes": ["08:00", "20:00"], "notes": null, "takenToday": 1 }
] }
```

### D-11.4 Adherencia (resuelve la aclaración de la spec §8; #33)

Una consulta de los medicamentos activos del usuario y una consulta agrupada de tomas por día local y medicamento (`$queryRaw`, mismo patrón que `getStreak`):

```sql
SELECT "medicationId", to_char(("takenAt" AT TIME ZONE ${tz})::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS taken
FROM medication_intakes
WHERE "userId" = ${userId} AND "takenAt" >= ${windowStart}
GROUP BY 1, 2
```

Función pura en `medications.adherence.ts`:

```ts
export interface AdherenceInput {
  medications: { id: string; scheduledPerDay: number; createdDay: string }[];
  intakes: { medicationId: string; day: string; taken: number }[];
  today: string;      // 'YYYY-MM-DD' local
  windowDays: number; // 7 | 30
}
export interface AdherenceResult { expected: number; taken: number; percent: number | null }
```

- Para cada medicamento y cada día de la ventana (`today` hacia atrás `windowDays` días, hoy incluido) desde `max(inicio de ventana, createdDay)`: `expected += scheduledPerDay`; `taken += min(tomasDelDia, scheduledPerDay)`.
- `percent = expected === 0 ? null : round(taken / expected * 100)`.
- **Simplificación:** solo se consideran los medicamentos **activos** en la ventana. Un medicamento archivado deja de contar como «esperado» desde ese momento en adelante y su pasado no entra en la adherencia mostrada; su historial de tomas sigue guardado en la tabla (no se borra), listo para futuros reportes. Se evita agregar una columna `archivedAt` que esta fase no necesita (P8).
- Hoy cuenta como día completo, aunque no haya terminado: es el comportamiento honesto para «¿voy bien?», y un día en curso con tomas pendientes baja el % hasta que se registran. (Alternativa descartada: excluir hoy, que oculta el avance del día.)
- Respuesta: `{ "days7": { expected, taken, percent }, "days30": { expected, taken, percent } }`.

### D-11.5 Frontend

```
src/features/medications/
├── api.ts                 # medicationsApi: list, create, update, archive, logIntake, adherence
├── types.ts
├── schemas.ts             # formulario (RF-11.10), mismas reglas que el backend
├── constants.ts
├── hooks/useMedications.ts, hooks/useAdherence.ts
├── components/MedicationForm.tsx, components/AdherenceCard.tsx
├── screens/MedicationsScreen.tsx, screens/MedicationFormScreen.tsx
└── index.ts
```

- Rutas finas: `app/(app)/medications/index.tsx` (lista) y `app/(app)/medications/form.tsx` (alta y edición; el id llega como parámetro de ruta).
- **Horarios en el formulario:** campo de texto por horario `HH:mm` con «Agregar horario» / quitar, validado con la misma regex (sin dependencia nueva; el selector de hora del proyecto se evaluó y no compensa para una lista de horas).
- `AdherenceCard` sigue el patrón de `Hba1cCard`/`StreakCard`, con `useAdherence()` (mismo patrón que `useStreak`, con `refresh` en `refreshAll` del dashboard). No se muestra si ambos `percent` son `null`.
- Acceso desde `DashboardScreen`: botón «Mis Medicamentos» (el dashboard pasa a 7 botones; ver riesgo).

## 2. Verificación

| CA | Cómo |
|---|---|
| CA-11.1 – CA-11.8 | Tests de integración (`medications.test.ts`) con dos usuarios. |
| CA-11.9 – CA-11.12 | Tests unitarios de `medications.adherence.ts` con días fijos + un test de integración de extremo a extremo. |
| CA-11.13 – CA-11.16 | Tests de componente + recorrido en dispositivo (incluido backend apagado). |

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| El dashboard acumula botones (7) | Riesgo aceptado esta fase; si crece más, agrupar en una barra o menú en una spec propia. |
| Toma registrada por error no se puede deshacer | Aceptado (spec §8); es un endpoint pequeño de agregar después. |
| El % de hoy parece bajo por la tarde | Documentado en D-11.4; la tarjeta muestra tomas «X de Y», no solo el %. |
| Cambiar horarios de un medicamento altera la adherencia pasada | Aceptado: se usa el número de horarios actual sobre toda la ventana; no se versiona el horario. |
