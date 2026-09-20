# Especificaciones de DiabetApp (SDD)

Este directorio contiene las especificaciones del plan de mejora de arquitectura, escritas con **Desarrollo Guiado por Especificaciones (Spec-Driven Development, SDD)**: primero se define *qué* se construye y *por qué*, se aprueba, y solo después se decide *cómo* y se implementa.

## Flujo de trabajo

```
1. Especificar  →  2. Planificar  →  3. Desglosar en tareas  →  4. Implementar  →  5. Verificar
   spec.md            plan.md             tasks.md                  (código + PR)      (criterios CA)
```

| Paso | Artefacto | Qué contiene | Qué NO contiene |
|---|---|---|---|
| 1. Especificar | `spec.md` | Problema, objetivo, alcance, historias de usuario, requisitos (RF/RNF), criterios de aceptación | Librerías, nombres de archivos, código |
| 2. Planificar | `plan.md` | Diseño técnico: decisiones, archivos afectados, contratos, migraciones, riesgos | Requisitos nuevos (si falta uno, se vuelve a `spec.md`) |
| 3. Tareas | `tasks.md` | Lista ordenada de tareas pequeñas, con dependencias y trazabilidad a RF | Diseño nuevo |
| 4. Implementar | Código | Una rama por fase (o por grupo de tareas), commits que citan IDs de tarea | Cambios fuera de la spec |
| 5. Verificar | PR | Cada criterio de aceptación (CA) comprobado y marcado en el PR | — |

### Reglas

1. **No se implementa nada sin una spec en estado `Aprobada`.**
2. Si durante la implementación aparece algo no previsto, **se actualiza primero la spec** (o el plan) y después el código. La spec es la fuente de verdad, no el código.
3. Toda spec cumple la [constitución](constitucion.md) del proyecto. Si una spec necesita romper un principio, se discute y se modifica la constitución explícitamente.
4. Los puntos marcados **`[NECESITA ACLARACIÓN]`** deben resolverse antes de aprobar la spec. La resolución se anota en la sección "Decisiones" del propio documento.
5. Cada PR indica en su descripción las tareas (`T1.4`) y criterios (`CA-1.2`) que cubre.

### Estados de una spec

`Borrador` → `En revisión` → `Aprobada` → `En implementación` → `Implementada`

### Convención de identificadores

| Prefijo | Significado | Ejemplo |
|---|---|---|
| `HU-<fase>.<n>` | Historia de usuario | `HU-2.1` |
| `RF-<fase>.<n>` | Requisito funcional | `RF-1.3` |
| `RNF-<fase>.<n>` | Requisito no funcional | `RNF-1.2` |
| `CA-<fase>.<n>` | Criterio de aceptación (Dado / Cuando / Entonces) | `CA-0.4` |
| `D-<fase>.<n>` | Decisión técnica (en `plan.md`) | `D-2.1` |
| `T<fase>.<n>` | Tarea (en `tasks.md`); `[P]` = paralelizable | `T3.7 [P]` |

Las palabras **DEBE**, **NO DEBE** y **PUEDE** en los requisitos tienen el sentido de RFC 2119 (obligatorio, prohibido, opcional).

## Índice de fases

| Fase | Spec | Objetivo | Depende de | Issues | Estimación |
|---|---|---|---|---|---|
| 0 | [Correcciones urgentes](fase-0-correcciones-urgentes/spec.md) | Cerrar el secreto filtrado, bugs que rompen la app y código muerto | PR #74 fusionado | — | ½ día |
| 1 | [Bases del backend](fase-1-bases-backend/spec.md) | Contrato de API único, manejo de errores, módulos homogéneos, BD robusta | Fase 0 | #19 (prepara) | 2–3 días |
| 2 | [Sesión y seguridad](fase-2-sesion-seguridad/spec.md) | Sesiones que se renuevan, rutas protegidas, protección contra abuso | Fase 1 | #14, #15 (prepara) | 2 días |
| 3 | [Arquitectura del frontend](fase-3-arquitectura-frontend/spec.md) | Estructura por funcionalidades, capa de servicios tipada, formularios con errores por campo | Fase 2 | #48 (prepara) | 2–3 días |
| 4 | [Calidad continua](fase-4-calidad-continua/spec.md) | Tests, linters y CI que bloquea PRs rotos | Fase 1 (backend), Fase 3 (frontend) | #56, #57 | 2 días |

> La fase 4 puede empezar en paralelo para el backend en cuanto la fase 1 esté fusionada.

## Estado actual

| Fase | Estado |
|---|---|
| 0 | En implementación (PR abierto; pendiente rotar el secreto en los servidores) |
| 1 | En implementación (PR abierto; falta probar la app en dispositivo) |
| 2 | Borrador |
| 3 | Borrador |
| 4 | Borrador |
