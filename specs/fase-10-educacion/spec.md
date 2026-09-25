# Spec F10 — Contenido educativo

| Campo | Valor |
|---|---|
| Fase | 10 |
| Estado | Borrador |
| Fecha | 2026-09-25 |
| Depende de | Fase 3 (estructura por funcionalidades), Fase 5 (dashboard extensible por tarjetas) |
| Issues relacionados | Cierra #43, #44, #45. #41 y #42 se resuelven sin backend (ver §8) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H10.1 La app no enseña nada sobre diabetes | Todas las pantallas son de registro y seguimiento (glucosa, perfil, racha, logros); no hay ningún contenido educativo, aunque el eslogan de la app es «Tu compañero para una mejor hemoglobina». |
| H10.2 No hay forma de calcular carbohidratos | Contar carbohidratos es una tarea diaria habitual del manejo de la diabetes, y hoy el paciente tiene que hacerlo fuera de la app. |
| H10.3 El contenido educativo no necesita servidor | Los tips y las guías son texto fijo, iguales para todos los pacientes, sin personalización ni fecha de caducidad real; no hay ningún issue que pida administrarlos desde un panel. |

## 2. Objetivo

Que el paciente vea un consejo educativo distinto cada día en el dashboard, tenga una calculadora de carbohidratos a mano al registrar comidas, y pueda consultar guías y preguntas frecuentes sobre diabetes — todo dentro de la app, sin depender de otra fuente.

## 3. Alcance

**Incluye:** H10.1 – H10.3 — tarjeta de tip del día en el dashboard (#42, #43), calculadora de carbohidratos (#44) y guías/FAQs (#45); #41 se resuelve sin crear la tabla que pedía (ver §8).

**No incluye:**
- Administrar el contenido (tips, guías) desde una pantalla o panel: no hay issue que lo pida; el contenido se edita en el código.
- Guardar el resultado de la calculadora junto a una lectura de glucosa o como parte del registro (#44 dice «lógica en frontend»; no hay campo de carbohidratos en `GlucoseReading` hoy).
- Contenido personalizado por tipo de diabetes o traducido a otro idioma.
- Videos, imágenes o contenido multimedia: solo texto.

## 4. Historias de usuario

- **HU-10.1** Como paciente, quiero ver un consejo distinto cada día en el dashboard, para aprender algo nuevo sin buscarlo.
- **HU-10.2** Como paciente, quiero calcular los carbohidratos de lo que voy a comer a partir del valor nutricional del empaque, para ajustar mi dosis o mi registro.
- **HU-10.3** Como paciente, quiero consultar guías y preguntas frecuentes sobre diabetes dentro de la misma app.
- **HU-10.4** Como paciente, quiero llegar a la calculadora y a las guías desde el dashboard, sin que le quiten espacio a lo que ya uso todos los días.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-10.1 | El dashboard DEBE mostrar una tarjeta con un consejo educativo que cambia una vez al día. | HU-10.1 |
| RF-10.2 | El consejo del día DEBE ser el mismo durante todo el día para un mismo paciente y DEBE rotar por un catálogo fijo de al menos 15 consejos (repite el ciclo al agotarlo). | HU-10.1 |
| RF-10.3 | DEBE existir una calculadora de carbohidratos: el paciente ingresa los carbohidratos por 100 g (del empaque) y los gramos que va a comer, y la app calcula el total de carbohidratos y su equivalente en raciones de 10 g. | HU-10.2 |
| RF-10.4 | La calculadora DEBE validar que ambos campos sean números positivos antes de calcular, con el error bajo el campo correspondiente. | HU-10.2 |
| RF-10.5 | DEBE existir una pantalla de «Guías y FAQs» con secciones de guía (texto corto) y una lista de preguntas frecuentes con su respuesta, plegada por defecto. | HU-10.3 |
| RF-10.6 | El dashboard DEBE dar acceso a la calculadora y a las guías desde un único punto de entrada («Educación»), para no sumar más botones sueltos a los que ya existen. | HU-10.4 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-10.1 | Ninguna de las tres piezas (tip, calculadora, guías) DEBE depender de una petición al backend: todo el contenido vive en el frontend (constitución P8; ver decisión §8). |
| RNF-10.2 | La calculadora NO DEBE dividir por cero ni aceptar texto no numérico; un cálculo inválido no rompe la pantalla. |
| RNF-10.3 | Sigue las reglas ya vigentes: sin `any`, tests unitarios de la selección del tip y de la calculadora (constitución P5, P6). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-10.1 | El dashboard | Se abre en un día cualquiera | Muestra un tip del catálogo | RF-10.1 |
| CA-10.2 | El dashboard | Se abre dos veces el mismo día | Muestra el mismo tip las dos veces | RF-10.2 |
| CA-10.3 | El dashboard | Se abre en dos días distintos | Puede mostrar un tip distinto (no siempre el primero del catálogo) | RF-10.2 |
| CA-10.4 | La calculadora | El paciente ingresa 25 g de carbohidratos por 100 g y 80 g de porción | Ve 20 g de carbohidratos totales y 2 raciones | RF-10.3 |
| CA-10.5 | La calculadora | El paciente deja un campo vacío o escribe texto | Ve el error bajo ese campo y no ve un resultado | RF-10.4 |
| CA-10.6 | La calculadora | El paciente ingresa un número negativo | Ve el error bajo ese campo | RF-10.4 |
| CA-10.7 | «Guías y FAQs» | El paciente toca una pregunta | Se despliega su respuesta; las demás siguen plegadas | RF-10.5 |
| CA-10.8 | El dashboard | El paciente toca «Educación» | Ve las opciones «Calculadora de carbohidratos» y «Guías y FAQs» | RF-10.6 |
| CA-10.9 | El backend caído | El paciente abre el dashboard, la calculadora o las guías | Las tres funcionan igual: no dependen del backend | RNF-10.1 |

## 8. Decisiones

- **[NECESITA ACLARACIÓN]** #41 pide un «esquema de BD para almacenar contenido educativo». Propuesta: **sin backend ni tabla**. El catálogo de tips y el contenido de guías/FAQs son listas fijas en el código del frontend (mismo patrón que `ACHIEVEMENTS` de la fase 9 o `MOMENT_OF_DAY_OPTIONS` de la fase 1): no hay pantalla de administración que los edite, así que una tabla solo agregaría una migración y un endpoint sin ningún beneficio real. #41 y #42 (el endpoint) se cierran con un comentario que lo explique. Si más adelante se pide poder editar el contenido sin publicar una nueva versión de la app, se revisará esta decisión.
- **[NECESITA ACLARACIÓN]** El tip del día se selecciona por la **fecha local del celular** (no por la zona horaria guardada del usuario, a diferencia de la racha en la fase 8): es contenido no crítico, y evita cualquier lógica de fecha en el frontend. ¿De acuerdo, o prefieres que también respete la zona horaria del perfil?
- **[NECESITA ACLARACIÓN]** Único punto de entrada «Educación» en el dashboard, con la calculadora y las guías como dos opciones dentro (RF-10.6), en vez de dos botones nuevos sueltos (el dashboard ya tiene cinco). ¿Apruebas, o prefieres botones directos?

## 9. Definición de terminado

- CA-10.1 … CA-10.9 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con la funcionalidad `education` del frontend.
- Issues #43, #44 y #45 cerrados desde el PR; #41 y #42 cerrados con el comentario de §8.
- Estado `Implementada` en [specs/README.md](../README.md).
