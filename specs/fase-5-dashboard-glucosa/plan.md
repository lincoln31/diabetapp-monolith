# Plan técnico F5 — Dashboard con promedios de glucosa

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-5.1 Un solo endpoint para los tres periodos

`GET /api/glucose/stats` (sin parámetros: siempre calcula 7/14/30 días respecto al momento de la petición). No se diseña como `GET /api/glucose/stats?days=7` porque el dashboard siempre pide los tres a la vez (RNF-5.1); un parámetro invitaría a hacer tres llamadas desde el frontend.

Contrato de la respuesta (`data`):

```jsonc
{
  "target": { "min": 80, "max": 180 },       // targetGlucoseMin/Max del usuario (pueden ser null)
  "periods": {
    "7":  { "days": 7,  "count": 12, "average": 132.4, "min": 88, "max": 210, "trend": "improving" },
    "14": { "days": 14, "count": 20, "average": 138.1, "min": 82, "max": 240, "trend": "stable" },
    "30": { "days": 30, "count": 20, "average": 138.1, "min": 82, "max": 240, "trend": "no_data" }
  }
}
```

- `average`/`min`/`max` son `number | null` (RF-5.3); `count` siempre es un entero ≥ 0.
- `trend` ∈ `"improving" | "worsening" | "stable" | "no_data"` (en inglés, como el resto de valores de enum del backend — principio P7).
- Nota: en el ejemplo, 14 y 30 días dan igual porque el usuario solo tiene lecturas en los últimos 14 días; es el comportamiento esperado, no un bug.

### D-5.2 Cálculo en una sola consulta

Una consulta trae todas las lecturas de los últimos 30 días (el periodo más largo) ordenadas por `timestamp`, y el cálculo de los tres periodos y las tendencias se hace en memoria en el servicio, recortando el arreglo ya cargado:

```ts
async getStats(userId: string) {
  const since30 = daysAgo(30);
  const readings = await prisma.glucoseReading.findMany({
    where: { userId, timestamp: { gte: since30 } },
    orderBy: { timestamp: 'asc' },
    select: { value: true, timestamp: true },
  }); // aprovecha el índice (userId, timestamp) — RNF-5.1, RNF-5.3

  const target = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { targetGlucoseMin: true, targetGlucoseMax: true },
  });

  const periods = [7, 14, 30].reduce((acc, days) => {
    const windowStart = daysAgo(days);
    acc[days] = summarize(readings.filter(r => r.timestamp >= windowStart), days);
    return acc;
  }, {} as Record<number, PeriodStats>);

  return { target: { min: target.targetGlucoseMin, max: target.targetGlucoseMax }, periods };
}
```

Con el volumen esperado por paciente (≈ 4 lecturas/día × 30 días ≈ 120 filas), traer las filas y calcular en Node es más simple y suficientemente rápido que tres `aggregate` de Prisma, y ya cumple RNF-5.3 (se verificará con el mismo script `seed-perf.ts` de la fase 1).

### D-5.3 Criterio de tendencia (resuelve la aclaración de la spec §8)

Para un periodo con lecturas `r[0..n-1]` ordenadas por fecha:

1. Si `n < 2` → `"no_data"`.
2. Se parte el arreglo en dos mitades por fecha (no por cantidad de elementos): primera mitad = lecturas con `timestamp < mitad de la ventana`; segunda mitad = el resto.
3. Si alguna mitad queda vacía → `"no_data"` (evita comparar una sola lectura contra el resto).
4. `average(primera)` vs `average(segunda)`. Diferencia relativa `d = (segunda - primera) / primera`.
   - `d <= -0.05` → `"improving"` (bajó 5 % o más: mejor control)
   - `d >= 0.05` → `"worsening"`
   - en otro caso → `"stable"`

Es una heurística simple y explicable al paciente («tu promedio de la segunda mitad del periodo bajó/subió respecto a la primera»), no una regresión estadística — adecuado para una primera versión.

### D-5.4 Esquema de respuesta y ruta

- Nueva ruta `GET /api/glucose/stats` en `glucose.routes.ts`, **antes** de `GET /api/glucose/:id` (si no, Express intentaría interpretar `stats` como un `:id`).
- `glucose.controller.ts`: `getGlucoseStats`.
- `glucose.service.ts`: `getStats(userId)` como en D-5.2.
- No necesita esquema de entrada (sin query ni params); si en el futuro se abre a un rango custom, se añadirá `statsQuerySchema` en `glucose.schemas.ts`.
- Reutiliza `ok()` de `shared/http/respond.ts`, mismo contrato de error que el resto de `/glucose`.

### D-5.5 Estructura del frontend: funcionalidad `dashboard`

Sigue el patrón de la fase 3 (una carpeta por funcionalidad, todas con la misma forma):

