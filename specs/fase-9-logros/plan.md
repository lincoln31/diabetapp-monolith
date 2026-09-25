# Plan técnico F9 — Logros

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-9.1 Módulo nuevo `achievements`, sin tabla (resuelve la aclaración de la spec §8)

```
src/modules/achievements/
├── achievements.catalog.ts   # catálogo fijo (D-9.2), sin BD
├── achievements.service.ts   # get(userId): aplica el catálogo a los datos reales del usuario
├── achievements.controller.ts
└── achievements.routes.ts    # GET / (authenticate)
```

Se registra con una línea en `modules/index.ts` (`router.use('/achievements', achievementsRoutes)`). Sin migración: no toca `schema.prisma`.

### D-9.2 Catálogo (resuelve la aclaración de la spec §8)

```ts
export type AchievementMetric = 'streak' | 'readingsCount';

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { code: 'STREAK_3', name: 'Constancia inicial', description: 'Registra glucosa 3 días seguidos', metric: 'streak', threshold: 3 },
  { code: 'STREAK_7', name: 'Una semana completa', description: 'Registra glucosa 7 días seguidos', metric: 'streak', threshold: 7 },
  { code: 'STREAK_30', name: 'Hábito consolidado', description: 'Registra glucosa 30 días seguidos', metric: 'streak', threshold: 30 },
  { code: 'READINGS_10', name: 'Primeros pasos', description: 'Registra 10 lecturas en total', metric: 'readingsCount', threshold: 10 },
  { code: 'READINGS_50', name: 'En marcha', description: 'Registra 50 lecturas en total', metric: 'readingsCount', threshold: 50 },
  { code: 'READINGS_100', name: 'Constancia probada', description: 'Registra 100 lecturas en total', metric: 'readingsCount', threshold: 100 },
];
```

Es una lista ordenable/ampliable sin migración (es código, no datos); cambiar un umbral o agregar un logro es una línea nueva aquí.

### D-9.3 Cálculo: dos consultas acotadas, ninguna se guarda

```ts
async getAchievements(userId: string): Promise<AchievementProgress[]> {
  const [readingsCount, { longest: streak }] = await Promise.all([
    prisma.glucoseReading.count({ where: { userId } }),
    this.glucoseService.getLongestStreak(userId), // reexporta calculateStreaks del módulo glucose (D-8.2)
  ]);

  const values: Record<AchievementMetric, number> = { streak, readingsCount };

  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    currentValue: values[achievement.metric],
    unlocked: values[achievement.metric] >= achievement.threshold,
  }));
}
```

- `readingsCount`: `prisma.glucoseReading.count({ where: { userId } })`, ya usado en `GlucoseService.list` (RNF-9.1).
- `streak`: se añade `GlucoseService.getLongestStreak(userId)` — la misma consulta agrupada por día que `getStreak` (D-8.2 de la fase 8), pero sin pedir «hoy» (no hace falta para la mejor racha histórica); reutiliza `calculateStreaks` del módulo `glucose` calculando solo `longest`. Se evita duplicar la lógica de agrupado: `achievements.service.ts` depende de `GlucoseService`, no repite SQL.
- Nunca se guarda un «desbloqueado»: como ninguna de las dos métricas baja con el tiempo (RF-9.3), recalcular en cada petición da siempre el resultado correcto y es tan barato como las otras tarjetas del dashboard.

### D-9.4 Ruta y contrato

`GET /api/achievements` (sin `/:id`: siempre el propio usuario). Respuesta (`data`):

```jsonc
{
  "achievements": [
    { "code": "STREAK_3", "name": "Constancia inicial", "description": "...", "metric": "streak", "threshold": 3, "currentValue": 10, "unlocked": true },
    { "code": "READINGS_50", "name": "En marcha", "description": "...", "metric": "readingsCount", "threshold": 50, "currentValue": 15, "unlocked": false }
  ]
}
```

### D-9.5 Frontend: pantalla dedicada (resuelve la aclaración de la spec §8)

```
src/features/achievements/
├── api.ts                     # achievementsApi.list()
├── types.ts                   # Achievement, AchievementMetric
├── hooks/useAchievements.ts   # loading/success/error, mismo patrón que useProfile
├── screens/AchievementsScreen.tsx
└── index.ts
```

- Ruta `app/(app)/achievements.tsx` (fina), registrada en `(app)/_layout.tsx` como pantalla normal.
- `DashboardScreen` suma un botón «Mis Logros» (`variant="outline"`) junto a «Mi perfil», sin tarjeta-resumen (RF-9.6, decisión de la spec: nada impide añadirla después, es una pieza más de la lista).
- `AchievementsScreen`: lista simple (`FlatList` o `.map`, el catálogo es fijo y corto — 6 elementos, no hace falta virtualización); cada fila con ícono, nombre, descripción y:
  - desbloqueado: ícono relleno + fecha no aplica (no se guarda cuándo, D-9.3) + marca visual (fondo verde, como el resto de badges de la app);
  - bloqueado: ícono atenuado + «X de Y» con el valor actual y el umbral (RF-9.7, RF-9.8).
- Ícono nuevo `trophy` (`trophy-outline`) en `Icon.tsx`, reutilizando `flame` (fase 8) para los logros de racha.
- Estados de carga/error con el mismo patrón que `ProfileScreen` (spinner, mensaje + «Reintentar»), sin `RefreshControl`: el catálogo cambia solo cuando el paciente actúa en otra pantalla (registrar, o el tiempo pasa), así que se recarga al entrar (`useEffect`), sin necesidad de refresco por foco ni manual.

## 2. Contrato de endpoints tras la fase

| Método y ruta | Auth | Entrada | Éxito |
|---|---|---|---|
| `GET /api/achievements` | Sí | — | `{ achievements: AchievementProgress[] }` (D-9.4) |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-9.1, CA-9.2, CA-9.4, CA-9.5 | Tests de integración: sin lecturas, con racha y volumen que cruzan algunos umbrales pero no otros, aislamiento entre usuarios, sin sesión. |
| CA-9.3 | Test de integración: crear una racha larga en el pasado (ya rota hoy) y comprobar que el logro de racha sigue desbloqueado aunque la racha *actual* sea 0. |
| CA-9.6 – CA-9.8 | Recorrido en dispositivo. |
| CA-9.9 | `prisma/seed-perf.ts` (se le añade la medición del endpoint, como en las fases 5 y 8). |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| El catálogo fijo en código no permite personalizarlo por usuario | Fuera de alcance (no hay issue que lo pida); si hiciera falta, `ACHIEVEMENTS` pasaría a una tabla en una spec futura sin cambiar el contrato del endpoint. |
| Duplicar la lógica de racha entre `glucose` y `achievements` | Se evita: `achievements.service.ts` llama a un método nuevo de `GlucoseService` (`getLongestStreak`), no reimplementa el agrupado por día. |
| Logros que sí podrían "perderse" en el futuro (p. ej. un logro semanal) | No se contempla en esta fase (RF-9.3 asume métricas monótonas); un logro no monótono necesitaría guardar el desbloqueo y sería una spec aparte. |
