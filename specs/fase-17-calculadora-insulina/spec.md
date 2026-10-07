# Spec F17 — Calculadora de dosis de insulina

| Campo | Valor |
|---|---|
| Fase | 17 |
| Estado | Implementada |
| Fecha | 2026-10-06 |
| Depende de | Fase 7 (perfil y metas), Fase 10 (educación, calculadora de carbohidratos) |
| Issues relacionados | — (pedido directo del usuario) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H17.1 La app no ayuda a calcular cuánta insulina aplicar | Existe una calculadora de carbohidratos (fase 10), pero el paciente que usa insulina tiene que calcular la dosis a mano fuera de la app, usando el ratio y el factor de corrección que le dio su médico/nutricionista. |
| H17.2 Contar los carbohidratos de un alimento es un paso manual | El paciente tiene una tabla de equivalencias (de su nutricionista) con el contenido de carbohidratos de ~130 alimentos comunes en Colombia, y hoy la busca fuera de la app para saber cuántos gramos de CHO tiene una porción. |
| H17.3 La calculadora de carbohidratos actual está escondida | Hoy solo se llega a ella desde «Más → Educación → Calculadora de carbohidratos»; el paciente la necesita justo cuando va a registrar o va a comer, no navegando varios niveles. |

## 2. Objetivo

Que el paciente, al ir a comer o al registrar una glucosa, pueda calcular en la app cuánta insulina rápida aplicar: busca el alimento en una tabla de equivalencias (o escribe los gramos de carbohidratos a mano), la app suma la dosis por la comida y la dosis de corrección según la glucosa actual, usando el ratio y el factor de sensibilidad que el paciente configuró con su médico — y llega a esa calculadora con un botón visible, sin tener que buscarla.

## 3. Alcance

**Incluye:** H17.1 – H17.3 — dos campos nuevos de configuración en el perfil (ratio de carbohidratos y factor de sensibilidad), una tabla local de alimentos con buscador, y una pantalla de calculadora de dosis con acceso directo desde «Registrar glucosa» y desde «Educación».

**No incluye:**
- Enviar o guardar la dosis calculada como una toma de insulina (no hay módulo de insulina como el de `medications`); es un cálculo de referencia, no un registro.
- Más de un perfil de ratio/factor (p. ej. uno para el desayuno y otro para la cena): un único valor por paciente, como ya hacen `targetGlucoseMin`/`Max`.
- Editar o ampliar la tabla de alimentos desde la app: es contenido fijo igual que `TIPS`/`GUIDES`/`FAQS` de la fase 10 (constitución P8).
- Avisos clínicos de seguridad más allá de un texto de descargo (la app no es un dispositivo médico).

## 4. Historias de usuario