```
src/features/dashboard/
├── api.ts             # dashboardApi.getStats()
├── types.ts            # GlucoseStats, PeriodStats, Trend
├── screens/
│   └── DashboardScreen.tsx
├── components/
│   ├── GlucoseAveragesCard.tsx   # la tarjeta de promedios (RF-5.8–RF-5.10)
│   └── EmptyState.tsx            # RF-5.11
└── index.ts
```

`app/(app)/index.tsx` pasa a reexportar `DashboardScreen` (antes `HomeScreen`); `src/features/home/` se elimina (D-5.6).

**Extensible sin rediseñar (RF-5.14):** `DashboardScreen` no sabe de estadísticas de glucosa directamente; renderiza una lista fija de "tarjetas" (por ahora una sola, `GlucoseAveragesCard`) dentro de un `ScrollView` con `RefreshControl`. Sumar la tarjeta de streaks (#25/26) o tip del día (#43) en una spec futura es añadir otro componente a esa lista, sin tocar el layout ni el estado de carga/error/refresco, que vive en `DashboardScreen`.

### D-5.6 `HomeScreen` se retira

`src/features/home/` (creada en la fase 3 solo como placeholder) se borra; sus dos responsabilidades pasan a `dashboard`:
- El saludo y el acceso a «Registrar glucosa»/«Cerrar sesión» se mueven a `DashboardScreen` (encabezado + pie, alrededor de la lista de tarjetas).
- Ninguna otra pantalla importaba `features/home`, así que no hay que actualizar referencias.

### D-5.7 Carga, refresco y error (RF-5.13, CA-5.9 a CA-5.11)

- Estado de sesión ya existe (`useSession`); se añade un hook propio `useDashboardStats()` con `status: 'loading' | 'success' | 'error' | 'empty'`.
- Carga inicial al montar la pantalla.
- **Refresco al volver** (CA-5.9): `useFocusEffect` de `expo-router` vuelve a pedir las estadísticas cada vez que el Dashboard recupera el foco (por ejemplo, al cerrar el modal de «Registrar glucosa»). No se usa una librería de *server state* nueva (cache/invalidación) — se decidió expresamente no introducirla en la fase 3 hasta que hiciera falta (P8); un refetch en foco es la solución más simple que cumple el requisito.
- **Refresco manual** (CA-5.10): `RefreshControl` estándar de React Native sobre el `ScrollView`.
- **Error** (CA-5.11): igual que el resto de la app desde la fase 3 — `toApiError()` + mensaje reutilizando el mismo patrón que otras pantallas (sin alerta emergente; un bloque de error con botón «Reintentar» dentro del propio `ScrollView`, ya que esta es la pantalla que el paciente ve más tiempo).

### D-5.8 Backend: tipos y contrato compartido

`GlucoseStats`/`PeriodStats`/`Trend` se declaran una vez en `diabetapp-backend/src/modules/glucose/glucose.schemas.ts` (tipos TS, no hace falta Zod al no haber entrada que validar) y se replican a mano en `diabetapp-frontend/src/features/dashboard/types.ts`, igual que ya se hace con `MomentOfDay` entre backend y frontend (no hay generación de tipos compartida todavía).

## 2. Contrato de endpoints tras la fase

| Método y ruta | Auth | Entrada | Éxito |
|---|---|---|---|
| `GET /api/glucose/stats` | Sí | — | `{ target: { min, max }, periods: { "7": …, "14": …, "30": … } }` |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-5.1, CA-5.2, CA-5.6 | Tests de integración con `requests.http`/Jest: usuario con lecturas, usuario vacío, dos usuarios distintos. |
| CA-5.3 | Crear lecturas en el día 6 y en el día 8 respecto a "ahora"; comprobar que el periodo de 7 días solo cuenta la del día 6. |
| CA-5.4, CA-5.5 | Fixtures con valores subiendo/bajando/estables, y un caso con una sola lectura. |
| CA-5.7 – CA-5.11 | Expo Go en dispositivo: cuenta nueva sin lecturas, cuenta con lecturas, registrar y volver, deslizar para refrescar, backend apagado. |
| CA-5.12 | Reutilizar `prisma/seed-perf.ts` (fase 1) apuntando a `/glucose/stats` en vez de `/glucose`. |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| El criterio de tendencia (D-5.3) no convence al usuario final | Es una heurística documentada y aislada en una función pura (`calculateTrend`); cambiarla más adelante no toca el resto del endpoint. |
| Traer 30 días de lecturas en una consulta crece mal si un paciente registra muchas veces al día | Con el rango realista (4–10 lecturas/día) son como mucho ~300 filas; si en el futuro hiciera falta, se puede volver a `aggregate` por periodo sin cambiar el contrato de la respuesta. |
| Quitar `HomeScreen` rompe algún enlace | Se comprobó que solo el layout de `app/(app)/index.tsx` la referencia; se revisa con una búsqueda antes de borrar. |
