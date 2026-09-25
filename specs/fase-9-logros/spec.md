# Spec F9 — Logros
| Campo | Valor |
|---|---|
| Fase | 9 |
| Estado | Aprobada |
| Fecha | 2026-09-25 |
| Depende de | Fase 3 (estructura por funcionalidades), Fase 8 (racha, de la que sale el logro por constancia) |
| Issues relacionados | Cierra #28. #27 se cierra por la vía de esta fase sin crear la tabla que pedía (ver §8) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |
## 1. Contexto y problema
| Hallazgo | Evidencia |
|---|---|
| H9.1 No hay ninguna recompensa por el historial acumulado | El paciente ve su racha (fase 8) y sus promedios (fase 5), pero nada reconoce que ya lleva, por ejemplo, 100 lecturas registradas: todo el esfuerzo pasado es invisible una vez deja de ser «reciente». |
| H9.2 El modelo ya anticipaba esto | `User` tiene una relación `achievements Achievement[]` comentada desde el inicio del proyecto, nunca implementada. |
| H9.3 Todo lo necesario para calcular logros ya existe | Un logro por racha usa la misma racha de la fase 8 (`longest`); un logro por volumen usa el conteo de `glucose_readings` que ya hace `GET /glucose` (`meta.total`). No hace falta guardar nada nuevo para saber si un paciente los alcanzó. |
## 2. Objetivo
Que el paciente vea, en una pantalla «Mis Logros», qué constancias ha alcanzado (rachas y cantidad de lecturas) y cuáles le faltan, para reforzar el progreso acumulado además del día a día que ya cubren el dashboard y la racha.
## 3. Alcance
**Incluye:** H9.1 – H9.3 — endpoint de logros y pantalla «Mis Logros» (#28), y #27 resuelto sin tabla nueva (ver §8).
**No incluye:**
- Notificar cuando se desbloquea un logro (#54, depende de FCM/#51): esta fase solo los muestra cuando el paciente entra a verlos.
- Logros sobre otros módulos (ejercicio, medicación, educación): no existen todavía esos datos.
- Compartir un logro fuera de la app.
- Insignias visuales ilustradas: se usan íconos del set ya existente (`Icon`), no artwork nuevo.
## 4. Historias de usuario
- **HU-9.1** Como paciente, quiero ver qué constancias ya alcancé (rachas, cantidad de lecturas), para sentir que el esfuerzo acumulado cuenta.
- **HU-9.2** Como paciente, quiero ver los logros que todavía no tengo y qué me falta para el siguiente, para tener una meta clara.
- **HU-9.3** Como paciente, quiero llegar a «Mis Logros» desde el dashboard.
## 5. Requisitos funcionales
### Backend
| ID | Requisito | HU |
|---|---|---|
| RF-9.1 | DEBE existir un endpoint que devuelva, para el usuario autenticado, la lista completa del catálogo de logros con: si está desbloqueado, el valor actual del paciente en esa métrica y el umbral que le falta. | HU-9.1, HU-9.2 |
| RF-9.2 | El catálogo DEBE incluir logros de **racha** (mejor racha histórica, fase 8) y de **volumen** (cantidad total de lecturas). | HU-9.1 |
| RF-9.3 | Un logro NO DEBE poder «perderse»: una vez que el valor del paciente alcanza el umbral queda desbloqueado, y como ambas métricas (mejor racha, total de lecturas) nunca bajan, no hace falta guardar el desbloqueo. | HU-9.1 |
| RF-9.4 | Solo usa datos del usuario autenticado; exige sesión. | — |
| RF-9.5 | Un usuario sin lecturas recibe el catálogo completo, todo bloqueado en cero, sin error. | HU-9.1 |
### Frontend
| ID | Requisito | HU |
|---|---|---|
| RF-9.6 | DEBE existir una pantalla «Mis Logros», accesible desde un botón en el dashboard. | HU-9.3 |
| RF-9.7 | Cada logro DEBE mostrar su nombre, descripción, y si está desbloqueado o el progreso hacia él (p. ej. «7 de 10 lecturas»). | HU-9.1, HU-9.2 |
| RF-9.8 | Los logros desbloqueados DEBEN distinguirse visualmente de los bloqueados (no solo por texto). | HU-9.1 |
| RF-9.9 | Si la lista no se puede cargar, la pantalla DEBE mostrar un mensaje de error claro con opción de reintentar (mismo patrón que el resto de la app), no una pantalla en blanco. | — |
## 6. Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-9.1 | El endpoint NO DEBE traer las lecturas a memoria: usa el mismo agrupado por día de la fase 8 para la racha y un `count()` para el volumen — dos consultas acotadas, no N+1. |
| RNF-9.2 | Con 10 000 lecturas de un usuario el endpoint responde en menos de 300 ms (mismo umbral que RNF-5.3/RNF-8.2). |
| RNF-9.3 | Sigue las reglas ya vigentes: sin `any`, tests (unitarios del catálogo y de integración), principio P8 de simplicidad (constitución). |
## 7. Criterios de aceptación
| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-9.1 | Un usuario sin lecturas | Pide sus logros | Recibe el catálogo completo, todo bloqueado, sin error | RF-9.5 |
| CA-9.2 | Un usuario con una racha de 10 días y 15 lecturas en total | Pide sus logros | Los logros de racha de 3 y 7 están desbloqueados, el de 30 no; el de volumen de 10 está desbloqueado, el de 50 no | RF-9.1, RF-9.2 |
| CA-9.3 | Un logro ya desbloqueado | Pasa el tiempo y la racha actual baja (pero la mejor racha histórica no) | Sigue desbloqueado | RF-9.3 |
| CA-9.4 | Lecturas de otro usuario | Se piden los logros | No cuentan para el total ni para la racha | RF-9.4 |
| CA-9.5 | Sin sesión | Se piden los logros | `UNAUTHENTICATED` | RF-9.4 |
| CA-9.6 | El dashboard | El usuario toca «Mis Logros» | Ve la lista completa, con los desbloqueados distinguidos de los bloqueados | RF-9.6 – RF-9.8 |
| CA-9.7 | Un logro bloqueado | Se muestra en la pantalla | Se ve cuánto le falta (p. ej. «7 de 10 lecturas») | RF-9.7 |
| CA-9.8 | El backend caído | El usuario abre «Mis Logros» | Ve un mensaje de error con «Reintentar», no una pantalla en blanco | RF-9.9 |
| CA-9.9 | 10 000 lecturas | Se piden los logros | Responde en menos de 300 ms | RNF-9.2 |
## 8. Decisiones
- **Resuelta (2026-09-25):** #27 pide un «esquema de BD para Badges y logros». Se aprueba: **no se crea tabla** (ni `Achievement`, ni una tabla de desbloqueos por usuario). El catálogo es una lista fija en código (como los umbrales de HbA1c o de la meta diaria) y el estado desbloqueado/bloqueado se calcula en cada petición a partir de datos que ya existen y nunca bajan (RF-9.3) — mismo patrón que las rachas de la fase 8 (D-8.1: «no se guarda nada»). #27 se cierra con un comentario que lo explique, igual que se hizo con #22/#23/#24 en la fase 8.
- **[NECESITA ACLARACIÓN]** Catálogo de logros propuesto (6, ampliable después sin migración por ser código, no datos):
  - Racha: **3, 7 y 30** días seguidos (reutiliza los umbrales que ya tiene sentido mostrar según la fase 8).
  - Volumen: **10, 50 y 100** lecturas registradas en total.
- **[NECESITA ACLARACIÓN]** Dónde se muestran: el issue #28 pide una **pantalla**, no una tarjeta del dashboard. Se aprueba: pantalla dedicada «Mis Logros» con un botón de acceso en el dashboard (mismo patrón que «Mi perfil»), sin tarjeta-resumen en el dashboard por ahora (se puede agregar después sin romper nada, es una pieza más de la lista de tarjetas).
## 9. Definición de terminado
- CA-9.1 … CA-9.9 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con el endpoint de logros y la pantalla «Mis Logros».
- Issue #28 cerrado desde el PR; #27 cerrado con el comentario de §8.
- Estado `Implementada` en [specs/README.md](../README.md).