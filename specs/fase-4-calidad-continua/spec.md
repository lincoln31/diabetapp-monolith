# Spec F4 — Calidad continua

| Campo | Valor |
|---|---|
| Fase | 4 |
| Estado | Borrador |
| Fecha | 2026-09-19 |
| Depende de | Backend: fase 1 (app separada del servidor). Frontend: fase 3 (estructura final). Los tests de sesión, de la fase 2. |
| Issues relacionados | #56 "Test: pruebas unitarias del módulo de autenticación" · #57 "CI: pipeline con GitHub Actions" |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H4.1 Sin tests | `npm test` del backend solo imprime "no test specified" y falla; el frontend no tiene script de test. |
| H4.2 Sin linter en el backend | Solo el frontend tiene ESLint (`eslint-config-expo`). |
| H4.3 Sin CI | Los PR se fusionan sin ninguna comprobación automática; `tsc` del frontend lleva tiempo fallando sin que nadie lo note. |
| H4.4 Formato inconsistente | Sangrías mezcladas (p. ej. `auth.service.ts` con 4 y 6 espacios), comillas y saltos de línea distintos entre archivos. |
| H4.5 Versión de Node no fijada | No hay `.nvmrc` ni `engines`; cada desarrollador usa la suya. |
| H4.6 Migraciones sin control | Nada impide cambiar `schema.prisma` sin crear la migración correspondiente. |
| H4.7 PR sin vínculo con las specs | No hay plantilla de PR; el proceso SDD (specs/README.md, regla 5) no se puede comprobar. |

## 2. Objetivo

Que **ningún cambio llegue a `Develop` ni a `main` sin pasar automáticamente lint, tipos, formato, migraciones y tests**, y que la lógica crítica (autenticación, sesión y glucosa) esté cubierta por pruebas.

## 3. Alcance

**Incluye:** H4.1 a H4.7, cerrando los issues #56 y #57.

**No incluye:**
- Tests end-to-end en dispositivo (Detox / Maestro).
- Despliegue automático (CD) y builds de la app con EAS.
- Hooks locales de pre-commit (husky / lint-staged): se puede proponer en una spec posterior.

## 4. Historias de usuario

- **HU-4.1** Como desarrollador, quiero ejecutar un solo comando para saber si mis cambios rompen algo.
- **HU-4.2** Como revisor de un PR, quiero ver en verde o rojo si el código cumple lint, tipos y tests, sin descargarlo.
- **HU-4.3** Como responsable del proyecto, quiero que GitHub impida fusionar un PR con comprobaciones en rojo.
- **HU-4.4** Como desarrollador, quiero que el formato del código sea automático para no discutirlo en las revisiones.

## 5. Requisitos funcionales

### Tests del backend

| ID | Requisito | HU |
|---|---|---|
| RF-4.1 | El backend DEBE tener tests de integración que llamen a la API HTTP real (sin abrir puerto) contra una base PostgreSQL de pruebas separada de la de desarrollo. | HU-4.1 |
| RF-4.2 | Cada test DEBE empezar con la base de datos vacía; los tests NO DEBEN depender del orden de ejecución. | HU-4.1 |
| RF-4.3 | Como mínimo DEBEN cubrirse estos casos: | HU-4.1 |

| Área | Casos |
|---|---|
| Registro | éxito (201 + tokens), correo repetido (`EMAIL_IN_USE`), validación (contraseña débil, teléfono, fecha), correo normalizado a minúsculas |
| Login | éxito, contraseña incorrecta, correo inexistente, usuario inactivo (misma respuesta en los tres), `lastLoginAt` actualizado |
| Sesión | `refresh` rota tokens, reutilización revoca la familia, token expirado, `logout` idempotente, `/me` con y sin token, `TOKEN_EXPIRED` con acceso caducado |
| Límites | login bloqueado tras 5 fallos (429) |
| Glucosa | crear, validación (`value`, `momentOfDay`, `timestamp`), listar con paginación y filtros de fecha, leer/actualizar/borrar lectura de otro usuario → 404, actualizar con body vacío → 400 |
| Plataforma | `/api/health`, ruta inexistente → 404, JSON mal formado → 400, body > 100 KB → 413 |

| ID | Requisito | HU |
|---|---|---|
| RF-4.4 | La cobertura de líneas de `src/modules` y `src/shared` DEBE ser ≥ 80 %; por debajo, el comando de tests DEBE fallar. | HU-4.2 |

### Tests del frontend

| ID | Requisito | HU |
|---|---|---|
| RF-4.5 | El frontend DEBE tener tests de: esquemas de validación (login, registro, glucosa), utilidades de fechas, conversión de errores (`toApiError`), renovación única de tokens en el cliente HTTP (varias peticiones → una renovación), componente `Input` mostrando `error`, y el formulario de registro mostrando errores por campo. | HU-4.1 |

### Linters, formato y tipos

