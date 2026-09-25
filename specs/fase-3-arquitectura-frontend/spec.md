# Spec F3 — Arquitectura del frontend

| Campo               | Valor                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Fase                | 3                                                                                              |
| Estado              | Borrador                                                                                       |
| Fecha               | 2026-09-19                                                                                     |
| Depende de          | Fase 2 (grupos de rutas `(auth)` / `(app)`, `AuthProvider`)                                    |
| Issues relacionados | Prepara #48 (dashboard) y todas las pantallas del backlog (#15, #20, #21, #24, #28, #31, #38…) |
| Plan / Tareas       | [plan.md](plan.md) · [tasks.md](tasks.md)                                                      |

## 1. Contexto y problema

El backlog tiene más de 20 pantallas pendientes en 8 módulos. La estructura actual del frontend no escala a ese tamaño:

| Hallazgo                                      | Evidencia                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3.1 Dos estructuras en paralelo              | `components/`, `hooks/`, `constants/`, `scripts/reset-project.js` y las imágenes `react-logo*.png`, `partial-react-logo.png` son del template de Expo; ningún archivo de `app/` ni de `src/` los importa. |
| H3.2 Pantallas dentro de los archivos de ruta | El login (~190 líneas con estilos) y el registro viven en `app/`; mover una ruta obliga a mover toda la pantalla.                                                                                         |
| H3.3 Llamadas HTTP desde la interfaz          | `add-glucose` llama a `apiClient.post` directamente; no hay capa de servicios ni tipos del contrato (`user: any`, `error: any`).                                                                          |
| H3.4 Alertas duplicadas                       | El interceptor de `apiClient` muestra un `Alert` en errores de red y 500, y la pantalla muestra otro para el mismo error.                                                                                 |
| H3.5 Organización por tipo de archivo         | `src/components`, `src/hooks`, `src/utils`: con 8 módulos, cada carpeta mezclaría código de todos.                                                                                                        |
| H3.6 URL de la API fija                       | `config.ts` elige entre `localhost` y la IP `192.168.1.9` según la plataforma; cada desarrollador debe editar el código.                                                                                  |
| H3.7 Errores solo con `Alert`                 | Los formularios muestran el primer error en un `Alert`; la prop `error` de `Input` no se usa en ninguna pantalla.                                                                                         |
| H3.8 Iconos con emojis                        | `Icon.tsx` simula iconos con emojis; `react-native-vector-icons` está instalado sin usarse y `@expo/vector-icons` también.                                                                                |
| H3.9 `tsc` falla                              | `Button.tsx` tiene errores de tipos en los arrays de estilos (TS2345).                                                                                                                                    |
| H3.10 Nombre técnico en el dispositivo        | `app.json` usa `"name": "diabetapp-frontend"` y `"scheme": "diabetappfrontend"`.                                                                                                                          |

## 2. Objetivo

Que cada funcionalidad del frontend viva en **una carpeta autocontenida con la misma forma**, que hable con la API **solo a través de servicios tipados**, y que los formularios **muestren los errores junto a cada campo**, de modo que las pantallas del backlog se construyan copiando un patrón.

## 3. Alcance

**Incluye:** H3.1 a H3.10.

**No incluye:**

