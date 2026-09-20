# Constitución del proyecto

Principios no negociables que toda especificación, plan y cambio de código de DiabetApp debe respetar. Si una spec necesita romper uno, primero se modifica este documento (con su justificación) y después la spec.

**Versión:** 1.0 · **Fecha:** 2026-09-19

---

## P1. Los datos de salud son sensibles por defecto

- Ningún secreto (JWT, contraseñas de BD, claves de terceros) se guarda en el repositorio, ni siquiera "de prueba". Solo se versionan archivos `*.example` con valores ficticios.
- La API **no revela** si un correo está registrado (ni por mensajes, ni por códigos HTTP, ni por diferencias de tiempo).
- Los logs **no contienen** contraseñas, tokens, correos ni valores clínicos.
- Todo recurso de un usuario se consulta y modifica filtrando por el `userId` del token, **en la misma operación** de base de datos.

## P2. Un único contrato de API

- Todas las respuestas JSON siguen el mismo formato (definido en la spec de la fase 1):
  - Éxito: `{ "success": true, "data": ..., "meta"?: ... }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "fields"?: [...] } }`
- Los `code` de error son constantes en `MAYÚSCULAS_CON_GUIONES_BAJOS`, estables y documentados. El frontend decide su comportamiento según `code`, nunca según `message`.

## P3. Validar en la frontera

- Toda entrada externa (body, query, params, variables de entorno) se valida con un esquema Zod antes de llegar a la lógica de negocio.
- El frontend replica las reglas de validación del backend para dar feedback inmediato, pero **el backend es la autoridad**.
- Los valores con un conjunto cerrado de opciones (`momentOfDay`, `typeOfDiabetes`, …) son enums tanto en Zod como en la base de datos.

## P4. Estructura predecible

- Todos los módulos del backend tienen la misma forma (definida en la fase 1).
- Todas las funcionalidades del frontend tienen la misma forma (definida en la fase 3).
- Los archivos de ruta (`app/` en Expo Router, `*.routes.ts` en Express) son finos: solo conectan; la lógica vive en otra capa.

## P5. Tipado estricto

- `strict: true` en ambos proyectos, sin excepciones.
- No se introduce `any` nuevo. Si un tipo es desconocido se usa `unknown` y se valida.
- `tsc --noEmit` pasa sin errores en ambos proyectos.

## P6. Calidad verificable

- La lógica de negocio nueva viene con tests.
- Un PR solo se fusiona con la CI en verde (lint + tipos + tests).
- Cada PR referencia las tareas y criterios de aceptación de la spec que implementa.

## P7. Idioma

- Identificadores de código (variables, funciones, tablas, códigos de error): **inglés**.
- Comentarios, documentación, specs y mensajes que ve el usuario: **español**.

## P8. Simplicidad

- No se añade una dependencia si el problema se resuelve con poco código propio y claro.
- No se construye para requisitos hipotéticos: cada pieza nueva responde a un requisito de una spec.
