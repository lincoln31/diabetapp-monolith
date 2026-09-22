# Spec F1 — Bases del backend

| Campo | Valor |
|---|---|
| Fase | 1 |
| Estado | Borrador |
| Fecha | 2026-09-19 |
| Depende de | Fase 0 |
| Issues relacionados | Prepara #19 (promedios), #11 (sincronización) y todos los módulos nuevos (#22–#54) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

El backend tiene dos módulos (`auth`, `glucose`) y cada uno resuelve lo mismo de forma distinta. Todos los módulos nuevos del backlog (metas, medicamentos, ejercicio…) copiarían estas inconsistencias.

| Hallazgo | Evidencia |
|---|---|
| H1.1 Tres formatos de respuesta | `auth`: `{success, message, code}` · `glucose`: `{success, error, message}` · middleware: `{error, message}` sin `success`. |
| H1.2 Sin manejo central de errores | Cada controlador repite `try/catch` + `switch (error.message)`; los errores se identifican por texto (`new Error('USER_ALREADY_EXISTS')`). |
| H1.3 Validación dispersa | `auth` valida dentro del controlador; `glucose` también, con un helper propio; no hay forma común de validar `query` ni `params`. |
| H1.4 Módulos con formas distintas | `auth/auth.controller.ts` (plano) vs `glucose/controllers/glucoseControllers.ts` (subcarpetas); `glucose/index.ts` re-exporta cosas que nadie importa. |
| H1.5 Configuración cargada tres veces | `server.ts` llama a `dotenv.config()`, a `loadEnvConfig()` y además importa `env` (que ya lo hace); luego usa `process.env.PORT`. |
| H1.6 "Enums" como texto libre | `momentOfDay`, `typeOfDiabetes`, `activityLevel`, `insulinType` son `String` en Prisma: la BD acepta cualquier valor. |
| H1.7 Sin índice para la consulta principal | `glucose_readings` no tiene índice por `(userId, timestamp)`; la única es la de `users.email`. |
| H1.8 Listado sin límites | `GET /api/glucose` devuelve **todas** las lecturas del usuario, sin filtros ni paginación. |
| H1.9 Operaciones en dos pasos | `update`/`delete` de glucosa hacen `findFirst({id, userId})` y después operan solo por `id`. |
| H1.10 Logs ruidosos y con datos | Prisma registra todas las consultas (`log: ['query', …]`) en cualquier entorno; `console.log` por cada petición; IP `192.168.1.9` fija en los mensajes de arranque; el 404 lista rutas desactualizadas. |
| H1.11 Código muerto y `any` | `getGlucoseStats` sin uso; `createData: any`; `catch (error: any)` en todos los controladores. |
| H1.12 App y servidor en el mismo archivo | `server.ts` crea la app y hace `listen`, lo que impide probar la API sin levantar un puerto (bloquea la fase 4). |

## 2. Objetivo

Que el backend tenga **un contrato de API único**, **un único camino de errores y validación**, **una forma de módulo replicable** y **una base de datos que proteja la integridad de los datos**, de modo que cada módulo nuevo del backlog se construya copiando un patrón correcto.

## 3. Alcance

**Incluye:** H1.1 a H1.12 y la adaptación mínima del frontend al nuevo formato de error.

**No incluye:**
- Refresh tokens, rate limiting, `check-email`, cabeceras de seguridad (fase 2).
- Reestructurar el frontend (fase 3).
- Tests automatizados y CI (fase 4). Esta fase deja el backend *preparado* para ellos (H1.12).
- Sincronización incremental (`since`, `updatedAt`, borrado lógico de lecturas): la define la spec del issue #11.
- Estadísticas de glucosa: las define la spec del issue #19.

## 4. Historias de usuario

- **HU-1.1** Como desarrollador del frontend, quiero que todas las respuestas tengan el mismo formato, para manejar éxitos y errores con un solo código.
- **HU-1.2** Como desarrollador del backend, quiero lanzar un error tipado desde cualquier capa y que se convierta solo en la respuesta HTTP correcta.
- **HU-1.3** Como desarrollador del backend, quiero declarar el esquema de una ruta y recibir en el controlador datos ya validados y tipados.
- **HU-1.4** Como desarrollador nuevo, quiero que todos los módulos tengan la misma estructura, para crear uno nuevo copiando otro.
- **HU-1.5** Como paciente con meses de registros, quiero que mi historial cargue rápido y por partes.
- **HU-1.6** Como responsable de datos, quiero que la BD rechace valores inválidos aunque falle la validación de la API.

