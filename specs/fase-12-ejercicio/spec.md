# Spec F12 — Actividad física

| Campo | Valor |
|---|---|
| Fase | 12 |
| Estado | Borrador |
| Fecha | 2026-09-26 |
| Depende de | Fase 1 (contrato de API), Fase 3 (estructura por funcionalidades), Fase 5 (dashboard por tarjetas), Fase 7 (perfil y metas), Fase 8 (día local según `User.timezone`) |
| Issues relacionados | Cierra #36, #37, #38, #39, #40 |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H12.1 La app no registra actividad física | Solo hay glucosa y medicación; el ejercicio, que baja la glucosa y es parte del tratamiento, no deja ningún dato. |
| H12.2 La meta de ejercicio existe pero no se usa | `User.exerciseGoalMinutes` (30 por defecto) está en el modelo desde el inicio; ningún endpoint ni pantalla lo lee ni lo edita. |
| H12.3 #40 pide «gráficos» y la app no tiene ninguno | El dashboard son tarjetas de números (fases 5–8, 11); no hay librería de gráficos instalada. |
| H12.4 Los datos para correlacionar ya existen | Con lecturas de glucosa (fase 1) y actividades por día local (esta fase) se puede comparar la glucosa de los días con y sin ejercicio, sin datos extra del usuario. |

## 2. Objetivo

Que el paciente registre su actividad física (a mano o con un cronómetro), vea cuánto lleva hoy frente a su meta diaria, y descubra si en sus días activos su glucosa promedio es distinta.

## 3. Alcance

**Incluye:** #36 (esquema), #37 (endpoints), #38 (pantalla de registro), #39 (cronómetro) y #40 (correlación, sin gráficos: ver §8).

**No incluye:**
- Gráficos de líneas o barras y la librería que requerirían (ver §8).
- Editar una actividad ya registrada (se puede borrar y volver a registrar).
- Intensidad, calorías, distancia, ritmo cardíaco o integración con relojes/Google Fit.
- Notificaciones o recordatorios de ejercicio (fase de notificaciones).
- Cronómetro que siga corriendo con la app cerrada del todo o con notificación persistente.

## 4. Historias de usuario

- **HU-12.1** Como paciente, quiero registrar una actividad (tipo, duración, notas), para llevar el control de mi ejercicio.
- **HU-12.2** Como paciente, quiero un cronómetro que mida mi actividad y me deje guardarla al terminar, sin calcular los minutos yo mismo.
- **HU-12.3** Como paciente, quiero ver mi historial de actividades y borrar una equivocada.
- **HU-12.4** Como paciente, quiero ver cuántos minutos llevo hoy frente a mi meta, y poder cambiar esa meta.
- **HU-12.5** Como paciente, quiero saber si mi glucosa promedio es distinta los días que hago ejercicio.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-12.1 | DEBE existir la tabla `exercise_activities` (tipo, duración en minutos, inicio, notas) ligada al usuario, con el tipo como enum nativo. | HU-12.1 |
| RF-12.2 | DEBE existir `POST /api/exercise` para registrar una actividad (inicio opcional, por defecto ahora; no puede ser futuro). | HU-12.1 |
| RF-12.3 | DEBE existir `GET /api/exercise` con historial paginado del usuario, ordenado del más reciente al más antiguo, con `?from&to&page&limit` como `GET /glucose`. | HU-12.3 |
| RF-12.4 | DEBE existir `DELETE /api/exercise/:id`; una actividad de otro usuario responde `NOT_FOUND`. | HU-12.3 |
| RF-12.5 | DEBE existir `GET /api/exercise/summary` con: minutos de hoy (día local del usuario), meta diaria, minutos de los últimos 7 días y la correlación de RF-12.6. | HU-12.4, HU-12.5 |
| RF-12.6 | La correlación DEBE comparar, sobre los últimos 30 días locales, el promedio de glucosa de los días **con** actividad contra los días **sin** ella. Si algún grupo tiene menos de 5 lecturas, DEBE devolver `sufficientData: false` y valores `null` — nunca un número inventado. | HU-12.5 |
| RF-12.7 | La meta diaria de ejercicio (`exerciseGoalMinutes`) DEBE poder leerse y editarse desde `GET`/`PUT /api/profile` (5 a 300 minutos, no nula), igual que `dailyGlucoseChecks` en la fase 8. | HU-12.4 |
| RF-12.8 | Todos los recursos exigen sesión y solo operan sobre datos del usuario autenticado. | — |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-12.9 | DEBE existir una pantalla «Ejercicio» con el avance de hoy («X de Y min»), el historial y el acceso a registrar y al cronómetro; con la lista vacía, un estado vacío. | HU-12.3, HU-12.4 |
| RF-12.10 | DEBE existir un formulario para registrar una actividad (tipo, duración en minutos, notas) con las mismas reglas del backend y errores bajo cada campo. | HU-12.1 |
| RF-12.11 | DEBE existir un cronómetro (iniciar, pausar, reanudar, terminar) que mide con marcas de tiempo, de modo que siga contando bien si la app pasa a segundo plano. Al terminar, lleva al formulario con la duración precargada (redondeada hacia arriba a minutos, mínimo 1). | HU-12.2 |
| RF-12.12 | DEBE poder borrarse una actividad del historial, con confirmación. | HU-12.3 |
| RF-12.13 | El dashboard DEBE mostrar una tarjeta de ejercicio con el avance de hoy contra la meta y, si hay datos suficientes, la comparación de glucosa con/sin ejercicio con la aclaración de que es una asociación, no una causa. | HU-12.4, HU-12.5 |
| RF-12.14 | El perfil DEBE permitir editar la meta diaria de ejercicio. | HU-12.4 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-12.1 | El resumen resuelve con un número fijo de consultas (sin N+1), patrón de `/glucose/stats` (RNF-5.1). |
| RNF-12.2 | Índice `(userId, startedAt)` en `exercise_activities` (patrón del índice de glucosa). |
| RNF-12.3 | Los días (hoy, ventanas, correlación) se calculan en la zona horaria del usuario (fase 8). |
| RNF-12.4 | Sigue las reglas vigentes: contrato de API de la fase 1, sin `any`, tests de integración de cada endpoint (P6), esquemas Zod repetidos en el frontend. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-12.1 | Un usuario con sesión | Registra una actividad válida | Queda guardada y aparece en su historial | RF-12.1, RF-12.2 |
| CA-12.2 | Un cuerpo inválido (tipo desconocido, duración 0 o mayor a 600, inicio futuro) | Registra una actividad | Recibe `VALIDATION_ERROR` con `fields` | RF-12.2 |
| CA-12.3 | Actividades en varias fechas | Pide el historial con `from` y `to` | Solo recibe las del rango, paginadas, de la más reciente a la más antigua | RF-12.3 |
| CA-12.4 | Una actividad propia | La borra | Deja de aparecer en el historial | RF-12.4 |
| CA-12.5 | Una actividad de otro usuario | Intenta borrarla | Recibe `NOT_FOUND` | RF-12.4, RF-12.8 |
| CA-12.6 | 20 min registrados hoy y 15 min ayer | Pide el resumen | `todayMinutes: 20`, `last7DaysMinutes: 35`, `goalMinutes` = su meta | RF-12.5 |
| CA-12.7 | Un usuario sin actividades | Pide el resumen | Recibe ceros y la correlación con `sufficientData: false`, sin error | RF-12.5, RF-12.6 |
| CA-12.8 | Lecturas suficientes en días con y sin ejercicio | Pide el resumen | Recibe los dos promedios y su diferencia | RF-12.6 |
| CA-12.9 | Menos de 5 lecturas en alguno de los dos grupos | Pide el resumen | `sufficientData: false` y promedios `null` | RF-12.6 |
| CA-12.10 | Actividades y lecturas de otro usuario | Pide el resumen | No se cuentan | RF-12.8 |
| CA-12.11 | El perfil | Se guarda una meta de ejercicio entre 5 y 300, o fuera de rango | Se acepta la válida; la inválida da `VALIDATION_ERROR` | RF-12.7 |
| CA-12.12 | La pantalla «Ejercicio» sin actividades | Se abre | Muestra el estado vacío y «0 de Y min» | RF-12.9 |
| CA-12.13 | El formulario | Se guarda una actividad válida | Vuelve al historial con la actividad y el avance de hoy actualizado | RF-12.10 |
| CA-12.14 | El cronómetro corriendo | Se pone la app en segundo plano un rato y se vuelve | El tiempo transcurrido sigue siendo correcto | RF-12.11 |
| CA-12.15 | El cronómetro en 2 min 10 s | Se toca «Terminar» | El formulario aparece con 3 minutos | RF-12.11 |
| CA-12.16 | Una actividad del historial | Se borra con confirmación | Desaparece y el avance de hoy baja | RF-12.12 |
| CA-12.17 | El dashboard con datos suficientes | Se abre | Se ve la tarjeta con avance y comparación con/sin ejercicio | RF-12.13 |
| CA-12.18 | El backend caído | Se guarda una actividad | Ve un error claro, sin cerrar la pantalla | RF-12.10 |