| ID | Requisito | HU |
|---|---|---|
| RF-4.6 | El backend DEBE tener ESLint para TypeScript con `no-explicit-any` como error y detección de promesas no esperadas. | HU-4.2 |
| RF-4.7 | Ambos proyectos DEBEN usar el mismo formateador con la misma configuración, y la CI DEBE fallar si algún archivo no está formateado. | HU-4.4 |
| RF-4.8 | Ambos proyectos DEBEN exponer los mismos scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. | HU-4.1 |
| RF-4.9 | La versión de Node DEBE fijarse en el repositorio y la CI DEBE usar la misma. | HU-4.1 |

### Migraciones

| ID | Requisito | HU |
|---|---|---|
| RF-4.10 | La CI DEBE fallar si `schema.prisma` no coincide con el resultado de aplicar las migraciones (cambio de esquema sin migración). | HU-4.2 |
| RF-4.11 | La CI DEBE aplicar todas las migraciones sobre una base vacía sin errores. | HU-4.2 |

### Integración continua

| ID | Requisito | HU |
|---|---|---|
| RF-4.12 | Un workflow de GitHub Actions DEBE ejecutarse en cada PR hacia `Develop` o `main` y en cada push a esas ramas, con dos trabajos independientes (`backend`, `frontend`) que ejecuten formato, lint, tipos y tests (y migraciones en el backend). | HU-4.2 |
| RF-4.13 | `Develop` y `main` DEBEN estar protegidas: sin push directo, fusión solo por PR y con los trabajos `backend` y `frontend` en verde. | HU-4.3 |
| RF-4.14 | Si un PR recibe un commit nuevo, la ejecución anterior de la CI para ese PR DEBE cancelarse. | HU-4.2 |
| RF-4.15 | El repositorio DEBE tener una plantilla de PR que pida: spec y tareas implementadas, criterios de aceptación verificados y cómo se probó. | HU-4.2 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-4.1 | La CI completa DEBE tardar < 10 min (los dos trabajos en paralelo). |
| RNF-4.2 | La CI NO DEBE necesitar secretos reales: usa valores de prueba generados en el propio workflow. |
| RNF-4.3 | Los tests del backend DEBEN poder ejecutarse en local con `docker compose up -d` + `npm test`. |
| RNF-4.4 | Aplicar el formateador por primera vez DEBE hacerse en un commit **solo de formato**, separado del resto, para no ensuciar el historial de `git blame`. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-4.1 | La BD de pruebas levantada | `npm test` en el backend | Todos los casos de RF-4.3 pasan y se imprime la cobertura ≥ 80 % | RF-4.1, RF-4.3, RF-4.4 |
| CA-4.2 | Se ejecuta un test aislado (`npm test -- -t "login inactivo"`) | Se lanza solo | Pasa igual que en la suite completa | RF-4.2 |
| CA-4.3 | Se borra un test de glucosa y la cobertura cae < 80 % | `npm test` | Falla indicando el umbral | RF-4.4 |
| CA-4.4 | — | `npm test` en el frontend | Pasan los tests de RF-4.5 | RF-4.5 |
| CA-4.5 | Un archivo del backend con `const x: any = 1` | `npm run lint` | Error `no-explicit-any` | RF-4.6 |
| CA-4.6 | Un archivo con formato incorrecto | `npm run format:check` | Falla y lista el archivo | RF-4.7 |
| CA-4.7 | Ambos `package.json` | Se revisan | Tienen `lint`, `typecheck`, `test`, `format`, `format:check` | RF-4.8 |
| CA-4.8 | Un campo nuevo en `schema.prisma` sin migración | Se abre un PR | El trabajo `backend` falla en el paso de migraciones | RF-4.10 |
| CA-4.9 | Un PR con un test roto | Se abre hacia `Develop` | La CI queda en rojo y el botón de fusionar está bloqueado | RF-4.12, RF-4.13 |
| CA-4.10 | Un PR con todo correcto | Se abre | Los dos trabajos quedan en verde en < 10 min | RF-4.12, RNF-4.1 |
| CA-4.11 | Un push directo a `Develop` | Se intenta | GitHub lo rechaza | RF-4.13 |
| CA-4.12 | Dos pushes seguidos al mismo PR | Se hacen | La primera ejecución aparece como cancelada | RF-4.14 |
| CA-4.13 | Un PR nuevo | Se abre | La descripción viene prellenada con la plantilla | RF-4.15 |

## 8. Decisiones pendientes

- **[NECESITA ACLARACIÓN]** Protección de ramas (RF-4.13): ¿se exige además **1 aprobación** de otra persona antes de fusionar? Depende de cuántas personas trabajan en el proyecto; con una sola persona, la aprobación bloquearía todo.
- **[NECESITA ACLARACIÓN]** ¿Quién tiene permisos de administración en el repositorio para configurar la protección de ramas? (Es un paso manual en GitHub.)
- **Decisión tomada:** el issue #56 pide "Jest o Vitest": se usa **Jest** en ambos proyectos, porque la app de Expo solo tiene soporte oficial con `jest-expo` y así hay una sola herramienta.

## 9. Definición de terminado

- CA-4.1 … CA-4.13 verificados; los issues #56 y #57 cerrados desde el PR.
- `CLAUDE.md` actualizado con los comandos de test, cómo ejecutar un test aislado y cómo levantar la BD de pruebas.
- Estado `Implementada` en [specs/README.md](../README.md).
