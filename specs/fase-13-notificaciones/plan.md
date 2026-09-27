# Plan técnico F13 — Notificaciones y recordatorios

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 0. Punto de partida: una prueba de viabilidad primero

`expo-notifications` en **Expo Go** (SDK 57, Android) soporta notificaciones **locales**, pero desde el SDK 53 ya no el push remoto. Esta fase solo usa lo local, pero antes de construir nada se hace una prueba mínima en el celular (T13.2): instalar la librería, programar una notificación a 1 minuto y ver que llega. Si Expo Go no la entrega, la fase se detiene y se vuelve a decidir (probablemente pasar a *development build*, lo que cambia `make up`). Es el mayor riesgo y es barato de descartar.

### Resultado de T13.2 (2026-09-26): NEGATIVO en Expo Go

En Expo Go (Android 15, SDK 57) **importar `expo-notifications` lanza un error no capturado** («Android Push notifications … was removed from Expo Go with the release of SDK 53. Use a development build») y la app queda en pantalla roja. No es solo el push remoto: el módulo entero no se puede cargar, así que tampoco hay notificaciones locales. Mitigación ya aplicada: `notifier.ts` carga el módulo de forma perezosa y **solo fuera de Expo Go** (`Constants.executionEnvironment`); en Expo Go los avisos quedan «no disponibles» (la pantalla lo explica) y el resto de la app funciona. Para que lleguen notificaciones de verdad hace falta una *development build* o la app instalada.

## 1. Decisiones

### D-13.1 Backend: preferencias en el perfil (sin migración, sin módulo nuevo)

Sin tablas ni endpoints nuevos: `GET`/`PUT /api/profile` ganan dos campos que se guardan en las columnas JSON existentes.

```ts
// profile.schemas.ts
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const notificationPreferencesSchema = z.strictObject({
  medicationReminders: z.boolean(),
  glucoseReminders: z.boolean(),
  motivational: z.boolean(),
  achievements: z.boolean(),
});

const glucoseReminderTimes = z
  .array(z.string().regex(TIME, 'Cada horario debe tener formato HH:mm (24 horas)'))
  .max(6, 'No puedes indicar más de 6 horarios')
  .refine((t) => new Set(t).size === t.length, 'Los horarios no pueden repetirse')
  .transform((t) => [...t].sort());
```

- `updateProfileSchema` añade `notificationPreferences: notificationPreferencesSchema.partial()` y `glucoseReminderTimes`. `strictObject` rechaza claves desconocidas (CA-13.3).
- **Parcial dentro del JSON:** al recibir `{ motivational: true }`, el servicio hace *merge* con lo guardado (no reemplaza el objeto entero), para que dos pantallas no se pisen (RF-13.3).
- **Lectura normalizada:** `ProfileService.get` devuelve siempre las cuatro claves, con `false` donde no haya nada guardado, y `glucoseReminderTimes` (`[]` por defecto). El JSON crudo nunca sale tal cual, de modo que un valor viejo o malformado no llega a la app.
- Respuesta (`data`), campos nuevos:

```jsonc
{ "notificationPreferences": { "medicationReminders": false, "glucoseReminders": false, "motivational": false, "achievements": false },
  "glucoseReminderTimes": [] }
```

- `profileFields` incluye las dos columnas; el servicio las mapea a esa forma. Tests de integración: defaults, guardado parcial con merge, validaciones, aislamiento entre usuarios.

### D-13.2 Frontend: `features/notifications/`

```
src/features/notifications/
├── types.ts                    # NotificationPreferences, ScheduledItem
├── constants.ts                # MOTIVATIONAL_MESSAGES (catálogo fijo), hora fija 09:00, id del canal
├── schedule.ts                 # buildSchedule(), función pura (D-13.3)
├── newAchievements.ts          # findNewAchievements(), función pura (D-13.5)
├── notifier.ts                 # capa fina sobre expo-notifications (D-13.4)
├── seenAchievements.ts         # AsyncStorage: logros ya vistos
├── hooks/useNotificationSync.ts, hooks/useNotificationSettings.ts
├── screens/NotificationsScreen.tsx
└── index.ts                    # exporta useNotificationSync y NotificationsScreen
```

Ruta fina `app/(app)/notifications.tsx`, entrada en el layout y un botón «Notificaciones» en `ProfileScreen`. `TimesField` (hoy en `medications/components`) pasa a `shared/components/TimesField.tsx` para reutilizarlo sin que una funcionalidad importe componentes internos de otra; `medications` lo importa desde `shared`.

### D-13.3 Lista de notificaciones (pura)

```ts
export interface ScheduledItem {
  id: string;          // 'med:<medId>:08:00' | 'glucose:07:30' | 'motivation'
  title: string;
  body: string;
  hour: number;
  minute: number;      // disparo diario a esa hora local
}

export const buildSchedule = (input: {
  preferences: NotificationPreferences;
  medications: { id: string; name: string; dosage: string; scheduledTimes: string[] }[];
  glucoseReminderTimes: string[];
  today: Date;
}): ScheduledItem[];
```