## 5. Requisitos funcionales

### Contrato de API

| ID | Requisito | HU |
|---|---|---|
| RF-1.1 | Toda respuesta exitosa DEBE tener la forma `{ "success": true, "data": <objeto o lista>, "meta"?: <objeto> }`. Las respuestas sin contenido útil (p. ej. borrar) DEBEN devolver `data: null`. | HU-1.1 |
| RF-1.2 | Toda respuesta de error DEBE tener la forma `{ "success": false, "error": { "code": <string>, "message": <string en español>, "fields"?: [{ "field": <string>, "message": <string> }] } }`. `fields` solo aparece en errores de validación. | HU-1.1 |
| RF-1.3 | Los `code` y su código HTTP DEBEN pertenecer a este catálogo (ampliable solo modificando esta spec o una posterior): | HU-1.1 |

| `code` | HTTP | Cuándo |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body, query o params no cumplen el esquema |
| `INVALID_CREDENTIALS` | 401 | Login con correo/contraseña incorrectos o usuario inactivo |
| `UNAUTHENTICATED` | 401 | Falta el token, formato inválido, firma inválida o usuario inexistente/inactivo |
| `TOKEN_EXPIRED` | 401 | Token con firma válida pero expirado |
| `FORBIDDEN` | 403 | Autenticado pero sin permiso sobre el recurso |
| `NOT_FOUND` | 404 | Ruta o recurso inexistente (o de otro usuario) |
| `EMAIL_IN_USE` | 409 | Registro con un correo ya existente |
| `CONFLICT` | 409 | Otra violación de unicidad |
| `INTERNAL_ERROR` | 500 | Cualquier error no previsto |

| ID | Requisito | HU |
|---|---|---|
| RF-1.4 | Un error no previsto NO DEBE exponer en la respuesta detalles internos (stack, mensaje de Prisma, SQL). DEBE registrarse completo en el log del servidor. | HU-1.2 |
| RF-1.5 | Una ruta inexistente DEBE responder 404 `NOT_FOUND` sin listar las rutas disponibles. | HU-1.1 |
| RF-1.6 | DEBE existir `GET /api/health` que responda 200 `{ success: true, data: { status: "ok" } }` sin autenticación. | HU-1.1 |

### Errores y validación

| ID | Requisito | HU |
|---|---|---|
| RF-1.7 | Cualquier capa (servicio, middleware, controlador) DEBE poder señalar un error del catálogo lanzándolo, sin construir la respuesta HTTP. | HU-1.2 |
| RF-1.8 | Las violaciones de unicidad y "registro no encontrado" de la BD DEBEN traducirse a `CONFLICT` / `NOT_FOUND` automáticamente. | HU-1.2 |
| RF-1.9 | Cada ruta que reciba datos DEBE declarar un esquema para `body`, `query` y/o `params`; el controlador DEBE recibir los datos ya convertidos (p. ej. fechas como `Date`, números como `number`). | HU-1.3 |
| RF-1.10 | Los errores de validación DEBEN devolver `VALIDATION_ERROR` con un elemento en `fields` por cada problema, usando la ruta del campo (`"value"`, `"notes"`). | HU-1.3 |

### Estructura

| ID | Requisito | HU |
|---|---|---|
| RF-1.11 | Todos los módulos DEBEN tener la misma forma de archivos (definida en el plan) y registrarse en un único punto. `auth` y `glucose` DEBEN migrarse a ella. | HU-1.4 |
| RF-1.12 | La creación de la aplicación Express DEBE estar separada del arranque del servidor, de modo que la app pueda importarse sin abrir un puerto. | HU-1.4 |
| RF-1.13 | La configuración DEBE cargarse y validarse **una sola vez**; todo el código DEBE leerla desde el objeto validado, nunca desde `process.env`. | HU-1.4 |

### Glucosa

