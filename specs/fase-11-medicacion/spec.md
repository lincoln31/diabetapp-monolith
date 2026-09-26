# Spec F11 — Medicación y adherencia

| Campo | Valor |
|---|---|
| Fase | 11 |
| Estado | Aprobada |
| Fecha | 2026-09-26 |
| Depende de | Fase 1 (contrato de API), Fase 3 (estructura por funcionalidades), Fase 5 (dashboard por tarjetas), Fase 8 (día local según `User.timezone`) |
| Issues relacionados | Cierra #29, #30, #31, #32, #33, #34. #35 (recordatorios) queda fuera y abierto (ver §8) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H11.1 La app no sabe qué medicación toma el paciente | `User.currentMedications` es un texto libre que ningún endpoint ni pantalla usa; `schema.prisma` deja `medications Medication[]` comentado desde el inicio. |
| H11.2 No hay forma de registrar una toma | Solo se registra glucosa; el paciente no puede anotar que tomó su metformina o su insulina. |
| H11.3 Sin registro de tomas no hay adherencia | Tomar la medicación a tiempo es tan importante como medir la glucosa, y hoy no queda ningún dato para saber si se cumple. |
| H11.4 El dashboard ya admite tarjetas nuevas | Fases 5–8 lo dejaron como lista de tarjetas independientes (D-5.5). |

## 2. Objetivo

Que el paciente guarde su lista de medicamentos con sus horarios, registre cada toma con un toque y vea en el dashboard qué tan constante es (adherencia de los últimos 7 y 30 días).

## 3. Alcance

**Incluye:** #29 (esquema), #30 (CRUD), #31 (pantalla «Mis Medicamentos»), #32 (registrar toma), #33 (adherencia en el backend) y #34 (adherencia en la app).

