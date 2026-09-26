# Plan técnico F12 — Actividad física

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-12.1 Esquema (#36)

```prisma
enum ActivityType {
  WALKING
  RUNNING
  CYCLING
  SWIMMING
  GYM
  YOGA
  OTHER
}

model ExerciseActivity {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  type            ActivityType
  durationMinutes Int
  startedAt       DateTime
  notes           String?

  createdAt       DateTime     @default(now())

  @@index([userId, startedAt])
  @@map("exercise_activities")
}
```

`User` gana `exerciseActivities ExerciseActivity[]` (descomentando la relación futura si existe). Migración `exercise`. Los esquemas Zod importan `ActivityType` de `@prisma/client` (una sola lista de valores, fase 1).

### D-12.2 Módulo `exercise`

```
src/modules/exercise/
├── exercise.routes.ts
├── exercise.controller.ts
├── exercise.service.ts
├── exercise.schemas.ts
└── exercise.correlation.ts     # función pura (D-12.4)
```

Registrado con una línea en `modules/index.ts`.

### D-12.3 Endpoints

| Método y ruta | Descripción |
|---|---|
| `POST /api/exercise` | `{ type, durationMinutes (1–600, entero), startedAt? (ISO, no futuro con margen de 5 min), notes? (≤ 200) }` → 201. |
| `GET /api/exercise` | `?from&to&page&limit`, `meta` de paginación, mismo formato que `glucose.list`. |
| `GET /api/exercise/summary` | Resumen (D-12.4). **Se declara antes de `/:id`.** |
| `DELETE /api/exercise/:id` | `deleteMany` con `{ id, userId }`; 0 filas → `NOT_FOUND`. |

### D-12.4 Resumen y correlación (#40)

Consultas fijas (RNF-12.1), todas agrupadas por día local del usuario (`User.timezone`, patrón de `getStreak`):

1. `User`: `timezone`, `exerciseGoalMinutes`.
2. Minutos por día de los últimos 30 días: `SELECT day, SUM("durationMinutes") FROM exercise_activities … GROUP BY day`.
3. Glucosa por día de los últimos 30 días: `SELECT day, SUM(value)::int AS total, COUNT(*)::int AS count FROM glucose_readings … GROUP BY day`.
4. «Hoy» local: `SELECT to_char(now() AT TIME ZONE tz, 'YYYY-MM-DD')`.

Función pura en `exercise.correlation.ts`:

```ts
export interface DayGlucose { day: string; total: number; count: number }
export interface CorrelationResult {
  sufficientData: boolean;
  withExercise: { days: number; average: number | null };
  withoutExercise: { days: number; average: number | null };
  difference: number | null;   // withExercise.average - withoutExercise.average
}
export const MIN_READINGS_PER_GROUP = 5;
export const correlateExerciseGlucose = (exerciseDays: Set<string>, glucose: DayGlucose[]): CorrelationResult
```

- Un día está «con ejercicio» si está en `exerciseDays`. El promedio de cada grupo pondera por lecturas (`sum(total) / sum(count)`, redondeado a entero), no promedia promedios diarios.
- Si alguno de los dos grupos suma menos de 5 lecturas → `sufficientData: false`, `average` y `difference` en `null` (los `days` sí se informan).

Respuesta de `/summary` (`data`):

```jsonc
{
  "todayMinutes": 20, "goalMinutes": 30, "last7DaysMinutes": 35,
  "correlation": { "sufficientData": true,
    "withExercise": { "days": 6, "average": 118 },
    "withoutExercise": { "days": 12, "average": 141 },
    "difference": -23 }
}
```

`todayMinutes` y `last7DaysMinutes` salen del mismo conjunto de minutos por día (ventana de 30 días ya cargada).

### D-12.5 Perfil: meta de ejercicio (RF-12.7)

Igual que `dailyGlucoseChecks` (fase 8): `exerciseGoalMinutes` en `profile.schemas.ts` (entero 5–300, no nulo), en `profileFields` de `profile.service.ts`, en `types.ts`/`schemas.ts`/`ProfileScreen` del frontend (campo numérico «Meta de ejercicio (min/día)»). Sin migración: la columna ya existe.

### D-12.6 Frontend

```
src/features/exercise/
├── api.ts                    # exerciseApi: create, list, remove, getSummary
├── types.ts
├── schemas.ts                # formulario (mismas reglas que el backend)
├── constants.ts              # ACTIVITY_TYPE_OPTIONS (etiquetas en español)
├── timer.ts                  # lógica pura del cronómetro (D-12.7)
├── hooks/useExercise.ts, hooks/useExerciseSummary.ts, hooks/useStopwatch.ts
├── components/ExerciseSummaryCard.tsx
├── screens/ExerciseScreen.tsx, screens/ExerciseFormScreen.tsx, screens/StopwatchScreen.tsx
└── index.ts
```

Rutas finas: `app/(app)/exercise/{index,form,timer}.tsx`. El formulario recibe `minutes` como parámetro de ruta cuando viene del cronómetro. Historial paginado con «Cargar más» (mismo patrón simple, sin scroll infinito).

### D-12.7 Cronómetro (#39)

Lógica pura en `timer.ts`, sin `setInterval` acumulando segundos (un intervalo se detiene o se retrasa en segundo plano):

```ts
export interface StopwatchState { startedAt: number | null; accumulatedMs: number }
// running  = startedAt !== null
export const elapsedMs = (state, now: number): number =>
  state.accumulatedMs + (state.startedAt === null ? 0 : now - state.startedAt);
export const start = (state, now) => ({ startedAt: now, accumulatedMs: state.accumulatedMs });
export const pause = (state, now) => ({ startedAt: null, accumulatedMs: elapsedMs(state, now) });
export const toMinutes = (ms: number): number => Math.max(1, Math.ceil(ms / 60_000));
```

`useStopwatch()` guarda ese estado y usa un `setInterval` de 1 s **solo para repintar**: el valor mostrado siempre se calcula con `Date.now()`, así que al volver del segundo plano el tiempo es correcto (CA-12.14). No se persiste si la app se cierra del todo (fuera de alcance). «Terminar» hace `router.replace` al formulario con `minutes`.

### D-12.8 Dashboard

`ExerciseSummaryCard` con `useExerciseSummary()` (patrón de `useStreak`, con `refresh` en `refreshAll`): «Hoy: X de Y min» con una barra de progreso simple y, si `sufficientData`, la comparación con/sin ejercicio más la aclaración «Es una asociación, no prueba que el ejercicio sea la causa». Se muestra siempre (con 0 min es una invitación a registrar). Botón «Ejercicio» junto a los existentes.

## 2. Verificación

| CA | Cómo |
|---|---|
| CA-12.1 – CA-12.11 | Tests de integración (`exercise.test.ts`, ampliar `profile.test.ts`) con dos usuarios. |
| CA-12.7 – CA-12.10 | Tests unitarios de `exercise.correlation.ts` + integración de extremo a extremo. |
| CA-12.15 | Test unitario de `timer.ts` (`toMinutes(130000) === 3`, `pause` acumula, `elapsedMs` con reloj simulado). |
| CA-12.12, CA-12.13, CA-12.16, CA-12.17 | Tests de componente + recorrido en dispositivo. |
| CA-12.14, CA-12.18 | Recorrido en dispositivo (segundo plano; backend apagado). |

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| El dashboard llega a 8 botones y 5 tarjetas | Aceptado esta fase; propongo una fase corta posterior que agrupe accesos (menú o pestañas) en vez de seguir sumando botones. |
| La correlación se malinterpreta como causa | Umbral de 5 lecturas por grupo y aclaración visible en la tarjeta. |
| El cronómetro se pierde si el sistema mata la app | Fuera de alcance (spec §3); el paciente siempre puede registrar a mano. |
| Días sin lecturas distorsionan la comparación | El promedio pondera por lecturas y los días sin lecturas no aportan a ningún grupo. |