| ID | Requisito | HU |
|---|---|---|
| RF-1.14 | `GET /api/glucose` DEBE aceptar los filtros opcionales `from` y `to` (fechas ISO, sobre `timestamp`, ambos inclusivos) y paginación `page` (≥ 1, por defecto 1) y `limit` (1–200, por defecto 50). | HU-1.5 |
| RF-1.15 | La respuesta de `GET /api/glucose` DEBE incluir `meta: { page, limit, total, totalPages }` y ordenar por `timestamp` descendente. | HU-1.5 |
| RF-1.16 | Actualizar o borrar una lectura DEBE hacerse en una sola operación de BD filtrada por `id` **y** `userId`. Una lectura de otro usuario DEBE responder `NOT_FOUND` (no `FORBIDDEN`), para no revelar que existe. | HU-1.2 |
| RF-1.17 | `PUT /api/glucose/:id` DEBE rechazar un body vacío con `VALIDATION_ERROR`. | HU-1.3 |

### Base de datos

| ID | Requisito | HU |
|---|---|---|
| RF-1.18 | `momentOfDay`, `typeOfDiabetes`, `activityLevel` e `insulinType` DEBEN ser enums de base de datos con estos valores: `MomentOfDay` = `BEFORE_BREAKFAST, AFTER_BREAKFAST, BEFORE_LUNCH, AFTER_LUNCH, BEFORE_DINNER, AFTER_DINNER, BEFORE_SLEEP, OTHER` · `DiabetesType` = `TYPE_1, TYPE_2, GESTATIONAL, PREDIABETES` · `ActivityLevel` = `SEDENTARY, LIGHT, MODERATE, ACTIVE` · `InsulinType` = `RAPID, LONG_ACTING, MIXED, NONE`. | HU-1.6 |
| RF-1.19 | La migración DEBE conservar los datos existentes: valores válidos se mantienen; `GESTACIONAL` pasa a `GESTATIONAL`; cualquier otro valor no reconocido pasa a `OTHER` (momentOfDay) o `NULL` (campos opcionales). | HU-1.6 |
| RF-1.20 | `glucose_readings` DEBE tener un índice compuesto por `(userId, timestamp)`. | HU-1.5 |

### Logs y limpieza

| ID | Requisito | HU |
|---|---|---|
| RF-1.21 | En `development` el servidor PUEDE registrar cada petición como `MÉTODO ruta → estado (ms)`, sin body, query ni cabeceras. En `production` solo DEBEN registrarse errores y advertencias. | HU-1.2 |
| RF-1.22 | Las consultas SQL de Prisma solo DEBEN registrarse si se activa explícitamente con una variable de entorno. | HU-1.2 |
| RF-1.23 | Los mensajes de arranque NO DEBEN contener IPs fijas. | HU-1.4 |
| RF-1.24 | Se DEBEN eliminar `getGlucoseStats`, `glucose/index.ts` y los `any` del código tocado. | HU-1.4 |

### Frontend (adaptación mínima)

