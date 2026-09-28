# Spec F13 — Notificaciones y recordatorios

| Campo | Valor |
|---|---|
| Fase | 13 |
| Estado | Implementada |
| Fecha | 2026-09-26 |
| Depende de | Fase 7 (perfil), Fase 9 (logros), Fase 10 (consejos), Fase 11 (horarios de medicación) |
| Issues relacionados | Cierra #16, #35, #52, #53, #54. #51 (FCM) se descarta por ahora (ver §8) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H13.1 La app solo sirve si el paciente se acuerda de abrirla | Medir glucosa y tomar la medicación son acciones con horario; hoy la app no avisa de nada. |
| H13.2 Los horarios de medicación ya existen | La fase 11 guarda `scheduledTimes` (`HH:mm` locales) de cada medicamento justamente para esto (#35). |
| H13.3 Las preferencias ya tienen dónde vivir | `User.notificationPreferences` y `User.reminderTimes` (JSON) existen en el modelo desde el inicio; ningún endpoint los usa. |
| H13.4 Los issues asumen un servidor que envía push por FCM | #51–54 piden Firebase Cloud Messaging y «lógica de backend». Eso exige un proyecto de Firebase, credenciales de servidor y una *development build* (Expo Go ya no recibe push remoto en Android desde el SDK 53). Nada de eso existe hoy en el repo ni se puede verificar con el flujo actual (`make up` + Expo Go). |
| H13.5 Casi todos los avisos pedidos no necesitan servidor | Un recordatorio «a las 8:00» o «una vez al día» es una notificación **local programada en el celular**: funciona sin conexión, sin cuenta de Firebase y a la hora exacta aunque el backend esté caído. |

## 2. Objetivo

Que el paciente reciba avisos a tiempo — tomar su medicación, medir su glucosa, un mensaje motivacional y el aviso de un logro nuevo — y pueda elegir cuáles quiere, sin depender de un servidor de notificaciones.

## 3. Alcance

**Incluye:** #16 (preferencias), #35 (recordatorios de medicación), #52 (recordatorios de glucosa), #53 (mensaje motivacional) y #54 (aviso de logro nuevo), todos como **notificaciones locales** (ver §8).

**No incluye:**
- Firebase Cloud Messaging, tokens de dispositivo y envío desde el backend (#51): ver §8.
- Notificaciones push remotas o programadas desde el servidor.
- Avisar de un logro con la app cerrada del todo (sin servidor solo se detecta al abrir la app; ver §8).
- Acciones dentro de la notificación («Tomé», «Posponer»), historial de notificaciones, horario de silencio, recordatorios por medicamento individual.
- Probar en iOS (el proyecto solo se verifica en Android).

## 4. Historias de usuario

- **HU-13.1** Como paciente, quiero elegir qué avisos recibo (medicación, glucosa, motivacionales, logros), para que la app no me moleste con lo que no quiero.
- **HU-13.2** Como paciente, quiero que la app me recuerde tomar cada medicamento a las horas que definí.
- **HU-13.3** Como paciente, quiero fijar a qué horas me recuerda medir mi glucosa.
- **HU-13.4** Como paciente, quiero recibir un mensaje motivacional diario.
- **HU-13.5** Como paciente, quiero enterarme cuando desbloqueo un logro.
- **HU-13.6** Como paciente, quiero que los recordatorios lleguen aunque no tenga internet.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-13.1 | `GET`/`PUT /api/profile` DEBEN leer y guardar las preferencias de notificaciones: `medicationReminders`, `glucoseReminders`, `motivational` y `achievements` (booleanos, **apagados por defecto**) y `glucoseReminderTimes` (lista de 0 a 6 horarios `HH:mm`, sin repetir, ordenados). | HU-13.1, HU-13.3 |
| RF-13.2 | Las preferencias se guardan en las columnas JSON existentes (`notificationPreferences`, `reminderTimes`), con esquema Zod que rechaza claves desconocidas y valores mal formados (`VALIDATION_ERROR` con `fields`). Sin migración. | HU-13.1 |
| RF-13.3 | La actualización es parcial, como el resto del perfil: solo se cambia lo enviado. | HU-13.1 |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-13.4 | DEBE existir una pantalla «Notificaciones» (accesible desde «Mi perfil») con un interruptor por tipo de aviso y el editor de horarios de glucosa. | HU-13.1, HU-13.3 |
| RF-13.5 | Al **activar** un tipo de aviso, la app DEBE pedir el permiso del sistema si aún no lo tiene; si se deniega, el interruptor queda apagado y se explica cómo habilitarlo en los ajustes del celular. | HU-13.1 |
| RF-13.6 | DEBE programarse un recordatorio **diario** por cada horario de cada medicamento activo, con el nombre y la dosis, mientras `medicationReminders` esté activo. | HU-13.2 |
| RF-13.7 | DEBE programarse un recordatorio diario por cada horario de `glucoseReminderTimes`, mientras `glucoseReminders` esté activo. | HU-13.3 |
| RF-13.8 | DEBE programarse un mensaje motivacional diario a las 9:00, tomado de un catálogo fijo que rota por día, mientras `motivational` esté activo. | HU-13.4 |
| RF-13.9 | Cuando la app detecte un logro **nuevo** desbloqueado (comparando con los ya vistos en el celular), DEBE mostrar una notificación inmediata una sola vez, mientras `achievements` esté activo. La primera vez que se sincroniza, los logros ya desbloqueados se registran sin avisar. | HU-13.5 |
| RF-13.10 | Los recordatorios DEBEN **sincronizarse** al abrir el dashboard, al volver la app del segundo plano y al guardar las preferencias: se deja programado exactamente lo que corresponde al estado actual (se cancela lo que sobra y se reprograma solo lo nuevo o cambiado) (medicamentos, preferencias). Archivar o editar un medicamento se refleja en la siguiente sincronización. | HU-13.2 |
| RF-13.11 | Una vez programados, los recordatorios DEBEN dispararse sin conexión y con el backend caído; un fallo al sincronizar NO DEBE cerrar la app ni mostrar un error intrusivo. | HU-13.6 |
| RF-13.12 | Con todos los avisos apagados, la sincronización DEBE dejar **cero** notificaciones programadas. | HU-13.1 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-13.1 | La construcción de la lista de notificaciones a programar es una **función pura** (`buildSchedule`) con tests unitarios; el acceso a `expo-notifications` queda en una capa fina. |
| RNF-13.2 | Cada notificación programada lleva un identificador estable (p. ej. `med:<id>:08:00`), para poder cancelar y reprogramar sin duplicados. |
| RNF-13.3 | Los horarios se interpretan en la hora **local del celular** (igual que los `HH:mm` de la fase 11). |
| RNF-13.4 | Sigue las reglas vigentes: contrato de API de la fase 1, sin `any`, tests de integración del perfil, reglas de dependencia entre funcionalidades (por `index.ts`). |
| RNF-13.5 | Un límite razonable de notificaciones programadas: como máximo ~60 (medicamentos × horarios + glucosa + 1), muy por debajo del tope de Android. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-13.1 | Un usuario nuevo | Pide su perfil | Las cuatro preferencias vienen en `false` y `glucoseReminderTimes` vacío | RF-13.1 |
| CA-13.2 | Un usuario | Guarda preferencias válidas | Se guardan y las siguientes lecturas del perfil las devuelven; los demás campos no cambian | RF-13.1, RF-13.3 |
| CA-13.3 | Un cuerpo inválido (horario mal escrito, repetidos, más de 6, clave desconocida, valor no booleano) | Guarda preferencias | Recibe `VALIDATION_ERROR` con `fields` | RF-13.2 |
| CA-13.4 | 2 medicamentos con 2 y 1 horarios y `medicationReminders` activo | Se construye la lista | Hay 3 recordatorios con identificador estable, nombre y dosis en el mensaje | RF-13.6, RNF-13.2 |
| CA-13.5 | `glucoseReminders` activo con dos horarios | Se construye la lista | Hay 2 recordatorios de glucosa a esas horas | RF-13.7 |
| CA-13.6 | `motivational` activo | Se construye la lista | Hay 1 mensaje diario a las 9:00; en días distintos el mensaje puede cambiar | RF-13.8 |
| CA-13.7 | Todos los avisos apagados | Se construye la lista | La lista está vacía | RF-13.12 |
| CA-13.8 | Logros ya vistos {A, B} y desbloqueados {A, B, C} | Se detectan los nuevos | Solo C avisa; con la primera sincronización no avisa ninguno | RF-13.9 |
| CA-13.9 | El paciente activa un aviso sin permiso concedido | Toca el interruptor | Se pide el permiso; si lo deniega, queda apagado con la explicación | RF-13.5 |
| CA-13.10 | Un medicamento con un horario dos minutos en el futuro | Se sincroniza y se espera | Llega la notificación con su nombre y dosis a esa hora | RF-13.6 |
| CA-13.11 | Un horario de glucosa dos minutos en el futuro | Se sincroniza y se espera | Llega el recordatorio de glucosa | RF-13.7 |
| CA-13.12 | Un medicamento archivado | Se abre el dashboard | Sus recordatorios dejan de programarse | RF-13.10 |
| CA-13.13 | Un logro nuevo desbloqueado con `achievements` activo | Se abre el dashboard | Llega una notificación, y no se repite al abrirlo de nuevo | RF-13.9 |
| CA-13.14 | El backend caído tras programar | Llega la hora | El recordatorio se muestra igual | RF-13.11 |
| CA-13.15 | Todos los avisos apagados | Se sincroniza | No queda ninguna notificación programada | RF-13.12 |

## 8. Decisiones

- **Resuelta (2026-09-26):** **Notificaciones locales en lugar de FCM (#51 se descarta por ahora).** Recomendación: implementar #35, #52 y #53 como notificaciones **locales programadas** con `expo-notifications`. Ventajas: funcionan sin internet y sin servidor, a la hora exacta, no requieren proyecto de Firebase ni *development build*, y se pueden verificar con el flujo actual. Costo: el contenido lo decide la app (no puede reaccionar a algo que solo sabe el servidor) y no hay entrega si la app se desinstala. FCM solo sería necesario para avisos originados en el servidor (p. ej. «hace 3 días que no registras» enviado con la app cerrada, o alertas a un familiar); no está pedido y se revisaría en su propia fase. #51 se cierra con un comentario que lo explique. Si prefieres FCM igualmente, la fase cambia de forma: habría que configurar Firebase, migrar a una *development build* y agregar un módulo de backend con tokens y envío.
- **Resuelta (2026-09-26):** **#52 – #54 sin «lógica de backend».** Los tres issues dicen «backend»; con la decisión anterior se resuelven en el celular. #54 (logros) queda limitado: el aviso aparece **al abrir la app**, no en el instante en que se desbloquea (los logros se calculan al consultar, fase 9). Un aviso en tiempo real requeriría servidor + FCM.
- **Resuelta (2026-09-26):** **Preferencias en el servidor (perfil) y programación en el celular.** Se guardan en `notificationPreferences`/`reminderTimes` vía el perfil (así sobreviven a una reinstalación o un teléfono nuevo, y #16 pide que estén «en el perfil»), y cada celular programa sus propias notificaciones a partir de ellas. Alternativa más simple: guardarlas solo en el celular (AsyncStorage), sin tocar el backend.
- **Resuelta (2026-09-26):** **Apagadas por defecto, permiso al activar.** Ningún aviso llega hasta que el paciente lo activa; el permiso del sistema se pide en ese momento (no al abrir la app por primera vez).
- **Resuelta (2026-09-26):** **Mensaje motivacional fijo a las 9:00.** Sin horario configurable en esta fase (P8). El catálogo son frases fijas en el código, con el mismo mecanismo de rotación diaria de los consejos (fase 10).
- **Resuelta (2026-09-26):** **Acceso desde «Mi perfil».** El dashboard ya tiene 8 botones (riesgo señalado en la fase 12); las preferencias de notificaciones son un ajuste, así que se abren desde un botón en «Mi perfil», no desde el dashboard.

## 9. Definición de terminado

- CA-13.1 … CA-13.15 verificados y marcados en el PR (los de disparo real, en el celular).
- `CLAUDE.md` actualizado con las preferencias del perfil y el mecanismo de sincronización.
- Issues #16, #35, #52, #53 y #54 cerrados (#54 con la aclaración de su alcance); #51 cerrado con el comentario de §8.
- Estado `Implementada` en [specs/README.md](../README.md).
