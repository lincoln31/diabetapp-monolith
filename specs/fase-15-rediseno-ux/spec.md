# Spec F15 — Rediseño UX de toda la app

| Campo | Valor |
|---|---|
| Fase | 15 |
| Estado | Borrador |
| Fecha | 2026-09-26 |
| Depende de | Fases 3–14 (todas las funcionalidades existentes) |
| Issues relacionados | Ninguno (nace de la auditoría) |
| Documentos | [auditoria.md](auditoria.md) · [plan.md](plan.md) · [tasks.md](tasks.md) · método: `diseñador_ux.md` |

## 1. Contexto y problema

La [auditoría](auditoria.md) encontró **21 hallazgos**: 1 P0, 6 P1, 8 P2, 4 P3 y 2 P4. Los que más pesan:

| Hallazgo | Por qué importa |
|---|---|
| **A1** No hay historial de glucosa (no se puede ver, corregir ni borrar una lectura) | Un dato clínico erróneo contamina promedios, HbA1c, racha y logros y no tiene arreglo |
| **A2/A3** La acción principal está al final del Dashboard, entre 8 botones iguales y 6 tarjetas; no hay navegación persistente | La tarea más frecuente cuesta scroll cada vez; nadie sabe «dónde está» |
| **A5/A6/A7** Contraste bajo (3,68 : 1 en el botón principal), áreas táctiles de ~35 px, sin áreas seguras | Difícil de usar al sol, con una mano o con vista cansada |
| **A8** Registrar glucosa exige 3 controles de fecha, un momento del día mal preseleccionado y un `Alert` bloqueante | Fricción en la tarea de segundos |
| **A15** Sin sistema de diseño (13 tamaños de fuente, espaciados y colores a mano) | Cada pantalla se ve y se comporta distinto |

## 2. Objetivo

Que un paciente pueda **registrar su glucosa en pocos segundos, ver cómo va hoy y encontrar cualquier función sin pensar**, con una interfaz consistente, legible al sol y cómoda con una mano. UX antes que estética: la mejora se mide en pasos, toques y errores, no en adornos.

## 3. Alcance

**Incluye:** navegación por pestañas, sistema de diseño (tokens + componentes), rediseño de las 15 pantallas, **pantalla nueva de historial de glucosa** (con editar y borrar), simplificación del registro y de «Registrar glucosa», accesibilidad y estados (carga, vacío, error, sin conexión).

**No incluye:**
- Cambios en la API o en los datos, salvo lo que ya existe (`GET/PUT/DELETE /api/glucose`).
- Tema oscuro (se declara solo tema claro; ver §8).
- Recuperación de contraseña (no existe en el backend; solo se quita el falso enlace).
- Nuevas funcionalidades de negocio (ninguna métrica ni endpoint nuevo).
- iOS (solo se verifica en Android).

## 4. Historias de usuario

