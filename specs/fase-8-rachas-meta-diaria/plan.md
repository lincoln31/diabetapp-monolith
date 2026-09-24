# Plan técnico F8 — Rachas y meta diaria de glucometrías

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-8.1 Endpoint `GET /api/glucose/streak`

En el módulo `glucose` (es un dato derivado de las lecturas), sin parámetros, registrado **antes** de `GET /glucose/:id` como `/stats`, `/hba1c` y `/export/*`.

```jsonc
{
  "current": 3,            // días seguidos que terminan hoy (o ayer si hoy aún no tiene lecturas)
  "longest": 12,           // mejor racha de todo el historial
  "todayCount": 2,         // lecturas de hoy (día local del usuario)
  "dailyGoal": 4,          // User.dailyGlucoseChecks (por defecto 4)
  "goalReachedToday": false
}
```

### D-8.2 Cálculo: agrupar en la base de datos, racha en una función pura

Una consulta agrupa por día **local** del usuario; la zona horaria va como parámetro (Prisma `$queryRaw` con plantilla etiquetada: se parametriza, no se concatena):

```ts
const rows = await prisma.$queryRaw<{ day: string; count: number }[]>`
  SELECT to_char(("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
         COUNT(*)::int AS count
  FROM glucose_readings
  WHERE "userId" = ${userId}
  GROUP BY day
  ORDER BY day DESC`;
```

- `timestamp` se guarda en UTC sin zona; `AT TIME ZONE 'UTC'` lo convierte a instante y el segundo `AT TIME ZONE ${tz}` a la hora local (CA-8.6).
- «Hoy» sale de la misma zona: `SELECT to_char(now() AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS today`, ambas en un `prisma.$transaction`, junto con la lectura de `dailyGlucoseChecks` y `timezone` del usuario.
- `tz = user.timezone ?? 'America/Bogota'` (mismo valor por defecto que el modelo).
- El agrupado aprovecha el índice `(userId, timestamp)` para filtrar por usuario; devuelve como máximo un renglón por día con lecturas (≈365 por año), no las lecturas (RNF-8.1).

Función pura en `glucose.streak.ts` (mismo patrón que `summarize` y `projectHba1c`):

```ts
calculateStreaks(days: string[] /* 'YYYY-MM-DD', distintos, cualquier orden */, today: string)
  → { current: number; longest: number }
```

- Ordena los días y recorre buscando **consecutivos**; la diferencia entre días se calcula sobre fechas de calendario en UTC (`Date.UTC(y, m-1, d)`), nunca sumando 24 h a una hora local, para que los cambios de horario de verano no rompan la continuidad.
- `longest` = mayor tramo consecutivo.
- `current` = tramo que contiene a `today`; si `today` no está pero sí `ayer` (`today − 1`), el tramo que contiene a ayer; si no, 0 (RF-8.3).

### D-8.3 Zona horaria inválida

`User.timezone` no es editable hoy (solo el valor por defecto), así que un valor inválido no puede entrar por la API. Aun así, `AT TIME ZONE` con un nombre inexistente lanza error en PostgreSQL; el servicio lo deja subir como `INTERNAL_ERROR` (no se enmascara: sería un dato corrupto). Si más adelante se hace editable, se valida contra `Intl.supportedValuesOf('timeZone')` en su esquema Zod.

### D-8.4 Perfil: `dailyGlucoseChecks` (RF-8.8)

En `profile.schemas.ts`: `dailyGlucoseChecks: z.number().int().min(1).max(20)` (sin `.nullable()`: la meta no se puede borrar; si el usuario vacía el campo, la app no lo envía). Se añade a `profileFields` del servicio y al tipo `Profile` del frontend. Sin migración: la columna existe.

### D-8.5 Frontend

```
src/features/dashboard/
├── api.ts                         # + streakApi.get()
├── types.ts                       # + StreakStats
├── hooks/useStreak.ts             # mismo patrón que useHba1cProjection (loading/success/error + refresh)
├── components/StreakCard.tsx      # RF-8.9 – RF-8.11
└── screens/DashboardScreen.tsx    # suma <StreakCard /> y refresca con refreshAll
```

- `DashboardScreen` ya tiene `refreshAll = () => Promise.all([...])`; se añade `streak.refresh()` (RF-8.12).
- Se muestra solo con `status === 'success'` del dashboard y de la propia racha (RF-8.13), igual que `Hba1cCard`.
- Ícono: se añade `flame` (`flame-outline`) a `AppIconName` en `Icon.tsx`.
- Estados de la tarjeta: `current > 0` → «N días» + señal de fuego; `current === 0` → invitación a empezar (RF-8.10); `goalReachedToday` → marca verde «Meta de hoy cumplida» (RF-8.11).
- Perfil: `profile/schemas.ts`, `profile/types.ts` y `ProfileScreen` ganan el campo «Lecturas por día» (texto → entero 1–20; vacío = no se envía).

## 2. Contrato de endpoints tras la fase

| Método y ruta | Auth | Entrada | Éxito |
|---|---|---|---|
| `GET /api/glucose/streak` | Sí | — | `{ current, longest, todayCount, dailyGoal, goalReachedToday }` |
| `PUT /api/profile` | Sí | + `dailyGlucoseChecks` (1–20) | Perfil con `dailyGlucoseChecks` |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-8.1 – CA-8.5, CA-8.7 | Tests unitarios de `calculateStreaks` (fechas sintéticas): hoy/ayer, sin hoy, hueco, dos rachas, días repetidos, hueco rellenado. |
| CA-8.6 | Test de integración creando una lectura a las 23:30 hora de Bogotá (04:30 UTC del día siguiente) y comprobando en qué día cae. |
| CA-8.8 – CA-8.11 | Tests de integración: sin lecturas, otro usuario, `todayCount`/`goalReachedToday`, y `PUT /profile` con la meta. |
| CA-8.12 – CA-8.16 | Recorrido en dispositivo; tests de componente de `StreakCard` (con racha, sin racha, meta cumplida). |
| CA-8.17 | `prisma/seed-perf.ts` (se le añade la medición del endpoint, como en las fases 5). |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| Errores de un día por husos horarios o cambios de horario | La lógica de fechas usa calendario UTC sobre cadenas `YYYY-MM-DD` ya localizadas por PostgreSQL; hay un test con una lectura en el borde de medianoche. |
| «Racha por constancia» se siente demasiado fácil | Es una decisión de la spec (§8); la lógica de qué día cuenta está aislada, cambiarla a «cumple la meta» es filtrar `count >= dailyGoal` antes de calcular. |
| SQL crudo en un proyecto que usa el cliente tipado de Prisma | Una sola consulta acotada, parametrizada con plantilla etiquetada (sin concatenar); el resto del módulo sigue usando el cliente. |
| Los tests con `renderHook` no funcionan en este proyecto | La lógica testeable está en `calculateStreaks` y en componentes; `useStreak` sigue el patrón ya verificado en dispositivo. |
