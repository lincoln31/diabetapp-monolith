# Spec F8 — Rachas y meta diaria de glucometrías

| Campo | Valor |
|---|---|
| Fase | 8 |
| Estado | Aprobada |
| Fecha | 2026-09-24 |
| Depende de | Fase 5 (dashboard por tarjetas), Fase 7 (perfil editable) |
| Issues relacionados | Cierra #25, #26 (rachas) y #22, #23, #24 (metas diarias, por la vía del perfil — ver §8). Se cierran por ya estar entregados: #56, #57 (fase 4). Fuera de esta fase: #27, #28, #54 (badges) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H8.1 Nada motiva a registrar todos los días | El paciente ve promedios (fase 5) pero no si está siendo constante; el hábito de medirse es justo lo que mejora el control. |
| H8.2 La meta diaria existe pero no se usa ni se edita | `User.dailyGlucoseChecks` (4 por defecto) y `User.timezone` están en el modelo desde el inicio; ningún endpoint ni pantalla los lee o escribe. |
| H8.3 El backlog de gamificación asume un esquema propio | #22 pide «esquema de BD para Metas» y #23 un CRUD de metas, pero las metas que hoy existen son campos del usuario (`dailyGlucoseChecks`, `exerciseGoalMinutes`); un CRUD de metas arbitrarias no tiene ningún consumidor todavía. |
| H8.4 Dos issues abiertos ya están entregados | #56 (pruebas del módulo de autenticación) y #57 (pipeline de CI que corre lint, tipos y tests en cada PR): la fase 4 los implementó (`test/auth.*.test.ts`, `.github/workflows/ci.yml`) y quedaron sin cerrar. |

## 2. Objetivo

Que el paciente vea su **racha** de días seguidos registrando glucosa y su avance de hoy contra su **meta diaria**, y pueda cambiar esa meta, para reforzar la constancia sin castigar el día en curso.

## 3. Alcance