- Medicación: un ítem por horario de cada medicamento activo (título «Hora de tu medicación», cuerpo `«<nombre> (<dosis>)»`).
- Glucosa: un ítem por horario («Hora de medir tu glucosa»).
- Motivacional: un ítem a las 9:00 con el mensaje del día (índice = día del año % catálogo, como `getTipOfTheDay`). Como una notificación diaria repetida lleva un texto fijo, el mensaje de **hoy** queda programado y se cambia en cada sincronización (cada apertura del dashboard); es una limitación aceptada.
- Preferencia apagada → sin ítems de ese tipo (CA-13.7).
- Sin dependencias de `expo-notifications`: se prueba con datos fijos (CA-13.4 – CA-13.7).

### D-13.4 Capa `notifier.ts` (única que toca `expo-notifications`)

```ts
export const ensurePermission: () => Promise<'granted' | 'denied'>;        // pide solo si hace falta
export const syncSchedule: (items: ScheduledItem[]) => Promise<void>;      // cancelAll + schedule uno a uno
export const notifyNow: (title: string, body: string) => Promise<void>;    // trigger: null
```

- `syncSchedule`: `cancelAllScheduledNotificationsAsync()` y luego `scheduleNotificationAsync({ identifier: item.id, content: { title, body }, trigger: { type: DAILY, hour, minute, channelId } })`. Cancelar todo y reprogramar es idempotente y evita duplicados y huérfanos (RNF-13.2, RF-13.12).
- Android exige un **canal** (`setNotificationChannelAsync`, importancia alta) creado antes de programar.
- `setNotificationHandler` para que también se muestren con la app abierta.
- Todo `try/catch`: un fallo se registra y no se propaga (RF-13.11).

### D-13.5 Sincronización y logros nuevos

`useNotificationSync()` se monta en `DashboardScreen` (al recuperar el foco, como los demás hooks de tarjetas):

1. Pide en paralelo `profileApi.get()` y `medicationsApi.list()` (por sus `index.ts`) y `achievementsApi.get()` si `achievements` está activo.
2. `buildSchedule(...)` → `syncSchedule(...)`.
3. Logros: `findNewAchievements(unlockedCodes, seenCodes, isFirstRun)`; los nuevos disparan `notifyNow` y se añaden a `seenAchievements` (AsyncStorage). Primera vez (no hay registro): se guardan todos los desbloqueados **sin** avisar (CA-13.8).
4. Si cualquier petición falla, no se toca lo ya programado (RF-13.11, CA-13.14): los recordatorios existentes siguen vigentes.

### D-13.6 Pantalla «Notificaciones»

Cuatro interruptores (`Switch` de React Native, sin librería) y `TimesField` para los horarios de glucosa (visible solo con el interruptor de glucosa activo). Al activar uno: `ensurePermission()`; si `denied`, no se guarda el cambio y se muestra el texto para habilitarlo (con `Linking.openSettings()`). Guardar → `profileApi.update({ notificationPreferences, glucoseReminderTimes })` y luego `syncSchedule` inmediato.

### D-13.7 Dependencia nueva

`npx expo install expo-notifications` (versión que fija Expo para el SDK 57) y, si la pide el plugin, `expo-device`. Se añade el plugin de `expo-notifications` en `app.json` solo si hace falta para el canal/icono. `npx expo-doctor` debe seguir limpio (recordar `legacy-peer-deps`: peers explícitos si faltan).

## 2. Verificación

| CA | Cómo |
|---|---|
| CA-13.1 – CA-13.3 | Tests de integración del perfil (`profile.test.ts`). |
| CA-13.4 – CA-13.8 | Tests unitarios de `buildSchedule` y `findNewAchievements` con datos fijos. |
| CA-13.9 | Test de componente de la pantalla con `notifier` simulado (permiso denegado / concedido). |
| CA-13.10 – CA-13.15 | Recorrido en dispositivo: horarios a 2 minutos, archivar, logro nuevo, backend apagado, todo apagado. |

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| Expo Go no entrega notificaciones locales en Android | Prueba de viabilidad antes de construir (T13.2); si falla, replantear con *development build*. |
| Ahorro de batería / Doze retrasa notificaciones inexactas | Aceptado: son recordatorios, no alarmas; un desfase de minutos es tolerable. No se piden alarmas exactas (permiso adicional y menos amigable). |
| El sistema borra las notificaciones programadas (reinicio, limpieza) | Se reprograman al abrir el dashboard; aviso en la pantalla de que abrir la app las restablece. |
| El mensaje motivacional programado queda «viejo» si no se abre la app | Aceptado: se repite el último programado; se renueva en cada apertura. |
| Dashboard/perfil acumulan botones | Las preferencias van dentro de «Mi perfil» (un botón), no en el dashboard. |
| Ruido para el paciente | Todo apagado por defecto y activable por tipo. |
