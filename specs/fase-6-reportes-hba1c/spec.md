# Spec F6 — Reportes exportables y proyección de HbA1c

| Campo | Valor |
|---|---|
| Fase | 6 |
| Estado | Aprobada |
| Fecha | 2026-09-23 |
| Depende de | Fase 1 (contrato de API, índice `(userId, timestamp)`), Fase 5 (dashboard extensible por tarjetas, `/glucose/stats`) |
| Issues relacionados | Cierra #46, #47, #49, #50 |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H6.1 La meta de HbA1c nunca se compara con nada real | `User.targetHba1c` existe en el modelo desde el inicio del proyecto, pero ningún endpoint ni pantalla la usa. |
| H6.2 No hay forma de sacar los datos de la app | Todo el historial vive solo dentro de la app; para llevarlo a una consulta médica hay que anotarlo a mano leyendo la lista. |
| H6.3 El dashboard ya está pensado para nuevas tarjetas | La fase 5 dejó `DashboardScreen` como una lista de tarjetas independientes (D-5.5/RF-5.14) justamente para que #49/#50 (HbA1c) no obligaran a rediseñarla. |
| H6.4 Existe una fórmula clínica estándar para esto | La fórmula ADAG (glucosa promedio estimada ↔ HbA1c) es ampliamente usada y no requiere ningún dato adicional del usuario, solo su historial de glucosa ya guardado. |

## 2. Objetivo

Que el paciente vea en el dashboard una proyección aproximada de su HbA1c (comparada con su meta, si la definió) sin depender del laboratorio, y que pueda exportar su historial de lecturas como CSV o PDF para llevarlo a una consulta médica o guardarlo por su cuenta, sin salir de la app.

## 3. Alcance

