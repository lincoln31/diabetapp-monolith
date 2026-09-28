# Tareas F13 — Notificaciones y recordatorios

Implementa: [plan.md](plan.md) · Rama sugerida: `feat/fase-13-notificaciones`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aclaraciones y viabilidad

- [x] **T13.1** Resolver las aclaraciones de la spec (§8: locales en vez de FCM, alcance de #52–#54, preferencias en el perfil, apagadas por defecto, mensaje a las 9:00, acceso desde «Mi perfil»).
- [x] **T13.2** **Prueba de viabilidad — NEGATIVO en Expo Go** (ver plan §0: el módulo no se puede importar; la app degrada sin avisos): instalar `expo-notifications`, programar una notificación local a 1 minuto y confirmar que llega en Expo Go (Android 15). Si no llega, detener la fase y replantear. — plan §0 · depende de T13.1

## Bloque A — Backend: preferencias en el perfil

- [x] **T13.3** `notificationPreferencesSchema` (estricto) y `glucoseReminderTimes` en `profile.schemas.ts` (D-13.1). — RF-13.1, RF-13.2 · depende de T13.1
- [x] **T13.4** `ProfileService`: lectura normalizada con defaults y guardado con *merge* dentro del JSON. — RF-13.1, RF-13.3 · depende de T13.3
- [x] **T13.5 [P]** Tests de integración: defaults, guardado parcial con merge, validaciones (horarios mal escritos, repetidos, más de 6, clave desconocida, valor no booleano), aislamiento entre usuarios. — CA-13.1 – CA-13.3 · depende de T13.4
- [x] **T13.6 [P]** Ampliar `requests.http`. — depende de T13.4

## Bloque B — Frontend: lógica pura

- [x] **T13.7** `types.ts`, `constants.ts` (catálogo motivacional, 9:00, canal). — depende de T13.2
- [x] **T13.8** `buildSchedule` (D-13.3) con tests unitarios: medicación, glucosa, motivacional, todo apagado, identificadores estables. — RF-13.6 – RF-13.8, RF-13.12, RNF-13.1, RNF-13.2 · depende de T13.7
- [x] **T13.9 [P]** `findNewAchievements` con tests: primera sincronización sin avisos, solo los nuevos, sin repetir. — RF-13.9 · depende de T13.7
- [x] **T13.10 [P]** Perfil del frontend: `notificationPreferences` y `glucoseReminderTimes` en `profile/types.ts`. — depende de T13.4

## Bloque C — Frontend: integración

- [x] **T13.11** Mover `TimesField` a `shared/components/TimesField.tsx` y actualizar `medications`. — depende de T13.1
- [x] **T13.12** `notifier.ts` (permiso, canal, `syncSchedule`, `notifyNow`, manejador en primer plano), todo con `try/catch`. — RF-13.5, RF-13.11 · depende de T13.2, T13.8
- [x] **T13.13** `seenAchievements.ts` (AsyncStorage) y `useNotificationSync()`: perfil + medicamentos + logros → programar y avisar. — RF-13.9, RF-13.10 · depende de T13.9, T13.10, T13.12
- [x] **T13.14** Montar `useNotificationSync()` en `DashboardScreen`. — RF-13.10 · depende de T13.13
- [x] **T13.15** `useNotificationSettings()` y `NotificationsScreen` (interruptores, permiso, horarios de glucosa, guardar + sincronizar). — RF-13.4, RF-13.5 · depende de T13.11, T13.12
- [x] **T13.16** Ruta `app/(app)/notifications.tsx`, entrada en el layout y botón «Notificaciones» en `ProfileScreen`. — depende de T13.15
- [x] **T13.17 [P]** Tests de componente de la pantalla (permiso concedido/denegado con `notifier` simulado, horarios visibles solo con glucosa activa). — CA-13.9 · depende de T13.15

## Bloque D — Verificación y cierre

- [x] **T13.18** Recorrido (development build, moto g34 5G; encontrado y corregido: sincronización que perdía el aviso dentro de la ventana de la alarma inexacta, y falta de sincronización al volver del segundo plano): CA-13.10 – CA-13.15 (horarios a 2 minutos, archivar, logro nuevo, backend apagado, todo apagado).
- [x] **T13.19** `tsc`, lint, tests completos de ambos proyectos y `npx expo-doctor`.
- [ ] **T13.20** Marcar CA-13.1 … CA-13.15 en el PR; cerrar #16, #35, #52, #53, #54 (#54 con la aclaración) y #51 con el comentario de §8; actualizar `CLAUDE.md` y `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-13.1, RF-13.2, RF-13.3 | T13.3 – T13.5 | CA-13.1 – CA-13.3 |
| RF-13.4 | T13.15, T13.16 | CA-13.9 |
| RF-13.5 | T13.12, T13.15 | CA-13.9 |
| RF-13.6 | T13.8 | CA-13.4, CA-13.10 |
| RF-13.7 | T13.8 | CA-13.5, CA-13.11 |
| RF-13.8 | T13.8 | CA-13.6 |
| RF-13.9 | T13.9, T13.13 | CA-13.8, CA-13.13 |
| RF-13.10 | T13.13, T13.14 | CA-13.12 |
| RF-13.11 | T13.12, T13.13 | CA-13.14 |
| RF-13.12 | T13.8, T13.12 | CA-13.7, CA-13.15 |
| RNF-13.1, RNF-13.2 | T13.8, T13.12 | CA-13.4 |
| RNF-13.4 | T13.5, T13.17 | — |