- Nuevas pantallas o funcionalidades (dashboard, historial…): cada una tendrá su spec.
- Caché de datos del servidor / librería de _server state_: se decidirá en la spec del dashboard (#48), que es la primera pantalla que la necesita (principio P8).
- Almacenamiento offline (#11).
- Rediseño visual: los componentes mantienen su aspecto.

## 4. Historias de usuario

- **HU-3.1** Como desarrollador, quiero encontrar todo lo de una funcionalidad (pantallas, llamadas a la API, validaciones, tipos) en una sola carpeta.
- **HU-3.2** Como desarrollador, quiero llamar a la API con funciones tipadas que ya devuelven los datos del contrato, sin conocer URLs ni el formato de respuesta.
- **HU-3.3** Como paciente, quiero ver debajo de cada campo qué está mal, todos a la vez, en lugar de una alerta por error.
- **HU-3.4** Como paciente, quiero ver un solo mensaje cuando algo falla.
- **HU-3.5** Como desarrollador, quiero configurar la URL de la API sin tocar el código.
- **HU-3.6** Como paciente, quiero iconos claros y ver "DiabetApp" como nombre de la app.

## 5. Requisitos funcionales

### Estructura

| ID     | Requisito                                                                                                                                                                                                                                                                                  | HU     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| RF-3.1 | El código de la app DEBE organizarse en **funcionalidades** (`auth`, `glucose`, `home`) y una zona **compartida** (cliente HTTP, componentes de UI, configuración, tema, utilidades). Una funcionalidad NO DEBE importar archivos internos de otra; solo lo que esta exporte públicamente. | HU-3.1 |
| RF-3.2 | Todas las funcionalidades DEBEN tener la misma forma de carpeta (definida en el plan).                                                                                                                                                                                                     | HU-3.1 |
| RF-3.3 | Los archivos de `app/` DEBEN limitarse a declarar la ruta (layout, opciones de navegación) y reexportar la pantalla; NO DEBEN contener lógica ni estilos.                                                                                                                                  | HU-3.1 |
| RF-3.4 | Se DEBEN eliminar las carpetas y archivos del template de Expo que no se usan (H3.1) y la dependencia `react-native-vector-icons`.                                                                                                                                                         | HU-3.1 |
| RF-3.5 | Los imports entre carpetas DEBEN usar el alias `@/` en lugar de rutas relativas con `../../`.                                                                                                                                                                                              | HU-3.1 |

### Acceso a la API

| ID     | Requisito                                                                                                                                                                                                                                                    | HU     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| RF-3.6 | Cada llamada a la API DEBE hacerse mediante una función de servicio de su funcionalidad (p. ej. `glucoseApi.create(input)`), que devuelva directamente el `data` tipado del contrato de la fase 1. Las pantallas y hooks NO DEBEN importar el cliente HTTP.  | HU-3.2 |
| RF-3.7 | Los tipos del contrato (`User`, `GlucoseReading`, `MomentOfDay`, respuestas de éxito y error) DEBEN estar declarados una vez y coincidir con el backend.                                                                                                     | HU-3.2 |
| RF-3.8 | Todo error de una llamada DEBE convertirse en un único tipo de error de la app con `code`, `message` y `fields` opcionales. Un fallo de red o timeout DEBE tener `code = NETWORK_ERROR` y mensaje "No se pudo conectar con el servidor. Revisa tu conexión." | HU-3.4 |
| RF-3.9 | El cliente HTTP NO DEBE mostrar alertas. Cada error se muestra **una sola vez**, en la pantalla que hizo la petición (salvo la sesión expirada, que gestiona el `AuthProvider` según la fase 2).                                                             | HU-3.4 |

### Formularios

| ID      | Requisito                                                                                                                                                                                                                                | HU     |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| RF-3.10 | Los formularios de login, registro y registro de glucosa DEBEN mostrar los errores de validación **debajo de cada campo**, todos a la vez, al pulsar el botón de enviar; y actualizar el error de un campo cuando el usuario lo corrige. | HU-3.3 |
| RF-3.11 | Las reglas de validación de cada formulario DEBEN declararse como un esquema (igual que en el backend) en la carpeta de su funcionalidad.                                                                                                | HU-3.3 |
| RF-3.12 | Si el backend responde `VALIDATION_ERROR` con `fields`, cada mensaje DEBE mostrarse bajo su campo. Los errores sin campo asociado DEBEN mostrarse en un único mensaje del formulario.                                                    | HU-3.3 |
| RF-3.13 | El botón de enviar DEBE deshabilitarse mientras la petición está en curso.                                                                                                                                                               | HU-3.4 |

### Configuración y apariencia

| ID      | Requisito                                                                                                                                                                      | HU     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| RF-3.14 | La URL base de la API DEBE leerse de la variable de entorno `EXPO_PUBLIC_API_URL`. Si no está definida, la app DEBE fallar al arrancar con un mensaje que diga cómo definirla. | HU-3.5 |
| RF-3.15 | DEBE existir un `diabetapp-frontend/.env.example` con `EXPO_PUBLIC_API_URL` de ejemplo; el `.env` real no se versiona.                                                         | HU-3.5 |
| RF-3.16 | `Icon` DEBE usar una librería de iconos vectoriales y aceptar solo nombres de un conjunto definido (un nombre inexistente es un error de tipos).                               | HU-3.6 |
| RF-3.17 | La app DEBE mostrarse como "DiabetApp" en el dispositivo, con esquema de enlaces `diabetapp`.                                                                                  | HU-3.6 |
| RF-3.18 | `tsc --noEmit` DEBE pasar sin errores y `npm run lint` sin errores ni advertencias.                                                                                            | HU-3.1 |

## 6. Requisitos no funcionales

| ID      | Requisito                                                                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-3.1 | Crear una funcionalidad nueva con una pantalla y un servicio DEBE requerir solo una carpeta en `src/features/` y un archivo de ruta en `app/`. |
| RNF-3.2 | El comportamiento y el aspecto de las pantallas existentes NO DEBEN cambiar, salvo los errores por campo (RF-3.10) y los iconos (RF-3.16).     |
| RNF-3.3 | Sin `any` en `src/` ni en `app/`.                                                                                                              |

## 7. Criterios de aceptación

| ID      | Dado                                                                                                    | Cuando                                             | Entonces                                                                                                                                        | RF               |
| ------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| CA-3.1  | El repositorio                                                                                          | Se listan `diabetapp-frontend/` y `src/`           | No existen `components/`, `hooks/`, `constants/`, `scripts/` de la raíz ni las imágenes del template; `src/` tiene solo `features/` y `shared/` | RF-3.1, RF-3.4   |
| CA-3.2  | Cualquier archivo de `app/`                                                                             | Se revisa                                          | Solo contiene layout/opciones y un `export { default } from '@/src/features/…'`; ningún `StyleSheet`                                            | RF-3.3           |
| CA-3.3  | El código de `src/features/*/screens` y `hooks`                                                         | Se busca `apiClient` o `axios`                     | No aparece                                                                                                                                      | RF-3.6           |
| CA-3.4  | Un archivo de `src/features/glucose`                                                                    | Se busca un import a `src/features/auth/…` interno | No existe (solo imports a lo exportado por `index.ts`)                                                                                          | RF-3.1           |
| CA-3.5  | El formulario de registro vacío                                                                         | Se pulsa "Crear cuenta"                            | Aparecen a la vez los errores de nombre, apellido, correo, fecha y contraseña, cada uno bajo su campo; ningún `Alert`                           | RF-3.10          |
| CA-3.6  | El error del correo visible                                                                             | El usuario escribe un correo válido                | El error de ese campo desaparece                                                                                                                | RF-3.10          |
| CA-3.7  | Un registro con correo repetido                                                                         | Se envía                                           | Se ve un único mensaje de error del formulario (`EMAIL_IN_USE`)                                                                                 | RF-3.9, RF-3.12  |
| CA-3.8  | Glucosa con valor 700 que salta la validación local (p. ej. modificando temporalmente el esquema local) | Se envía                                           | El mensaje del backend aparece bajo el campo "valor"                                                                                            | RF-3.12          |
| CA-3.9  | Backend apagado                                                                                         | Se intenta iniciar sesión                          | Aparece **un** mensaje "No se pudo conectar con el servidor…"                                                                                   | RF-3.8, RF-3.9   |
| CA-3.10 | Una petición en curso                                                                                   | Se pulsa de nuevo el botón                         | No se envía otra petición                                                                                                                       | RF-3.13          |
| CA-3.11 | Sin `EXPO_PUBLIC_API_URL`                                                                               | Se arranca la app                                  | Error claro indicando cómo definirla en `.env`                                                                                                  | RF-3.14          |
| CA-3.12 | `EXPO_PUBLIC_API_URL=http://<ip>:3000/api` en `.env`                                                    | Se arranca la app en Android e iOS                 | Ambas usan esa URL sin cambios de código                                                                                                        | RF-3.14, RF-3.15 |
| CA-3.13 | Todas las pantallas                                                                                     | Se recorren                                        | Iconos vectoriales en lugar de emojis; `package.json` sin `react-native-vector-icons`                                                           | RF-3.4, RF-3.16  |
| CA-3.14 | `<Icon name="no-existe" />` en el código                                                                | Se ejecuta `tsc`                                   | Error de tipos                                                                                                                                  | RF-3.16          |
| CA-3.15 | La app instalada                                                                                        | Se ve en el lanzador del dispositivo               | Nombre "DiabetApp"                                                                                                                              | RF-3.17          |
| CA-3.16 | El proyecto                                                                                             | `npx tsc --noEmit` y `npm run lint`                | 0 errores y 0 advertencias                                                                                                                      | RF-3.18, RNF-3.3 |

## 8. Decisiones

- **Resuelta (2026-09-19):** se aprueba añadir `react-hook-form`, `@hookform/resolvers` y `zod` a la app: los formularios validan con las mismas reglas que el backend y muestran los errores por campo sin código a mano.
- **Decisión tomada:** no se añade caché de datos del servidor en esta fase (ver alcance).

## 9. Definición de terminado

- CA-3.1 … CA-3.16 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con la estructura por funcionalidades, la regla de servicios y la política de errores.
- Estado `Implementada` en [specs/README.md](../README.md).