**No incluye:**
- **Recordatorios / notificaciones (#35):** dependen de la infraestructura de notificaciones (#51–54, #16), que es una fase propia. #35 sigue abierto (ver §8).
- Deshacer o editar una toma ya registrada.
- Calcular o recomendar dosis; la app solo guarda lo que el paciente escribe.
- Migrar o borrar los campos viejos `User.currentMedications` e `insulinType`: quedan sin uso, sin tocarlos.
- Interacciones entre medicamentos, stock o recetas.

## 4. Historias de usuario

- **HU-11.1** Como paciente, quiero guardar mis medicamentos con su dosis y a qué horas los tomo, para tener mi tratamiento en la app.
- **HU-11.2** Como paciente, quiero editar o dejar de usar un medicamento cuando mi tratamiento cambia, sin perder mi historial.
- **HU-11.3** Como paciente, quiero registrar con un toque que tomé un medicamento.
- **HU-11.4** Como paciente, quiero ver cuántas tomas llevo hoy de cada medicamento.
- **HU-11.5** Como paciente, quiero ver mi adherencia (% de tomas cumplidas) de los últimos 7 y 30 días en el dashboard.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-11.1 | DEBE existir la tabla `medications` (nombre, dosis, horarios diarios, notas, activo) y la tabla `medication_intakes` (una fila por toma registrada), ambas ligadas al usuario. | HU-11.1 |
| RF-11.2 | DEBE existir el CRUD de medicamentos del usuario: crear, listar, editar y dejar de usar. «Dejar de usar» **archiva** el medicamento (no lo borra) para conservar su historial de tomas. | HU-11.1, HU-11.2 |
| RF-11.3 | El listado DEBE devolver solo los medicamentos activos e incluir, por cada uno, cuántas tomas lleva el paciente **hoy** (día local del usuario). | HU-11.4 |
| RF-11.4 | DEBE existir un endpoint para registrar una toma de un medicamento (instante de la toma opcional, por defecto ahora). | HU-11.3 |
| RF-11.5 | DEBE existir un endpoint de adherencia con los resultados de 7 y 30 días: tomas esperadas, tomas cumplidas y porcentaje. Si no hay tomas esperadas en la ventana, el porcentaje es `null` (nunca 0 ni 100 inventados). | HU-11.5 |
| RF-11.6 | Todos los recursos exigen sesión y solo operan sobre datos del usuario autenticado; un medicamento de otro usuario responde `NOT_FOUND`. | — |
| RF-11.7 | No se puede registrar una toma sobre un medicamento archivado (`NOT_FOUND`). | HU-11.3 |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-11.8 | DEBE existir una pantalla «Mis Medicamentos» con la lista de medicamentos activos, cada uno con su dosis, horarios y «X de Y tomas hoy», y un botón **«Registrar toma»** por medicamento. | HU-11.3, HU-11.4 |
| RF-11.9 | DEBE poderse agregar y editar un medicamento desde un formulario (nombre, dosis, horarios, notas) y dejar de usar uno con confirmación. | HU-11.1, HU-11.2 |
| RF-11.10 | El formulario DEBE validar con las mismas reglas del backend y mostrar los errores bajo cada campo (patrón de fases 3 y 7). | HU-11.1 |
| RF-11.11 | Con la lista vacía DEBE verse un estado vacío que invite a agregar el primer medicamento. | HU-11.1 |
| RF-11.12 | El dashboard DEBE mostrar una tarjeta de adherencia (7 y 30 días) y un acceso a «Mis Medicamentos». Sin tomas esperadas, la tarjeta no se muestra. | HU-11.5 |
| RF-11.13 | Mientras se registra una toma DEBE verse una señal de carga y, si falla, un error claro sin cerrar la pantalla. | HU-11.3 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-11.1 | El listado y la adherencia resuelven con un número fijo de consultas (sin N+1 por medicamento). |
| RNF-11.2 | Índices `(userId, active)` en `medications` y `(userId, takenAt)` en `medication_intakes` (patrón del índice de glucosa de la fase 1). |
| RNF-11.3 | Sigue las reglas vigentes: contrato de API de la fase 1, sin `any`, tests de integración de cada endpoint (P6), esquemas Zod repetidos en el frontend. |
| RNF-11.4 | Los días (para «hoy» y las ventanas de adherencia) se calculan en la zona horaria del usuario, igual que la racha (fase 8). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-11.1 | Un usuario con sesión | Crea un medicamento válido | Queda guardado y aparece en su listado | RF-11.1, RF-11.2 |
| CA-11.2 | Un cuerpo inválido (nombre vacío, horario mal escrito, sin horarios) | Crea un medicamento | Recibe `VALIDATION_ERROR` con `fields` | RF-11.2 |
| CA-11.3 | Un medicamento propio | Lo edita | El listado muestra los datos nuevos | RF-11.2 |
| CA-11.4 | Un medicamento propio | Lo deja de usar | Desaparece del listado y su historial de tomas se conserva | RF-11.2 |
| CA-11.5 | El medicamento de otro usuario | Se intenta editarlo, archivarlo o registrar una toma | Recibe `NOT_FOUND` | RF-11.6 |
| CA-11.6 | Un medicamento con 3 horarios y 1 toma hoy | Se pide el listado | Trae `takenToday: 1` y `scheduledTimes` con 3 horarios | RF-11.3 |
| CA-11.7 | Un medicamento activo | Se registra una toma | Se guarda y `takenToday` sube en 1 | RF-11.4 |
| CA-11.8 | Un medicamento archivado | Se registra una toma | Recibe `NOT_FOUND` | RF-11.7 |
| CA-11.9 | Un medicamento con 2 horarios creado hace 10 días y 10 tomas registradas | Se pide la adherencia | En 7 días: 14 esperadas, hasta 10 cumplidas, y el porcentaje que resulta | RF-11.5 |
| CA-11.10 | Un usuario sin medicamentos | Se pide la adherencia | Recibe porcentaje `null` en 7 y 30 días, sin error | RF-11.5 |
| CA-11.11 | Un medicamento creado hoy | Se pide la adherencia | Solo cuenta desde hoy (no penaliza días anteriores a su creación) | RF-11.5 |
| CA-11.12 | Más tomas en un día que horarios definidos | Se pide la adherencia | Ese día cuenta como cumplido, nunca más de 100 % | RF-11.5 |
| CA-11.13 | La pantalla «Mis Medicamentos» | El usuario toca «Registrar toma» | El contador «X de Y hoy» sube | RF-11.8 |
| CA-11.14 | Sin medicamentos | El usuario abre la pantalla | Ve el estado vacío con la invitación a agregar | RF-11.11 |
| CA-11.15 | El dashboard con adherencia disponible | Se abre | Se ve la tarjeta con el % de 7 y 30 días | RF-11.12 |
| CA-11.16 | El backend caído | Se registra una toma | Ve un error claro, sin cerrar la pantalla | RF-11.13 |

## 8. Decisiones

- **Resuelta (2026-09-26):** **#35 (recordatorios) fuera de esta fase.** Un recordatorio útil requiere notificaciones (permisos, programación, y en Android push con FCM), que son los issues #51–54 y #16. Propuesta: esta fase guarda ya los **horarios** de cada medicamento (`scheduledTimes`), que es lo único que los recordatorios necesitarán, y #35 se implementa en la fase de notificaciones sin migrar nada. #35 queda abierto.
- **Resuelta (2026-09-26):** **Dos tablas y archivar en vez de borrar.** `medications` + `medication_intakes`. «Dejar de usar» marca `active = false`: así la adherencia pasada y el historial no se pierden si el paciente cambia de tratamiento. (Borrar en cascada perdería el historial.) Los horarios son una lista de textos `HH:mm` en una columna (`String[]` de PostgreSQL), no una tabla aparte: la lista solo se lee y edita entera.
- **Resuelta (2026-09-26):** **Definición de adherencia.** Esperadas = horarios del medicamento × días de la ventana, contando solo desde el día en que se creó. Cumplidas = tomas registradas, con tope por día y medicamento igual a sus horarios (2 tomas de más no compensan una que faltó otro día). Porcentaje = cumplidas / esperadas. No se empareja cada toma con un horario concreto: contar tomas por día es suficiente y no obliga al paciente a elegir a qué hora «correspondía».
- **Resuelta (2026-09-26):** **Sin deshacer toma en esta fase.** Si el paciente se equivoca al tocar «Registrar toma», el registro queda. Propuesta: aceptarlo por simplicidad (P8) y agregar «deshacer» solo si se pide.

## 9. Definición de terminado

- CA-11.1 … CA-11.16 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con los endpoints y la funcionalidad `medications`.
- Issues #29 – #34 cerrados; #35 sigue abierto con un comentario que lo enlaza a la fase de notificaciones.
- Estado `Implementada` en [specs/README.md](../README.md).
