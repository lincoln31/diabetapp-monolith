# Spec F0 — Correcciones urgentes

| Campo | Valor |
|---|---|
| Fase | 0 |
| Estado | Borrador |
| Fecha | 2026-09-19 |
| Depende de | PR #74 fusionado en `Develop` |
| Issues relacionados | — |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

La revisión de arquitectura del 2026-09-19 encontró problemas que no pueden esperar a la refactorización:

| Hallazgo | Evidencia | Impacto |
|---|---|---|
| H0.1 Secreto filtrado | El commit `d35411e` publicó `diabetapp-backend/.env_prueba` con un `JWT_SECRET` real. Se borró en `d3ebbff`, pero el repositorio es **público** y el historial lo conserva. | Quien tenga el secreto puede firmar tokens válidos y leer o modificar los datos de salud de cualquier usuario en un entorno que lo use. |
| H0.2 `.gitignore` incompleto | `git check-ignore` confirma que `.env_prueba` (o cualquier `.env_algo`) **no** está ignorado: el patrón raíz `.env.*` solo cubre `.env.<algo>` con punto. | El mismo error puede repetirse. |
| H0.3 `Input` se cae al mostrar un error | `diabetapp-frontend/src/components/ui/Input.tsx` usa `<Text>` sin importarlo (`tsc` lo reporta como TS2786). | La app se cierra en cuanto una pantalla pase la prop `error`. |
| H0.4 Usuarios desactivados pueden iniciar sesión | `AuthService.loginUser` no comprueba `isActive`; `verifyToken` sí. | El borrado lógico (soft delete) no impide el acceso. |
| H0.5 Error de variables de entorno ilegible | `src/config/env.ts` imprime `undefined: Invalid input…` porque usa la API interna `_zod.def` y el campo inexistente `err.key`. | Quien arranca el backend no sabe qué variable falta. |
| H0.6 Código y archivos muertos | `src/types/index.d.ts` (importa un `../../models/User` inexistente; oculto por `skipLibCheck`), `diabetapp-backend/migration.sql` (script suelto que borra una tabla `Post`), `package.json`/`package-lock.json` de la raíz (restos), `diabetapp-frontend/src/app.tsx` y `src/screens/LoginScreen.tsx` (no enrutados), import sin uso `import { string } from 'zod'` en `auth.service.ts`. | Confunden a quien lee el código y esconden errores de tipos. |

## 2. Objetivo

Eliminar los riesgos de seguridad inmediatos y los fallos que rompen la app, sin cambiar la arquitectura (eso es la fase 1 en adelante).

## 3. Alcance

**Incluye:** H0.1 a H0.6.

**No incluye:**
- Reescribir el historial de Git para borrar el secreto (ver decisión D-0.1 en el plan).
- Borrar las carpetas del template de Expo (`components/`, `hooks/`, `constants/` de la raíz del frontend): se hace en la fase 3 junto con la reestructuración.
- Cambiar el formato de respuestas o el manejo de errores (fase 1).

## 4. Historias de usuario