- **HU-15.1** Como paciente, quiero registrar mi glucosa con muy pocos toques, para hacerlo en segundos.
- **HU-15.2** Como paciente, quiero ver y corregir lo que registré, para que mis datos sean fiables.
- **HU-15.3** Como paciente, quiero ver de un vistazo cómo voy hoy (lecturas, tomas, ejercicio), sin recorrer varias tarjetas.
- **HU-15.4** Como paciente, quiero moverme por la app con una barra fija, sin volver siempre al inicio.
- **HU-15.5** Como paciente con poca vista o con una sola mano, quiero textos legibles, botones grandes y colores con buen contraste.
- **HU-15.6** Como paciente nuevo, quiero crear mi cuenta rápido y completar el resto más tarde.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-15.1 | La app DEBE tener una barra de pestañas fija con cinco destinos: **Hoy · Glucosa · Medicación · Actividad · Más**. | HU-15.4 |
| RF-15.2 | «Más» DEBE agrupar Perfil y metas, Notificaciones, Logros, Educación, Exportar reporte y Cerrar sesión (esta última separada y al final). | HU-15.4 |
| RF-15.3 | «Hoy» DEBE mostrar arriba la acción **Registrar glucosa** y, debajo, solo lo del día: última lectura con su estado respecto al rango, lecturas de hoy frente a la meta, tomas de medicación pendientes y minutos de ejercicio. | HU-15.1, HU-15.3 |
| RF-15.4 | «Hoy» DEBE permitir marcar una toma pendiente sin salir de la pantalla. | HU-15.3 |
| RF-15.5 | DEBE existir la pantalla **Glucosa** con el historial agrupado por día, filtro por período (7/30/90 días), promedio del período y la acción Registrar glucosa. | HU-15.2 |
| RF-15.6 | Desde el historial DEBE poder **editar** y **borrar** una lectura (el borrado con confirmación). | HU-15.2 |
| RF-15.7 | El historial DEBE mostrar la tendencia del período en un gráfico de línea simple con el rango objetivo, y una alternativa en lista/tabla. | HU-15.2 |
| RF-15.8 | «Registrar glucosa» DEBE pedir primero el valor (teclado numérico, campo grande), inferir el momento del día a partir de la hora, usar «Ahora» por defecto (con «Cambiar») y plegar las notas. | HU-15.1 |
| RF-15.9 | Al guardar, la app DEBE confirmar con un aviso no bloqueante y volver a la pantalla anterior; los errores DEBEN mostrarse junto al campo o en el formulario. | HU-15.1 |
| RF-15.10 | El estado respecto al rango (dentro, alto, bajo) DEBE comunicarse con **icono + texto + color**. | HU-15.5 |
| RF-15.11 | El registro de cuenta DEBE pedir solo correo, contraseña, nombre y aceptación de términos; el teléfono, la fecha de nacimiento y los datos médicos se completan en el perfil. | HU-15.6 |
| RF-15.12 | DEBE eliminarse el falso enlace «¿Olvidaste tu contraseña?» y todo texto que parezca acción y no lo sea. | HU-15.6 |
| RF-15.13 | Todas las pantallas DEBEN compartir una misma cabecera, respetar las áreas seguras y usar el mismo vocabulario de títulos y acciones. | HU-15.4 |
| RF-15.14 | Todas las pantallas con datos DEBEN cubrir los estados **cargando (con espacio reservado), vacío, error con reintento y sin conexión**. | HU-15.5 |
| RF-15.15 | NO DEBEN usarse emojis como iconos ni como parte de botones; se usa una única familia de iconos. | HU-15.5 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-15.1 | **Contraste:** el texto ≥ 4,5 : 1 y los bordes de controles ≥ 3 : 1 sobre su fondo; el estado nunca depende solo del color. |
| RNF-15.2 | **Áreas táctiles:** todo elemento interactivo ≥ 48 × 48 dp (o con `hitSlop` que lo garantice); las acciones destructivas separadas de las normales. |
| RNF-15.3 | **Tokens:** color, tipografía (≤ 7 tamaños), espaciado (escala 4–8–12–16–24–32–48), radio y elevación salen de un único módulo; ninguna pantalla define valores propios. |
| RNF-15.4 | **Accesibilidad:** `accessibilityRole/Label` en todos los controles, `Pressable` con retroalimentación táctil, y la interfaz usable con el texto del sistema al 200 % sin recortes. |
| RNF-15.5 | **Rendimiento:** listas con `FlatList`/`SectionList`; el historial pagina como la API. |
| RNF-15.6 | **No romper lo existente:** cada fase de implementación mantiene verdes los tests, el lint y `tsc`, y no cambia el contrato de la API. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-15.1 | La app abierta en cualquier pestaña | Se mira la parte inferior | Hay una barra fija con Hoy · Glucosa · Medicación · Actividad · Más y la activa se distingue por icono, etiqueta y color | RF-15.1 |
| CA-15.2 | «Hoy» | Se abre | «Registrar glucosa» está visible sin hacer scroll | RF-15.3 |
| CA-15.3 | «Hoy» con una toma pendiente | Se toca «Tomé» | La toma se registra y el contador cambia sin salir de la pantalla | RF-15.4 |
| CA-15.4 | Un usuario sin lecturas | Abre «Hoy» y «Glucosa» | Ve un estado vacío con una sola acción clara; «Registrar glucosa» no aparece duplicada | RF-15.3, RF-15.14 |
| CA-15.5 | El historial con lecturas | Se abre | Ve lecturas agrupadas por día, cada una con valor, unidad, hora y estado (icono + texto), y el promedio del período | RF-15.5, RF-15.10 |
| CA-15.6 | Una lectura mal tecleada | Se edita el valor y se guarda | El historial, «Hoy» y los promedios reflejan el valor corregido | RF-15.6 |
| CA-15.7 | Una lectura | Se toca «Borrar» | Pide confirmación; al confirmar desaparece y los promedios se actualizan | RF-15.6 |
| CA-15.8 | Un período con 2 o más lecturas | Se abre el historial | Se ve un gráfico de línea con el rango objetivo y la misma información disponible como lista | RF-15.7 |
| CA-15.9 | «Registrar glucosa» abierto a las 8:00 | Se mira el formulario | El valor está enfocado, el momento propuesto es «Desayuno» o el que corresponde a la hora, y la fecha es «Ahora» | RF-15.8 |
| CA-15.10 | Un valor válido | Se guarda | Aparece «Medición guardada», la pantalla se cierra sola y no hay `Alert` que descartar | RF-15.9 |
| CA-15.11 | Un valor fuera de rango (30 o 700) | Se guarda | El error aparece junto al campo y se explica el rango permitido | RF-15.9 |
| CA-15.12 | Un valor por encima del rango personal | Se escribe | Aparece un aviso con icono y texto («Por encima de tu rango: 80–180») | RF-15.10 |
| CA-15.13 | La pantalla de registro de cuenta | Se abre | Solo hay cuatro campos y no hay tarjetas decorativas | RF-15.11 |
| CA-15.14 | La pantalla de acceso | Se abre | No existe ningún texto con apariencia de enlace que no haga nada | RF-15.12 |
| CA-15.15 | Cualquier pantalla en un celular con muesca | Se abre | Ningún contenido queda bajo la barra de estado ni la barra de gestos | RF-15.13 |
| CA-15.16 | El backend apagado | Se abre cualquier pantalla con datos | Se ve un estado «Sin conexión» con «Reintentar», sin pantalla en blanco | RF-15.14 |
| CA-15.17 | El texto del sistema al 200 % | Se recorren las pantallas | No hay texto recortado ni botones inalcanzables | RNF-15.4 |
| CA-15.18 | Cualquier botón o icono tocable | Se mide | Su área táctil es ≥ 48 dp | RNF-15.2 |
| CA-15.19 | El código | Se busca `fontSize`, `padding`, `margin` o colores hexadecimales dentro de pantallas | Solo se usan tokens (el módulo de tokens es el único con valores literales) | RNF-15.3 |
| CA-15.20 | Un lector de pantalla (TalkBack) | Se recorre «Hoy» y «Registrar glucosa» | Cada control anuncia su nombre, su rol y su estado | RNF-15.4 |

