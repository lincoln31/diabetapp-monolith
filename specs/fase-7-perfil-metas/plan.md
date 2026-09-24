# Plan técnico F7 — Perfil diabético y metas personales

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-7.1 Módulo nuevo `profile` con `GET` y `PUT /api/profile`

```
src/modules/profile/
├── profile.routes.ts       # GET /, PUT /  (authenticate en todo el router)
├── profile.controller.ts   # getProfile, updateProfile
├── profile.service.ts      # get(userId), update(userId, input)
└── profile.schemas.ts      # updateProfileSchema + tipos
```

Se registra con una línea en `modules/index.ts` (`router.use('/profile', profileRoutes)`). No lleva `:id`: el usuario sale del token (RF-7.5), así no existe el caso de editar el perfil de otro. `PUT` con semántica de actualización parcial, como `PUT /glucose/:id` (fase 1, RF-1.17).

Contrato de la respuesta (`data`):

```jsonc
{
  "typeOfDiabetes": "TYPE_2",       // DiabetesType | null
  "targetGlucoseMin": 80,           // number | null
  "targetGlucoseMax": 180,
  "targetHba1c": 6.5,
  "weight": 72.5,                   // kg
  "height": 170,                    // cm
  "activityLevel": "MODERATE",      // ActivityLevel | null
  "onboardingCompleted": true
}
```

### D-7.2 Validación (resuelve la aclaración de la spec §8)

```ts
export const updateProfileSchema = z
  .object({
    typeOfDiabetes: z.enum(DiabetesType).nullable(),
    activityLevel: z.enum(ActivityLevel).nullable(),
    targetGlucoseMin: z.number().int().min(40).max(400).nullable(),
    targetGlucoseMax: z.number().int().min(40).max(400).nullable(),
    targetHba1c: z.number().min(4).max(14).nullable(),
    weight: z.number().min(20).max(400).nullable(),
    height: z.number().min(50).max(250).nullable(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debes enviar al menos un campo' });
```

- Los enums se importan de `@prisma/client` (una sola lista de valores, P3).
- Cada campo es `nullable().optional()` (por `.partial()`): `undefined` = no tocar, `null` = borrar (RF-7.2).
- **Regla cruzada del rango (RF-7.4)** en el servicio, no en el esquema, porque necesita el valor guardado: se lee `targetGlucoseMin/Max` actuales, se aplica encima lo enviado, y si ambos quedan no nulos y `min >= max` se lanza `new AppError('VALIDATION_ERROR', undefined, [{ field, message }])`. El `field` es el que el usuario acaba de enviar (`targetGlucoseMin` si envió el mínimo; `targetGlucoseMax` si envió el máximo; el máximo si envió ambos).
- Enviar solo uno de los dos campos del rango es válido mientras el resultado sea coherente (CA-7.6).

### D-7.3 Actualización y `onboardingCompleted`

`update` hace una lectura del rango actual (solo si el cuerpo toca el rango), valida, y luego un único `prisma.user.update({ where: { id: userId }, data: { ...input, ...(marcar onboarding) }, select: profileFields })`. Con `where: { id: userId }` sobre el propio usuario no hace falta el patrón `updateMany` de la fase 1 (no hay riesgo de tocar un recurso ajeno: el id sale del token).

`onboardingCompleted: true` se incluye en el `data` del primer guardado (RF-7.13, sujeto a la decisión pendiente). Si se decide lo contrario, se elimina esa línea; no hay otro cambio.

### D-7.4 Logs

El `requestLogger` ya no imprime body ni cabeceras (fase 1, RNF); no se añade ningún `console.log` en el módulo. Se comprueba con una revisión de código (RNF-7.2).

### D-7.5 Frontend: funcionalidad `profile`

```
src/features/profile/
├── api.ts              # profileApi.get(), profileApi.update(input)
├── types.ts            # Profile, UpdateProfileInput, DiabetesType, ActivityLevel
├── schemas.ts          # profileFormSchema (mismas reglas que el backend)
├── constants.ts        # DIABETES_TYPE_OPTIONS, ACTIVITY_LEVEL_OPTIONS (etiquetas en español)
├── hooks/useProfile.ts # estado de carga del perfil (para el formulario y para el aviso)
├── screens/ProfileScreen.tsx
└── index.ts            # exporta ProfileScreen, profileApi, useProfile, tipos
```

