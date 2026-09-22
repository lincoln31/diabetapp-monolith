# Spec F5 — Dashboard con promedios de glucosa

| Campo | Valor |
|---|---|
| Fase | 5 |
| Estado | Borrador |
| Fecha | 2026-09-22 |
| Depende de | Fase 1 (contrato de API, índice `(userId, timestamp)`), Fase 3 (estructura por funcionalidades) |
| Issues relacionados | Cierra #19, #20, #48. Prepara #21, #25, #26, #43, #49, #50 (tarjetas futuras del mismo dashboard) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H5.1 No hay pantalla principal real | `HomeScreen` solo saluda por nombre y tiene dos botones («Registrar glucosa», «Cerrar sesión»); no muestra ningún dato. |
| H5.2 No hay forma de ver el conjunto de las lecturas | Solo existe `POST /api/glucose` (crear) y `GET /api/glucose` (lista paginada cruda); nada resume el control del paciente. |
| H5.3 Las metas del usuario nunca se usan | `targetGlucoseMin`/`targetGlucoseMax` existen en `User` desde el inicio del proyecto, pero ninguna pantalla ni endpoint los lee. |
| H5.4 Varios issues del backlog asumen un dashboard que no existe | #20 (promedios), #25/#26 (streaks), #43 (tip del día) y #50 (HbA1c) dicen «…en el dashboard», pero no hay dashboard que los aloje. |

## 2. Objetivo

Que el paciente, al abrir la app, vea de un vistazo cómo está su control de glucosa reciente (promedio de 7/14/30 días y si está dentro de su meta) sin tener que interpretar una lista de números, y que esa pantalla quede lista para recibir las tarjetas de los issues futuros sin rediseñarla.

## 3. Alcance