**Incluye:** H6.1 – H6.4 — proyección de HbA1c en el backend (#49) y en el dashboard (#50), generación de reporte en el backend (#46) y botón de exportar en la app (#47).

**No incluye** (fuera de los issues de esta fase):
- Enviar el reporte por correo.
- Filtrar el reporte por rango de fechas (se exporta el historial completo; ya existe `from`/`to` en `GET /glucose` si en el futuro hace falta un endpoint filtrado).
- Gráficos dentro del PDF (el issue #46 pide un reporte, no una visualización).
- Editar `targetHba1c` desde la app — eso es el issue #14 (perfil), todavía sin implementar; aquí solo se **lee** si ya existe.

## 4. Historias de usuario

- **HU-6.1** Como paciente, quiero ver una proyección aproximada de mi HbA1c en el dashboard, para tener una idea de cómo estoy sin esperar el examen de laboratorio.
- **HU-6.2** Como paciente que definió una meta de HbA1c, quiero comparar mi proyección con esa meta, para saber si estoy cerca de mi objetivo.
- **HU-6.3** Como paciente con pocas lecturas, quiero que la app me diga que todavía no tiene datos suficientes, en vez de mostrarme un número poco confiable.
- **HU-6.4** Como paciente, quiero exportar mi historial de glucosa en CSV o PDF, para llevarlo a una consulta médica o guardarlo por mi cuenta.
- **HU-6.5** Como paciente, quiero elegir el formato del reporte antes de exportarlo.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-6.1 | DEBE existir un endpoint que devuelva una proyección estimada de HbA1c, calculada con la fórmula ADAG sobre el promedio de glucosa de los **últimos 90 días**. | HU-6.1 |
| RF-6.2 | Si no hay lecturas suficientes en esa ventana (umbral definido en el plan), el endpoint DEBE devolver la proyección en `null` con un indicador explícito de datos insuficientes — nunca un número inventado. | HU-6.3 |
| RF-6.3 | La respuesta DEBE incluir `targetHba1c` del usuario si lo definió, para que el frontend muestre la comparación. | HU-6.2 |
| RF-6.4 | Igual que el resto de `/glucose`: exige sesión y solo usa datos del usuario autenticado. | — |
| RF-6.5 | DEBE existir un endpoint que genere el historial completo de glucosa del usuario en formato **CSV**. | HU-6.4 |
| RF-6.6 | DEBE existir un endpoint que genere el mismo historial en formato **PDF**, legible (no una tabla cruda): con nombre del paciente, rango de fechas cubierto y la tabla de lecturas (fecha, hora, valor, momento del día, notas). | HU-6.4 |
| RF-6.7 | Ambos reportes exigen sesión y solo incluyen lecturas del usuario autenticado. | — |
| RF-6.8 | Un usuario sin lecturas DEBE poder pedir cualquiera de los dos reportes igual (CSV solo con encabezados / PDF indicando que no hay datos) — nunca un error. | HU-6.4 |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-6.9 | DEBE mostrar en el dashboard una tarjeta con la proyección de HbA1c, siguiendo el mismo patrón de tarjeta que `GlucoseAveragesCard` (D-5.5 de la fase 5). | HU-6.1 |
| RF-6.10 | Si no hay datos suficientes, la tarjeta DEBE mostrar un mensaje claro en vez de un número o un espacio en blanco. | HU-6.3 |
| RF-6.11 | Si el usuario definió una meta de HbA1c, la tarjeta DEBE mostrar la comparación (proyección vs. meta). | HU-6.2 |
| RF-6.12 | DEBE existir un botón «Exportar reporte» que deje elegir entre CSV y PDF. | HU-6.5 |
| RF-6.13 | Al exportar, la app DEBE ofrecer guardar o compartir el archivo generado (hoja de compartir del sistema) — no dejarlo en un lugar invisible para el usuario. | HU-6.4 |
| RF-6.14 | Mientras se genera/descarga el reporte DEBE verse una señal de carga; si falla, un mensaje de error claro. | HU-6.4 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-6.1 | El cálculo de HbA1c reutiliza el mismo patrón de una sola consulta que `/glucose/stats` (RNF-5.1 de la fase 5) — no N+1. |
| RNF-6.2 | La generación de PDF/CSV DEBE completarse en un tiempo razonable con varios miles de lecturas; al ser una acción bajo demanda (no de cada apertura de pantalla), el umbral es menos estricto que RNF-5.3. |
| RNF-6.3 | Sigue las reglas ya vigentes del backend: sin `any`, tests de integración para los endpoints nuevos (principio P6 de la [constitución](../constitucion.md)). |
| RNF-6.4 | El archivo exportado DEBE quedar accesible fuera de la app (compartido o guardado) — no solo en memoria mientras la app está abierta. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-6.1 | Un usuario con lecturas suficientes en los últimos 90 días | Pide la proyección de HbA1c | Recibe el promedio de 90 días, la proyección y su meta (si la definió) | RF-6.1, RF-6.3 |
| CA-6.2 | Un usuario con menos lecturas que el umbral | Pide la proyección de HbA1c | Recibe `sufficientData: false` y valores `null`, sin error | RF-6.2 |
| CA-6.3 | Lecturas de otro usuario | Se pide la proyección de HbA1c | No se cuentan en el resultado | RF-6.4 |
| CA-6.4 | Un usuario con lecturas | Pide el reporte CSV | Recibe un archivo con una fila por lectura y las columnas esperadas | RF-6.5 |
| CA-6.5 | Un usuario con lecturas | Pide el reporte PDF | Recibe un PDF válido con la tabla de lecturas | RF-6.6 |
| CA-6.6 | Un usuario sin lecturas | Pide cualquiera de los dos reportes | Los recibe igual, sin error, solo sin filas de datos | RF-6.8 |
| CA-6.7 | El Dashboard abierto, con datos suficientes | — | Se ve la tarjeta de HbA1c con la proyección y, si aplica, la comparación con la meta | RF-6.9, RF-6.11 |
| CA-6.8 | El Dashboard abierto, sin datos suficientes | — | La tarjeta muestra el mensaje de datos insuficientes, no un número | RF-6.10 |
| CA-6.9 | El botón «Exportar reporte» | El usuario elige un formato | Se genera el archivo y se abre la hoja de compartir/guardar del sistema | RF-6.12, RF-6.13 |
| CA-6.10 | El backend caído | El usuario intenta exportar | Ve un mensaje de error claro, no la app congelada ni cerrada | RF-6.14 |

## 8. Decisiones

- **Resuelta (2026-09-23):** se aprueba `pdfkit` como librería para generar el PDF en el backend (madura, sin dependencias nativas, genera PDF por streaming). Detalle en el plan (D-6.4).
- **Resuelta (2026-09-23):** se aprueban `expo-file-system` + `expo-sharing` como las dos dependencias nuevas del frontend para guardar/compartir el archivo descargado (patrón estándar de Expo; el proyecto no tenía hasta ahora ninguna forma de guardar/compartir archivos). Detalle en el plan (D-6.6).
- **Resuelta (2026-09-23):** se aprueba el umbral de **10 lecturas en la ventana de 90 días** para considerar la proyección de HbA1c confiable. Detalle en el plan (D-6.2).
- **Resuelta (2026-09-23):** se aprueba exportar siempre el **historial completo** (sin filtro de fechas) en esta primera versión, por simplicidad (principio P8).

## 9. Definición de terminado

- CA-6.1 … CA-6.10 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con los endpoints nuevos, las dependencias nuevas y la tarjeta de HbA1c.
- Issues #46, #47, #49 y #50 cerrados desde el PR.
- Estado `Implementada` en [specs/README.md](../README.md).
