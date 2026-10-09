# Spec F19 — Registrar la insulina aplicada y ver su efecto

| Campo | Valor |
|---|---|
| Fase | 19 |
| Estado | Implementada |
| Fecha | 2026-10-09 |
| Depende de | Fase 13 (recordatorio puntual «en 2 horas»), Fase 17 (calculadora de dosis) |
| Issues relacionados | — (pedido directo del usuario) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H19.1 La app calcula la dosis de insulina (fase 17), pero no queda registro de cuánta se aplicó de verdad | El paciente puede calcular una dosis sugerida, pero no hay forma de anotar las unidades que realmente se puso junto a la lectura (p. ej. antes del desayuno). |
| H19.2 El recordatorio «en 2 horas» (fase 13) no cierra el ciclo | Existe el checkbox «Recordármelo en 2 horas» al registrar una glucosa, pero al sonar y volver a medir no hay ninguna relación entre esa nueva lectura y la insulina aplicada en la anterior — el paciente tiene que calcular a mano cuánto bajó y a qué ritmo. |

## 2. Objetivo

Que el paciente pueda anotar, opcionalmente, cuántas unidades de insulina rápida se aplicó al registrar una lectura de glucosa, y que al registrar la siguiente lectura (típicamente tras el recordatorio de 2 horas) la app le diga sola cuánto bajó y a qué ritmo por unidad — sin tener que calcularlo a mano ni llevar un cuaderno aparte.

## 3. Alcance

**Incluye:** H19.1, H19.2 — campo opcional de unidades de insulina al registrar una glucosa, y un aviso automático al guardar la siguiente lectura si la anterior tenía insulina y cayó dentro de la ventana de ~2 horas.

**No incluye:**
- Un historial o pantalla propia de "dosis aplicadas": las unidades quedan guardadas junto a la lectura de glucosa (como un dato más de esa lectura), visibles en el detalle si se edita, no en una lista aparte.
- Cambiar el cálculo de la calculadora de dosis (fase 17): son cosas relacionadas pero independientes — una sugiere, la otra registra lo que de verdad se aplicó.
- Avisar del efecto fuera de la ventana de 1 a 4 horas (demasiado pronto o demasiado tarde para que la comparación tenga sentido clínico).
- Editar las unidades de insulina de una lectura ya guardada para disparar el aviso de nuevo: el aviso solo aparece al **crear** una lectura nueva.

## 4. Historias de usuario

- **HU-19.1** Como paciente que usa insulina rápida, quiero anotar cuántas unidades me apliqué al registrar una glucosa (p. ej. antes del desayuno), para tener ese dato junto a la lectura.
- **HU-19.2** Como paciente, quiero que al registrar la siguiente glucosa (tras el recordatorio de 2 horas) la app me diga sola cuánto bajó y a qué ritmo por unidad, sin calcularlo yo.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-19.1 | «Registrar glucosa» DEBE tener un campo opcional «Unidades de insulina aplicadas», plegado por defecto (igual patrón que «Agregar nota»). | HU-19.1 |
| RF-19.2 | Las unidades, si se escriben, DEBEN validarse entre 0.5 y 100, con la misma regla en frontend y backend. | HU-19.1 |
| RF-19.3 | Al **crear** una lectura nueva, si la lectura anterior tenía unidades de insulina registradas y el tiempo entre ambas está entre 1 y 4 horas, DEBE mostrarse un aviso con cuánto bajó (o subió) la glucosa y el ritmo por unidad, en vez del mensaje genérico de «medición guardada». | HU-19.2 |
| RF-19.4 | Fuera de esa ventana de tiempo, o sin insulina registrada en la lectura anterior, se mantiene el mensaje genérico de guardado (comportamiento actual). | HU-19.2 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-19.1 | El cálculo del efecto (`calculateInsulinEffect`) es una función pura, sin llamadas a red, con tests. |
| RNF-19.2 | Si no se puede determinar la lectura anterior (falla la petición, es la primera lectura del paciente), no bloquea el guardado: se muestra el mensaje genérico. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-19.1 | El formulario de glucosa | El paciente toca «Agregar unidades de insulina aplicadas» | Aparece el campo numérico, igual que con las notas | RF-19.1 |
| CA-19.2 | El campo de unidades | El paciente escribe 0 o 150 | Ve el error de rango | RF-19.2 |
| CA-19.3 | Una lectura de 200 mg/dL con 4 u de insulina hace 2 horas | El paciente registra una nueva lectura de 155 mg/dL | Ve «Bajó 45 mg/dL con 4 unidades (≈11.3 mg/dL por unidad)» en vez del mensaje genérico | RF-19.3 |
| CA-19.4 | Una lectura con insulina hace 6 horas | El paciente registra una nueva lectura | Ve el mensaje genérico «Medición guardada», sin comparación | RF-19.4 |
| CA-19.5 | La lectura anterior sin insulina registrada | El paciente registra una nueva lectura 2 horas después | Ve el mensaje genérico, sin comparación | RF-19.4 |

## 8. Decisiones

- **Resuelta (2026-10-09):** el campo vive en el mismo formulario de glucosa (no en `medications` ni en una pantalla nueva): la insulina rápida se aplica junto a una medición, no en un horario fijo como los medicamentos de la fase 11.
- **Resuelta (2026-10-09):** ventana de comparación 1–4 horas (no exactamente 2): dar margen a que el paciente no mida al segundo exacto de la alarma, sin perder sentido clínico con una ventana demasiado amplia.
- **Resuelta (2026-10-09):** el aviso solo se calcula al crear (no al editar) una lectura: editar no representa "la siguiente medición", así que no tendría sentido disparar la comparación ahí.

## 9. Definición de terminado

- CA-19.1 … CA-19.5 verificados y marcados en el PR.
- `CLAUDE.md` actualizado (módulo `glucose` del backend y del frontend).
- Estado `Implementada` en [specs/README.md](../README.md).