**Incluye:** H5.1 a H5.4 — el endpoint de estadísticas (#19), mostrarlas en pantalla (#20) y la pantalla de dashboard que las aloja (#48).

**No incluye** (cada uno con su propia spec más adelante, cuando les toque):
- Alerta visual de valores fuera de rango en el formulario de registro (#21).
- Racha de días consecutivos / streaks (#25, #26).
- Tip del día (#41, #42, #43).
- Proyección de HbA1c (#49, #50).
- Exportar reporte en PDF/CSV (#46, #47).
- Una pantalla de historial completo con lista/gráfico de todas las lecturas (no hay issue para eso todavía).

## 4. Historias de usuario

- **HU-5.1** Como paciente, quiero ver mi promedio de glucosa de los últimos 7 días al abrir la app, sin tener que revisar registro por registro.
- **HU-5.2** Como paciente, quiero comparar mi promedio actual con periodos más largos (14 y 30 días) para notar si estoy mejorando o empeorando.
- **HU-5.3** Como paciente, quiero saber de un vistazo si mi promedio está dentro del rango que definí como meta.
- **HU-5.4** Como paciente que recién se registra y no tiene lecturas todavía, quiero ver una invitación clara a registrar la primera, no una pantalla vacía o con tarjetas rotas.
- **HU-5.5** Como paciente, quiero que la pantalla se actualice cuando registro una lectura nueva, sin tener que cerrar y volver a abrir la app.
- **HU-5.6** Como desarrollador, quiero que agregar una tarjeta nueva al dashboard (streaks, tip del día…) sea añadir una pieza, no rediseñar la pantalla.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-5.1 | DEBE existir un endpoint que devuelva, para el usuario autenticado, promedio, mínimo, máximo y cantidad de lecturas de los **últimos 7, 14 y 30 días**, en una sola respuesta. | HU-5.1, HU-5.2 |
| RF-5.2 | Cada periodo se calcula en días completos hacia atrás desde el momento de la petición, sobre la fecha del registro (`timestamp`), no sobre cuándo se guardó (`createdAt`). | HU-5.1 |
| RF-5.3 | Un periodo sin lecturas DEBE devolver `count: 0` y los demás valores en `null` — nunca `0` como si fuera un promedio real, y nunca un error. | HU-5.4 |
| RF-5.4 | Cada periodo DEBE incluir una tendencia (`mejora` / `empeora` / `estable`) calculada comparando la primera mitad del periodo contra la segunda mitad; el criterio exacto se define en el plan. Con menos de 2 lecturas en el periodo, la tendencia es `sin_datos`. | HU-5.2 |
| RF-5.5 | La respuesta DEBE incluir el rango meta del usuario (`targetGlucoseMin`, `targetGlucoseMax`) para que el frontend pinte «dentro/fuera de rango» sin otra petición. | HU-5.3 |
| RF-5.6 | Igual que el resto de `/glucose`: exige sesión y solo devuelve datos del usuario autenticado. | — |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-5.7 | DEBE existir una pantalla de **Dashboard** que sea la pantalla principal tras iniciar sesión, en lugar del saludo simple actual. | HU-5.1 |
| RF-5.8 | DEBE mostrar el promedio de 7 días como métrica principal, con una señal visual de si está dentro o fuera del rango meta del usuario. | HU-5.3 |
| RF-5.9 | DEBE mostrar también los promedios de 14 y 30 días, para comparar. | HU-5.2 |
| RF-5.10 | DEBE mostrar la tendencia de cada periodo con una señal visual simple (no solo texto plano). | HU-5.2 |
| RF-5.11 | Si el usuario no tiene ninguna lectura, DEBE mostrar un estado vacío con una llamada a la acción para registrar la primera — nunca tarjetas de promedios vacías, en `null` visible o rotas. | HU-5.4 |
| RF-5.12 | DEBE seguir dando acceso a «Registrar glucosa» y «Cerrar sesión». | — |
| RF-5.13 | Los datos DEBEN poder refrescarse a mano (deslizar hacia abajo) y DEBEN refrescarse solos al volver a esta pantalla después de registrar una lectura nueva. | HU-5.5 |
| RF-5.14 | La pantalla DEBE construirse como una lista de tarjetas independientes (empezando por la de promedios), de forma que sumar una tarjeta nueva no obligue a tocar las demás. | HU-5.6 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-5.1 | El endpoint de estadísticas DEBE resolver los tres periodos con el mínimo número de consultas a la base de datos (no tres llamadas separadas desde el frontend, ni N+1 en el backend). |
| RNF-5.2 | Sigue las reglas ya vigentes del backend: sin `any`, validación con Zod si hay parámetros de entrada, y tests de integración (principio P6 de la [constitución](../constitucion.md)). |
| RNF-5.3 | Con 10 000 lecturas de un usuario (mismo escenario que RNF-1.3), el endpoint DEBE responder en menos de 300 ms, aprovechando el índice `(userId, timestamp)` ya existente. |
| RNF-5.4 | El estado vacío (RF-5.11) y el estado con datos deben verse ambos correctos en una pantalla angosta (spec fase 3, RNF de layout responsivo ya vigente). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-5.1 | Un usuario con lecturas en los últimos 30 días | Pide sus estadísticas | Recibe promedio, mínimo, máximo, cantidad y tendencia de los 3 periodos, más su rango meta, en una sola respuesta | RF-5.1, RF-5.5 |
| CA-5.2 | Un usuario sin ninguna lectura | Pide sus estadísticas | Los 3 periodos llegan con `count: 0` y valores `null`, sin error | RF-5.3 |
| CA-5.3 | Lecturas de hace 8 días (fuera de la ventana de 7) | Se piden las estadísticas de 7 días | Esas lecturas no se cuentan en el periodo de 7 días, pero sí en el de 14 y 30 si corresponde | RF-5.2 |
| CA-5.4 | Un periodo con valores subiendo con el tiempo | Se calcula su tendencia | Da `empeora` (según el criterio del plan) | RF-5.4 |
| CA-5.5 | Un periodo con solo 1 lectura | Se calcula su tendencia | Da `sin_datos`, no un valor inventado | RF-5.4 |
| CA-5.6 | Las lecturas de otro usuario | Se piden las estadísticas | No aparecen en el resultado | RF-5.6 |
| CA-5.7 | Un usuario nuevo, sin lecturas, entra a la app | Se abre el Dashboard | Ve un estado vacío con una llamada a registrar su primera glucosa, no tarjetas rotas ni en blanco | RF-5.11 |
| CA-5.8 | Un usuario con historial | Se abre el Dashboard | Ve el promedio de 7 días destacado, con marca de dentro/fuera de rango, y los de 14 y 30 días debajo, cada uno con su tendencia | RF-5.7, RF-5.8, RF-5.9, RF-5.10 |
| CA-5.9 | El Dashboard abierto | El usuario registra una glucosa nueva y vuelve | Los promedios se actualizan solos, sin recargar la app a mano | RF-5.13 |
| CA-5.10 | El Dashboard abierto con datos | El usuario desliza hacia abajo | Los datos se refrescan y se ve una señal de carga | RF-5.13 |
| CA-5.11 | El backend caído | Se abre el Dashboard | Se ve un mensaje de error claro, no una pantalla en blanco ni la app cerrada | RNF de manejo de errores ya vigente (fase 3) |
| CA-5.12 | 10 000 lecturas de un usuario | Se piden sus estadísticas | Responde en menos de 300 ms | RNF-5.3 |

## 8. Decisiones pendientes

- **[NECESITA ACLARACIÓN]** El criterio exacto de «tendencia» (RF-5.4) es una decisión técnica razonable que se deja propuesta en el plan (comparar la primera mitad del periodo contra la segunda, con un margen de ±5 % para considerarla «estable»). Se aprueba junto con el plan, salvo que el usuario prefiera otro criterio (por ejemplo, pendiente de una regresión lineal).
- **Decisión tomada:** el Dashboard **reemplaza** a `HomeScreen` como pantalla principal (RF-5.7); no queda una pantalla intermedia entre el login y el dashboard.
- **Decisión tomada:** no se agrega aquí una pantalla de historial completo (lista o gráfico de todas las lecturas); no hay issue del backlog que la pida todavía. Si se necesita, será una spec aparte.

## 9. Definición de terminado

- CA-5.1 … CA-5.12 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con el endpoint de estadísticas y la funcionalidad `dashboard`.
- Issues #19, #20 y #48 cerrados desde el PR.
- Estado `Implementada` en [specs/README.md](../README.md).