## 8. Decisiones

- **[NECESITA ACLARACIÓN]** **Navegación por pestañas (5).** Hoy · Glucosa · Medicación · Actividad · Más. Reflejan cómo piensa el paciente: registrar y revisar glucosa, tomar la medicación, moverse. Alternativa: mantener el modelo actual (un Dashboard con un menú) y solo reordenarlo; es más barata pero no resuelve A3.
- **[NECESITA ACLARACIÓN]** **Pantalla nueva «Glucosa» con editar y borrar (A1).** Usa la API que ya existe; sin cambios de backend. Es el único hallazgo P0 y no debería dejarse fuera.
- **[NECESITA ACLARACIÓN]** **Gráfico de tendencia con `react-native-svg`.** Incluida en Expo Go y en la build de desarrollo; una dependencia. Justificado porque es la visualización canónica del dato central, y la fase 12 solo descartó gráficos para la correlación. Alternativa: solo lista y promedio (sin dependencia).
- **[NECESITA ACLARACIÓN]** **Paleta accesible.** El azul de marca se oscurece para texto y botones (`#3B82F6` → `#1D4ED8`, contraste 3,68 → 6,70); el azul actual queda solo como acento no textual. Los estados usan verde `#047857`, ámbar `#B45309` y rojo `#B91C1C`, todos ≥ 4,8 : 1. Es un cambio visible de marca.
- **[NECESITA ACLARACIÓN]** **Registro mínimo.** Solo correo, contraseña, nombre y términos (el backend ya solo exige correo y contraseña); teléfono y fecha de nacimiento pasan al perfil. Se elimina la confirmación de contraseña (se ofrece «mostrar contraseña»).
- **[NECESITA ACLARACIÓN]** **Solo tema claro.** Se declara `userInterfaceStyle: "light"`; el tema oscuro queda para otra fase.
- **[NECESITA ACLARACIÓN]** **Implementación por etapas.** Cinco PRs (15A a 15E), cada uno verificado en el celular y sin romper los anteriores. Empezar por 15A (sistema de diseño) porque todo lo demás depende de él.

## 9. Definición de terminado

- CA-15.1 … CA-15.20 verificados; los de interacción, en el celular.
- Revisión final con la lista de `diseñador_ux.md` (UX, interacción, visual, accesibilidad, móvil) marcada en el PR.
- `CLAUDE.md` actualizado con los tokens, los componentes base y la navegación.
- Estado `Implementada` en [specs/README.md](../README.md).