| ID | Requisito | HU |
|---|---|---|
| RF-1.25 | La app DEBE leer los errores del nuevo formato: mensaje desde `error.message`, errores de campo desde `error.fields`, y decidir por `error.code` (no por el código HTTP) en login, registro y registro de glucosa. | HU-1.1 |
| RF-1.26 | La app DEBE enviar `typeOfDiabetes` con los nuevos valores si lo envía (`GESTATIONAL` en lugar de `GESTACIONAL`). | HU-1.6 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-1.1 | Un controlador típico NO DEBE contener `try/catch` ni construir respuestas de error a mano. |
| RNF-1.2 | Crear un módulo CRUD nuevo DEBE requerir solo archivos dentro de `src/modules/<nombre>/` más **una línea** de registro de rutas. |
| RNF-1.3 | `GET /api/glucose` con 10 000 lecturas de un usuario DEBE responder en < 200 ms en local (con el índice de RF-1.20). |
| RNF-1.4 | Sin `any` nuevo; `tsc --noEmit` sin errores. |
| RNF-1.5 | Las rutas públicas existentes (`/api/auth/*`, `/api/glucose/*`) mantienen sus URLs y métodos. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-1.1 | Cualquier endpoint | Responde con éxito | El cuerpo tiene `success: true` y `data` | RF-1.1 |
| CA-1.2 | Un registro con correo existente | `POST /api/auth/register` | 409 `{ success:false, error:{ code:"EMAIL_IN_USE", message } }` | RF-1.2, RF-1.3 |
| CA-1.3 | Un body con `value: "abc"` y sin `timestamp` | `POST /api/glucose` | 400 `VALIDATION_ERROR` con `fields` para `value` y `timestamp` | RF-1.9, RF-1.10 |
| CA-1.4 | Una petición sin cabecera `Authorization` | `GET /api/glucose` | 401 `UNAUTHENTICATED` en el formato estándar | RF-1.2, RF-1.3 |
| CA-1.5 | Un token expirado | `GET /api/glucose` | 401 `TOKEN_EXPIRED` | RF-1.3 |
| CA-1.6 | La BD apagada | Cualquier endpoint que la use | 500 `INTERNAL_ERROR` con mensaje genérico, sin texto de Prisma; el log del servidor tiene el error completo | RF-1.4 |
| CA-1.7 | `GET /api/no-existe` | Se llama | 404 `NOT_FOUND` sin lista de rutas | RF-1.5 |
| CA-1.8 | El servidor levantado | `GET /api/health` | 200 `{ success:true, data:{ status:"ok" } }` | RF-1.6 |
| CA-1.9 | Un usuario con 120 lecturas | `GET /api/glucose?limit=50&page=3` | 20 lecturas, ordenadas por `timestamp` desc, `meta = { page:3, limit:50, total:120, totalPages:3 }` | RF-1.14, RF-1.15 |
| CA-1.10 | Lecturas del 1 al 30 de un mes | `GET /api/glucose?from=<día 10>&to=<día 20>` | Solo lecturas entre esas fechas, ambas incluidas | RF-1.14 |
| CA-1.11 | `limit=500` o `page=0` | `GET /api/glucose` | 400 `VALIDATION_ERROR` | RF-1.14 |
| CA-1.12 | Una lectura del usuario A | El usuario B hace `PUT` o `DELETE` sobre su `id` | 404 `NOT_FOUND` y la lectura no cambia | RF-1.16 |
| CA-1.13 | Un body `{}` | `PUT /api/glucose/:id` | 400 `VALIDATION_ERROR` | RF-1.17 |
| CA-1.14 | Un `INSERT` directo en SQL con `momentOfDay = 'ayunas'` | Se ejecuta | La BD lo rechaza | RF-1.18 |
| CA-1.15 | Una BD con lecturas y usuarios existentes (incluido `GESTACIONAL`) | Se aplica la migración | Ninguna fila se pierde; valores convertidos según RF-1.19 | RF-1.19 |
| CA-1.16 | La BD migrada | `\d glucose_readings` en psql | Aparece el índice `(userId, timestamp)` | RF-1.20 |
| CA-1.17 | `NODE_ENV=production` | Se hacen peticiones correctas | No se imprime ninguna línea por petición ni SQL | RF-1.21, RF-1.22 |
| CA-1.18 | El código del backend | Se busca `process.env` | Solo aparece en el módulo de configuración | RF-1.13 |
| CA-1.19 | Un test (o script) que importa la app | Se importa | No se abre ningún puerto | RF-1.12 |
| CA-1.20 | La app móvil | Login con contraseña incorrecta, registro con correo repetido, glucosa con valor 700 | Muestra el mensaje del backend correcto en cada caso | RF-1.25 |

## 8. Decisiones

- **Resuelta (2026-09-19):** se acepta `GESTACIONAL` → `GESTATIONAL` (RF-1.18): todos los enums quedan en inglés, según el principio P7.
- **Resuelta (2026-09-19):** solo existen bases de datos locales de desarrollo. La migración de datos (RF-1.19) se mantiene con las conversiones `USING (CASE …)` porque cuesta lo mismo y deja la migración lista para cuando haya un entorno desplegado, pero **CA-1.15 se verifica con datos de ejemplo creados a mano**, no con un volcado real.

## 9. Definición de terminado

- CA-1.1 … CA-1.20 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con la estructura de módulo, el contrato de API y el catálogo de errores.
- Estado `Implementada` en [specs/README.md](../README.md).