- **HU-17.1** Como paciente que usa insulina rápida, quiero configurar en mi perfil cuántos gramos de carbohidratos cubre una unidad y cuánto baja mi glucosa una unidad, para que la app pueda calcular mi dosis.
- **HU-17.2** Como paciente, quiero buscar un alimento de una lista y ver cuántos carbohidratos tiene su porción, sin calcular a mano gramos por 100 g.
- **HU-17.3** Como paciente, quiero ver la dosis de insulina sugerida (por la comida y por corrección) a partir de los carbohidratos que voy a comer y mi glucosa actual.
- **HU-17.4** Como paciente, quiero llegar a esta calculadora con un botón directo al registrar una glucosa, no solo buscándola en Educación.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-17.1 | «Mi perfil» DEBE permitir configurar `insulinCarbRatio` (gramos de CHO que cubre 1 unidad) e `insulinSensitivityFactor` (mg/dL que baja 1 unidad), ambos opcionales y editables igual que el resto del perfil (`null` los borra). | HU-17.1 |
| RF-17.2 | DEBE existir una tabla local de alimentos (nombre, porción, gramos de la porción, gramos de CHO) con un buscador por nombre. | HU-17.2 |
| RF-17.3 | Al elegir un alimento de la búsqueda, la calculadora DEBE usar sus gramos de CHO como carbohidratos de la comida; el paciente también DEBE poder escribir los carbohidratos a mano (alimentos fuera de la tabla). | HU-17.2 |
| RF-17.4 | Con el ratio y el factor configurados, la calculadora DEBE mostrar: dosis por comida (`carbohidratos ÷ ratio`), dosis de corrección (`(glucosa actual − meta) ÷ factor`, nunca negativa) y la suma total, redondeada a 0.5 unidades. | HU-17.3 |
| RF-17.5 | La meta de corrección DEBE ser el punto medio del rango guardado en el perfil (`targetGlucoseMin`/`targetGlucoseMax`); si el perfil no tiene rango, la calculadora no calcula la corrección. | HU-17.3 |
| RF-17.6 | Si el paciente no configuró el ratio o el factor, la calculadora DEBE explicarlo y ofrecer ir a «Mi perfil» a configurarlos, en vez de mostrar un resultado. | HU-17.1, HU-17.3 |
| RF-17.7 | «Registrar glucosa» DEBE tener un botón a la calculadora que lleva ya cargada la glucosa que el paciente está escribiendo. | HU-17.4 |
| RF-17.8 | La calculadora DEBE seguir accesible desde «Educación», junto a la calculadora de carbohidratos existente. | HU-17.4 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-17.1 | La tabla de alimentos y el cálculo de dosis viven en el frontend, sin pedirle nada al backend (mismo patrón que la fase 10, RNF-10.1). |
| RNF-17.2 | El resultado siempre lleva un texto de descargo: es una referencia, no reemplaza la indicación médica. |
| RNF-17.3 | La calculadora NO DEBE sugerir una dosis negativa ni dividir por cero. |
| RNF-17.4 | Sigue las reglas vigentes: sin `any`, tests unitarios del cálculo de dosis (constitución P5, P6). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-17.1 | «Mi perfil» | El paciente guarda ratio 10 g/u y factor 40 mg/dL/u | Al volver a abrir el perfil, ambos valores siguen guardados | RF-17.1 |
| CA-17.2 | La calculadora | El paciente escribe «arepa» en el buscador | Ve los alimentos de la tabla que contienen «arepa» | RF-17.2 |
| CA-17.3 | La calculadora | El paciente elige «Arroz cocido» (45 g de CHO) | El campo de carbohidratos de la comida queda en 45 g | RF-17.3 |
| CA-17.4 | El perfil tiene ratio 10 g/u, factor 40 mg/dL/u y rango 80–180 (meta 130) | El paciente ingresa 45 g de CHO y glucosa actual 200 | Ve dosis por comida 4.5 u, corrección 1.75 u y el total 6.5 u (redondeado a 0.5 u) | RF-17.4, RF-17.5 |
| CA-17.5 | El perfil tiene ratio 10 y factor 40 | El paciente ingresa glucosa actual 100 (por debajo de la meta 130) | La dosis de corrección es 0, no negativa | RF-17.4, RNF-17.3 |
| CA-17.6 | El perfil no tiene ratio ni factor configurados | El paciente abre la calculadora | Ve el aviso para configurarlos y un botón a «Mi perfil», sin resultado numérico | RF-17.6 |
| CA-17.7 | «Registrar glucosa» con 150 escrito en el campo | El paciente toca «Calcular dosis de insulina» | La calculadora abre con 150 ya cargado en glucosa actual | RF-17.7 |
| CA-17.8 | «Educación» | El paciente abre la sección | Ve tanto «Calculadora de carbohidratos» como «Calculadora de dosis de insulina» | RF-17.8 |

## 8. Decisiones

- **Resuelta (2026-10-06):** la meta de corrección usa el punto medio de `targetGlucoseMin`/`targetGlucoseMax` ya existentes, en vez de pedir un tercer valor de "meta de corrección": evita un campo más en el perfil y es coherente con lo que ya usa `RangeAlert` (fase 7).
- **Resuelta (2026-10-06):** la tabla de alimentos es la lista de equivalencias de carbohidratos compartida por el nutricionista del usuario (bibliografía: atlas de porciones UIS, listas de intercambio ADA/ADA y universidades colombianas), transcrita como datos fijos en el frontend — mismo patrón que `TIPS`/`GUIDES` de la fase 10 (constitución P8): no hay issue ni necesidad de editarla desde la app.
- **Resuelta (2026-10-06):** el acceso principal es un botón en «Registrar glucosa» (no una pestaña nueva ni un acceso permanente en la pestaña Glucosa), para no sumar más botones a una pantalla que ya tiene cinco pestañas (fase 15).

## 9. Definición de terminado

- CA-17.1 … CA-17.8 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con los campos nuevos del perfil y el módulo de calculadora de insulina.
- Estado `Implementada` en [specs/README.md](../README.md).