- **HU-0.1** Como responsable del proyecto, quiero que el secreto publicado deje de ser válido, para que nadie pueda falsificar sesiones.
- **HU-0.2** Como desarrollador, quiero que Git ignore cualquier archivo de variables de entorno, para no volver a publicar secretos por error.
- **HU-0.3** Como paciente, quiero ver bajo cada campo por qué un dato es inválido sin que la app se cierre.
- **HU-0.4** Como administrador, quiero que un usuario desactivado no pueda entrar, para que el borrado lógico tenga efecto.
- **HU-0.5** Como desarrollador, quiero que el backend me diga exactamente qué variable de entorno falta o es inválida.
- **HU-0.6** Como desarrollador, quiero un repositorio sin archivos muertos, para entender el proyecto sin pistas falsas.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-0.1 | Todo entorno (desarrollo compartido, staging, producción) que haya usado el `JWT_SECRET` publicado en `d35411e` DEBE pasar a usar un secreto nuevo, generado aleatoriamente y de al menos 32 bytes. | HU-0.1 |
| RF-0.2 | Git DEBE ignorar cualquier archivo cuyo nombre empiece por `.env` en cualquier carpeta del repositorio, excepto los archivos de ejemplo (`env.example`, `.env.example`). | HU-0.2 |
| RF-0.3 | El componente `Input` DEBE mostrar el texto de la prop `error` debajo del campo sin provocar un error en tiempo de ejecución. | HU-0.3 |
| RF-0.4 | El login DEBE rechazar a un usuario con `isActive = false` con **la misma respuesta** (código HTTP, `code` y mensaje) que unas credenciales incorrectas. | HU-0.4 |
| RF-0.5 | Si una variable de entorno falta o es inválida al arrancar, el backend DEBE listar cada variable afectada **por su nombre** junto al motivo, y terminar con código de salida distinto de 0. | HU-0.5 |
| RF-0.6 | Se DEBEN eliminar: `diabetapp-backend/src/types/index.d.ts`, `diabetapp-backend/migration.sql`, `package.json` y `package-lock.json` de la raíz, `diabetapp-frontend/src/app.tsx`, `diabetapp-frontend/src/screens/LoginScreen.tsx` y los imports sin uso de los archivos tocados. | HU-0.6 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-0.1 | Ningún cambio de esta fase DEBE alterar el comportamiento visible de la app, salvo RF-0.3 y RF-0.4. |
| RNF-0.2 | Tras la fase, ningún archivo de declaraciones propio (`src/types/*.d.ts`) DEBE importar módulos inexistentes. (`skipLibCheck` omite la comprobación de los `.d.ts`, incluidos los propios, por eso el error no aparecía en `tsc`.) |
| RNF-0.3 | El valor del secreto filtrado NO DEBE aparecer en ningún documento, issue, commit ni PR nuevo. |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-0.1 | Un token firmado con el secreto publicado | Se usa contra cualquier entorno desplegado | La API responde 401 | RF-0.1 |
| CA-0.2 | Archivos `diabetapp-backend/.env_prueba`, `diabetapp-frontend/.env.local` y `.env` en la raíz | Se ejecuta `git check-ignore -v <archivo>` | Los tres aparecen como ignorados y `diabetapp-backend/env.example` **no** | RF-0.2 |
| CA-0.3 | Una pantalla que renderiza `<Input error="Campo obligatorio" />` | Se abre la pantalla | Se ve el texto en rojo bajo el campo y la app no se cierra | RF-0.3 |
| CA-0.4 | Un usuario con `isActive = false` y su contraseña correcta | Hace `POST /api/auth/login` | Recibe exactamente la misma respuesta que con una contraseña incorrecta (401, `INVALID_CREDENTIALS`) | RF-0.4 |
| CA-0.5 | Un usuario activo con contraseña correcta | Hace login | Sigue funcionando como antes (200 + token) | RF-0.4 |
| CA-0.6 | Arranque del backend sin `JWT_SECRET` y con `DATABASE_URL` vacía | Se ejecuta `npm run dev` | La consola muestra `JWT_SECRET: …` y `DATABASE_URL: …` con su motivo, y el proceso termina con código ≠ 0 | RF-0.5 |
| CA-0.7 | El repositorio tras la fase | Se buscan los archivos de RF-0.6 | No existen, y `tsc --noEmit` pasa en backend; en frontend no aparecen errores nuevos | RF-0.6 |

## 8. Decisiones

- **Resuelta (2026-09-19):** el secreto filtrado se usó **en local y en los servidores**. RF-0.1 se aplica en ambos: cada desarrollador cambia el `JWT_SECRET` de su `.env` y se cambia también la variable en cada servidor desplegado, reiniciando el servicio.

## 9. Definición de terminado

- Todos los CA verificados y marcados en el PR.
- PR a `Develop` con referencia a esta spec.
- Estado de la spec actualizado a `Implementada` en [specs/README.md](../README.md).