**Incluye:** H8.1 a H8.3 — cálculo de racha en el backend (#26), tarjeta de racha en el dashboard (#25) y meta diaria editable en el perfil (#22, #23, #24 por la vía del perfil).

**No incluye:**
- Badges y logros (#27, #28) y alertas de logros (#54): dependen de tener rachas y del módulo de notificaciones.
- Recordatorios de glucometría (#52) y cualquier notificación (FCM, #51).
- Meta de ejercicio (`exerciseGoalMinutes`): pertenece al módulo de ejercicio (#36–#40).
- Un CRUD de metas arbitrarias (ver decisión en §8).
- Cambiar la zona horaria desde la app (se usa la guardada en el usuario).

## 4. Historias de usuario

- **HU-8.1** Como paciente, quiero ver cuántos días seguidos llevo registrando glucosa, para mantener el hábito.
- **HU-8.2** Como paciente, quiero que mi racha no se rompa mientras el día de hoy no ha terminado, para no sentir que perdí la racha a las 9 de la mañana.
- **HU-8.3** Como paciente, quiero ver mi mejor racha, para tener una marca que superar.
- **HU-8.4** Como paciente, quiero ver cuántas lecturas llevo hoy de mi meta diaria.
- **HU-8.5** Como paciente, quiero cambiar mi meta diaria de lecturas, porque mi médico me pidió un número distinto de 4.
- **HU-8.6** Como paciente, quiero que «hoy» se cuente en mi zona horaria, no en la del servidor.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-8.1 | DEBE existir un endpoint que devuelva, para el usuario autenticado: racha actual, mejor racha, lecturas de hoy, meta diaria y si hoy ya la cumplió. | HU-8.1 – HU-8.4 |
| RF-8.2 | Un día «cuenta» para la racha si tiene **al menos una** lectura (ver decisión §8). Los días se calculan en la zona horaria del usuario (`User.timezone`), sobre `timestamp` de la lectura, no sobre `createdAt`. | HU-8.1, HU-8.6 |
| RF-8.3 | La racha actual es el número de días consecutivos que terminan **hoy**; si hoy todavía no tiene lecturas, termina **ayer** (la racha sigue viva hasta que acabe el día). Si ni hoy ni ayer tienen lecturas, es 0. | HU-8.2 |
| RF-8.4 | La mejor racha es la más larga de todo el historial y siempre es mayor o igual que la actual. | HU-8.3 |
| RF-8.5 | Registrar una lectura con fecha de un día pasado (retroactiva) DEBE reflejarse en las rachas, porque se calculan sobre el historial y no se guardan. | HU-8.1 |
| RF-8.6 | Un usuario sin lecturas recibe racha 0, mejor racha 0 y `todayCount` 0, sin error. | HU-8.1 |
| RF-8.7 | Solo usa datos del usuario autenticado; exige sesión. | — |
| RF-8.8 | El perfil (fase 7) DEBE aceptar y devolver `dailyGlucoseChecks` (entero, con límites del plan; `null` no permitido: sin meta no hay progreso que mostrar, se restablece a 4). | HU-8.5 |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-8.9 | El dashboard DEBE mostrar una tarjeta de racha con la racha actual destacada, la mejor racha y el avance de hoy («2 de 4 lecturas hoy»). | HU-8.1, HU-8.3, HU-8.4 |
| RF-8.10 | Con racha 0 la tarjeta DEBE invitar a empezar («Registra una glucosa hoy para iniciar tu racha»), no mostrar «0 días» como un fracaso. | HU-8.1 |
| RF-8.11 | Cuando hoy ya cumplió la meta, la tarjeta DEBE mostrarlo con una señal visual distinta. | HU-8.4 |
| RF-8.12 | La tarjeta se refresca con el resto del dashboard: al volver a la pantalla y al deslizar hacia abajo. | HU-8.1 |
| RF-8.13 | Si la racha no se puede cargar, la tarjeta NO DEBE romper el dashboard: no se muestra (mismo criterio que la tarjeta de HbA1c). No se muestra con el dashboard vacío. | — |
| RF-8.14 | «Mi perfil» DEBE incluir el campo «Lecturas por día» con las mismas reglas que el backend. | HU-8.5 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-8.1 | El cálculo NO DEBE traer todas las lecturas a memoria: el backend agrupa por día en la base de datos (una consulta) y calcula la racha sobre esa lista de días. |
| RNF-8.2 | Con 10 000 lecturas de un usuario el endpoint responde en menos de 300 ms (mismo umbral que RNF-5.3). |
| RNF-8.3 | Sigue las reglas ya vigentes: sin `any`, validación con Zod en la frontera, tests de integración (constitución P3, P5, P6) y sin valores de salud en logs (P1). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-8.1 | Lecturas hoy, ayer y anteayer | Se pide la racha | `current` = 3 | RF-8.1, RF-8.3 |
| CA-8.2 | Lecturas ayer y anteayer, ninguna hoy | Se pide la racha | `current` = 2 (sigue viva) | RF-8.3 |
| CA-8.3 | Lecturas anteayer y hace 4 días, ninguna ayer ni hoy | Se pide la racha | `current` = 0 y `longest` = 1 | RF-8.3, RF-8.4 |
| CA-8.4 | Una racha pasada de 5 días y una actual de 2 | Se pide la racha | `current` = 2 y `longest` = 5 | RF-8.4 |
| CA-8.5 | Varias lecturas el mismo día | Se pide la racha | Ese día cuenta una sola vez | RF-8.2 |
| CA-8.6 | Una lectura a las 23:30 hora local que en UTC ya es el día siguiente | Se pide la racha | Cuenta en el día local del usuario | RF-8.2 |
| CA-8.7 | Un hueco de un día que se rellena con una lectura retroactiva | Se pide la racha | Las dos rachas se unen | RF-8.5 |
| CA-8.8 | Un usuario sin lecturas | Se pide la racha | Todo en 0, sin error | RF-8.6 |
| CA-8.9 | Lecturas de otro usuario | Se pide la racha | No se cuentan | RF-8.7 |
| CA-8.10 | Meta diaria 4 y 2 lecturas hoy | Se pide la racha | `todayCount` = 2, `goalReachedToday` = false | RF-8.1 |
| CA-8.11 | Un usuario | Actualiza `dailyGlucoseChecks` a 6 | El perfil y la racha devuelven meta 6; un valor fuera de límites da `VALIDATION_ERROR` | RF-8.8 |
| CA-8.12 | Un usuario con racha | Abre el dashboard | Ve la tarjeta con racha, mejor racha y avance de hoy | RF-8.9 |
| CA-8.13 | Un usuario sin racha pero con lecturas viejas | Abre el dashboard | Ve la invitación a empezar, no «0 días» | RF-8.10 |
| CA-8.14 | El usuario registra una glucosa y vuelve | Vuelve al dashboard | La racha y el avance de hoy se actualizan solos | RF-8.12 |
| CA-8.15 | El backend caído | Se abre el dashboard | La tarjeta de racha no aparece y no rompe la pantalla | RF-8.13 |
| CA-8.16 | El perfil | El usuario cambia «Lecturas por día» y guarda | El avance de hoy usa la meta nueva | RF-8.14 |
| CA-8.17 | 10 000 lecturas | Se pide la racha | Responde en menos de 300 ms | RNF-8.2 |

## 8. Decisiones

- **Resuelta (2026-09-24):** un día cuenta para la racha con **al menos una lectura**; la meta diaria se muestra como avance del día pero no rompe la racha.
- **Resuelta (2026-09-24):** no se crea tabla ni CRUD de metas; la meta diaria es `User.dailyGlucoseChecks`. Se aclara que **debe ser modificable por el usuario**: mínimo 1 y él elige el número que quiera (4, 5, etc.) desde «Mi perfil». #22, #23 y #24 se cierran al terminar la fase con un comentario que lo explique.
- **Resuelta (2026-09-24):** la meta diaria admite de **1 a 20** lecturas por día (valor por defecto 4).
- **Decisión tomada:** las rachas **no se guardan**: se calculan sobre el historial en cada petición. Guardar un contador exigiría mantenerlo coherente con lecturas retroactivas, borradas o editadas (RF-8.5); con una consulta agrupada por día el costo es mínimo (RNF-8.1).
- **Decisión tomada:** se cierran #56 y #57 ahora (H8.4), sin esperar a la implementación: ya están en `Develop`.

## 9. Definición de terminado

- CA-8.1 … CA-8.17 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con el endpoint de racha y la tarjeta del dashboard.
- Issues #25, #26 cerrados desde el PR; #22, #23, #24 cerrados con el comentario de §8; #56 y #57 ya cerrados.
- Estado `Implementada` en [specs/README.md](../README.md).