- `DiabetesType` ya existe en `features/auth/types.ts`; se **importa** de `@/src/features/auth` (por su `index.ts`, ya lo exporta) en vez de redeclararlo.
- Ruta nueva `app/(app)/profile.tsx` (fina: `export { ProfileScreen as default } from '@/src/features/profile'`), registrada en `(app)/_layout.tsx` como pantalla normal (no modal).
- Formulario con `react-hook-form` + `zodResolver` (patrón de la fase 3). Los campos numéricos se capturan como texto (igual que `value` en `createGlucoseFormSchema`) y se convierten a número o `null` al enviar; un campo vacío envía `null`. Errores de servidor con `applyServerErrors` (campos: los 7 del formulario).
- `Picker` (`@react-native-picker/picker`, ya instalado) para tipo de diabetes y actividad, como el «Momento del día».
- El dashboard suma un botón «Mi perfil» (`variant="outline"`) junto a «Exportar reporte».

### D-7.6 Alerta de rango (#21)

Función pura en la funcionalidad `glucose`:

```ts
export type RangeStatus = 'low' | 'high' | 'in_range' | 'unknown';
export const getRangeStatus = (value: number, min: number | null, max: number | null): RangeStatus
```

- `unknown` si el valor no es un número válido o **ambos** límites son `null`; con un solo límite definido se evalúa contra ese.
- `low` si `value < min`; `high` si `value > max`; si no, `in_range`.
- `AddGlucoseScreen` la evalúa con el valor que se escribe (`useWatch` sobre `value`) y el perfil de `useProfile()`. Muestra, bajo el campo, un bloque de aviso: «Por debajo de tu rango (80–180 mg/dL)» / «Por encima de tu rango (80–180 mg/dL)» en `COLORS.warning`/`COLORS.error`, más «Consulta a tu médico si se repite» (decisión pendiente §8). `in_range` y `unknown` no muestran nada (RF-7.12).
- **Importación entre funcionalidades:** `glucose` necesita `useProfile` de `profile`, y `profile` no necesita nada de `glucose`. Solo se añade la zona de ESLint `glucose → profile (solo index.ts)`; no hay dependencia circular.
- Si `useProfile` está cargando o falló, `getRangeStatus` recibe `null`/`null` y devuelve `unknown` (RF-7.12): el formulario funciona exactamente como hoy.

### D-7.7 Refresco del dashboard tras editar el perfil

No requiere código nuevo: `useDashboardStats` y `useHba1cProjection` ya vuelven a pedir sus datos con `useFocusEffect` cuando el dashboard recupera el foco (fases 5 y 6), y `router.back()` desde `ProfileScreen` provoca justo eso (RF-7.10, HU-7.6).

## 2. Contrato de endpoints tras la fase

| Método y ruta | Auth | Entrada | Éxito |
|---|---|---|---|
| `GET /api/profile` | Sí | — | Perfil (D-7.1) |
| `PUT /api/profile` | Sí | Cualquier subconjunto no vacío de los 7 campos; `null` borra | Perfil actualizado (D-7.1) |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-7.1 – CA-7.8 | Tests de integración (`test/profile.test.ts`): perfil propio, parcial, `null`, cuerpo vacío, límites y enums, rango incoherente con valor guardado, sin sesión, y `/glucose/stats` reflejando el rango nuevo. |
| CA-7.9 – CA-7.11 | Recorrido en dispositivo. Los esquemas del formulario se prueban con tests unitarios (rango incoherente, campos vacíos → `null`). |
| CA-7.12 – CA-7.14 | Tests unitarios de `getRangeStatus` (bordes exactos 80 y 180 = `in_range`; 79 = `low`; 181 = `high`; límites `null`), más comprobación en dispositivo. |
| CA-7.15 | Recorrido en dispositivo con el backend apagado al abrir «Registrar glucosa». |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| El aviso de rango se interpreta como consejo médico | Texto neutro, sin instrucciones de tratamiento, y no bloquea el guardado; los umbrales graves fijos quedan fuera hasta validarlos con un profesional (spec §8). |
| El rango quedó incoherente por una carrera entre dos ediciones | La regla se comprueba en el servidor contra el valor guardado (D-7.2); un solo usuario edita su propio perfil, así que el riesgo es bajo. |
| `AddGlucoseScreen` depende de una petición extra (`GET /profile`) | Su fallo no cambia el comportamiento (RF-7.12); se pide una vez al abrir la pantalla. |
| Los tests del formulario con `renderHook` no funcionan en este proyecto (ver nota de T5.15) | La lógica testeable vive en funciones puras (`getRangeStatus`, `profileFormSchema`) y en componentes, no en hooks. |