## 8. Decisiones

- **[NECESITA ACLARACIÓN]** **#40 sin gráficos.** El issue pide «gráficos», pero la app no tiene ninguno y agregar una librería (p. ej. `react-native-svg` + gráficos) es una dependencia grande para un solo elemento. Propuesta: mostrar la correlación como **tarjeta** en el dashboard («Tus días con ejercicio: 118 mg/dL de promedio · sin ejercicio: 141 mg/dL»), coherente con el resto del dashboard, y dejar los gráficos para una fase propia si se piden (habría que hacerlos para toda la app, no solo aquí). #40 se cierra con un comentario que lo explique.
- **[NECESITA ACLARACIÓN]** **Definición de la correlación.** Promedio de glucosa de los últimos 30 días locales, separando los días con al menos una actividad de los que no tienen ninguna; se necesitan al menos 5 lecturas en cada grupo. Es una asociación simple, no una causa (el paciente puede hacer ejercicio justo los días que se cuida más), y la tarjeta lo dice. ¿De acuerdo, o prefieres otra ventana o umbral?
- **[NECESITA ACLARACIÓN]** **Meta editable en el perfil.** Se reutiliza el campo ya existente `exerciseGoalMinutes` (30 por defecto) y se agrega al formulario de perfil como la meta diaria de lecturas (5–300 min, no nula). ¿De acuerdo, o prefieres dejar la meta fija en 30 esta fase?
- **[NECESITA ACLARACIÓN]** **Tipos de actividad y sin intensidad.** Enum `ActivityType`: caminar, correr, bicicleta, natación, gimnasio, yoga, otro. Sin intensidad, calorías ni distancia (P8). ¿Algún tipo que agregarías o quitarías?
- **[NECESITA ACLARACIÓN]** **Sin editar, pero sí borrar.** Un error se corrige borrando y registrando de nuevo (a diferencia de las tomas de medicación, aquí hay un historial visible donde borrar tiene sentido).

## 9. Definición de terminado

- CA-12.1 … CA-12.18 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con los endpoints, el módulo `exercise` y el cronómetro.
- Issues #36 – #40 cerrados (#40 con el comentario de §8).
- Estado `Implementada` en [specs/README.md](../README.md).
