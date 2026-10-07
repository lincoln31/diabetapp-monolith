# Spec F18 — Caché local para el *cold start* del backend

| Campo | Valor |
|---|---|
| Fase | 18 |
| Estado | Implementada |
| Fecha | 2026-10-07 |
| Depende de | Fase 5 (dashboard), Fase 16 (infraestructura: *cold start* de Render) |
| Issues relacionados | — (pedido directo del usuario) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H18.1 El *cold start* del backend se siente como que la app no funciona | El backend en producción (Render, plan gratuito) se duerme tras ~15 min sin tráfico; la primera petición después tarda 30-50 s (spec fase 16, RNF-16.2). Hoy «Hoy» (el dashboard) se queda en la pantalla de carga (esqueletos) todo ese tiempo cada vez que se abre la app tras un rato sin usarla. |
| H18.2 El dashboard ya tenía datos de la visita anterior, pero no los recuerda | El estado de cada tarjeta vive solo en memoria (`useState`): al cerrar y reabrir la app se pierde, aunque la última vez sí se haya cargado bien. |

## 2. Objetivo

Que al abrir «Hoy» con el backend dormido, el paciente vea de inmediato lo último que se cargó la vez anterior (guardado en el celular) en vez de la pantalla de carga, mientras la app pide en segundo plano los datos reales y los reemplaza en cuanto llegan — sin que el paciente note la espera salvo que los números tarden un momento en refrescarse.

## 3. Alcance

**Incluye:** H18.1, H18.2 — caché local (en el celular) de los cinco bloques de datos que arma «Hoy»: estadísticas (promedios/tendencia), racha, proyección de HbA1c, última medición y medicación de hoy.

**No incluye:**
- La sesión (login): sigue dependiendo de la respuesta del servidor para confirmar el token, como hasta ahora; ya existe lógica para no cerrar sesión si el servidor no responde (`NETWORK_ERROR`, spec fase 2).
- Otras pantallas (Glucosa, Medicación, Actividad, Logros, Perfil): quedan con su comportamiento actual (pantalla de carga mientras no hay respuesta). Se puede extender el mismo mecanismo más adelante si hace falta.
- El bloque de ejercicio de «Hoy» (`useExerciseSummary`, en `features/exercise`): es el mismo patrón, pero vive en otra funcionalidad y no se tocó en esta fase.
- Un indicador visual de "esto es de hace un rato": la caché es invisible a propósito (RF-18.3); no hay bandera de «desactualizado» en pantalla.

## 4. Historias de usuario

- **HU-18.1** Como paciente, quiero ver mis datos del dashboard de inmediato al abrir la app, aunque el servidor tarde en responder, en vez de una pantalla de carga.
- **HU-18.2** Como paciente, quiero que esos datos se actualicen solos en cuanto el servidor responda, sin tener que hacer nada.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-18.1 | Cada uno de los cinco bloques de «Hoy» (estadísticas, racha, HbA1c, última medición, medicación de hoy) DEBE guardar en el celular el último resultado que cargó con éxito. | HU-18.1 |
| RF-18.2 | Al abrir la pantalla, si hay un resultado guardado para un bloque, DEBE mostrarse de inmediato (sin el esqueleto de carga) mientras se pide la versión real en segundo plano. | HU-18.1 |
| RF-18.3 | Si el pedido en segundo plano responde con datos nuevos, DEBEN reemplazar lo guardado (en pantalla y en la caché) sin interacción del paciente. | HU-18.2 |
| RF-18.4 | Si el pedido en segundo plano falla y ya hay datos guardados mostrándose, DEBEN quedarse como están — no se reemplazan por un mensaje de error. | HU-18.1 |
| RF-18.5 | Sin datos guardados (primer uso del celular, o un bloque que nunca cargó bien), el comportamiento DEBE ser el de hoy: esqueleto de carga y, si falla, el bloque de error con reintentar. | HU-18.1 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-18.1 | La caché vive en el frontend (`AsyncStorage`), sin cambios en el backend ni en el contrato de la API. |
| RNF-18.2 | Si guardar o leer la caché falla (almacenamiento lleno, dato corrupto, etc.), la app sigue funcionando igual que si no hubiera caché — nunca rompe la pantalla. |
| RNF-18.3 | Sigue las reglas vigentes: sin `any`, tests de la lógica nueva (constitución P5, P6). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-18.1 | «Hoy» cargó bien al menos una vez | Se cierra y se vuelve a abrir la app | Los cinco bloques muestran los últimos datos de inmediato, sin esqueletos | RF-18.1, RF-18.2 |
| CA-18.2 | Datos guardados en pantalla | El pedido en segundo plano responde con datos distintos | La pantalla se actualiza sola con los nuevos datos | RF-18.3 |
| CA-18.3 | Datos guardados en pantalla | El pedido en segundo plano falla (backend dormido, sin red) | Los datos guardados se quedan en pantalla; no aparece un error | RF-18.4 |
| CA-18.4 | Celular nuevo, sin nada guardado | Se abre «Hoy» y el pedido falla | Se ve el bloque de error con «Reintentar», igual que hoy | RF-18.5 |

## 8. Decisiones

- **Resuelta (2026-10-07):** alcance acotado a «Hoy» (el dashboard), que es donde más se nota el *cold start* al ser la primera pantalla que se abre; Glucosa y las demás quedan para una fase futura si hace falta.
- **Resuelta (2026-10-07):** la sesión (login) no se cachea: ya existe un mecanismo distinto (`NETWORK_ERROR` no cierra sesión, spec fase 2) que cubre el mismo problema sin guardar datos del usuario fuera del almacenamiento seguro.
- **Resuelta (2026-10-07):** sin indicador visual de "dato desatualizado": el pedido en segundo plano tarda como mucho los ~45 s del *cold start* (spec fase 16) y se reemplaza solo; añadir una bandera en pantalla sumaría complejidad para un caso que se resuelve solo en la mayoría de los casos.

## 9. Definición de terminado

- CA-18.1 … CA-18.4 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con el mecanismo de caché (`shared/cache`).
- Estado `Implementada` en [specs/README.md](../README.md).
