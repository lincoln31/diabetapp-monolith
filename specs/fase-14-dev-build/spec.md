# Spec F14 — Development build para probar notificaciones

| Campo | Valor |
|---|---|
| Fase | 14 |
| Estado | Aprobada |
| Fecha | 2026-09-26 |
| Depende de | Fase 13 (notificaciones locales, bloqueadas en Expo Go) |
| Issues relacionados | Ninguno (desbloquea la verificación de #16, #35, #52, #53, #54) |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H14.1 Expo Go no puede cargar `expo-notifications` | Resultado negativo de T13.2 (fase 13): en Android, desde el SDK 53, importar el módulo lanza un error no capturado. Los avisos de la fase 13 no pueden probarse ni usarse con Expo Go. |
| H14.2 Toda la verificación en dispositivo depende de Expo Go | `make up` levanta Metro y abre la app dentro de Expo Go (`scripts/dev.sh`, `cmd_app`). |
| H14.3 Este PC ya tiene casi todo para compilar | Android SDK (`platform-tools`, `build-tools`, `platforms`), Android Studio (con su JDK propio, `jbr`) y licencias aceptadas. Faltan NDK y CMake (Gradle puede descargarlos) y no hay `JAVA_HOME`/`ANDROID_HOME` definidos. |
| H14.4 La ruta del repo es larga | Las compilaciones nativas de React Native en Windows fallan con rutas de más de ~250 caracteres (CMake/Ninja); `C:\Users\PC\Desktop\Programacion\app_moviles\diabetapp-monolith\diabetapp-frontend\…` ya consume buena parte. |

## 2. Objetivo

Poder compilar e instalar en el celular una **development build** de DiabetApp (la app propia con `expo-dev-client`) y usarla en lugar de Expo Go cuando haga falta código nativo, de modo que las notificaciones de la fase 13 se puedan verificar y usar, sin romper el flujo actual con Expo Go.

## 3. Alcance

**Incluye:** identificador de paquete Android, `expo-dev-client`, generación del proyecto nativo con `expo prebuild` (no se versiona), compilación local con `expo run:android`, comandos `make build` y `make up` en modo *dev client* en `scripts/dev.sh`, comprobaciones nuevas en `make doctor`, y la verificación en dispositivo de la fase 13 (CA-13.10 – CA-13.15).

**No incluye:**
- Builds de release, firma, Play Store o EAS Build (nube).
- iOS.
- Versionar las carpetas `android/` e `ios/` (se regeneran; ver §8).
- Cambios en la CI (no compila código nativo).
- Quitar Expo Go: sigue siendo el modo por defecto para todo lo que no necesite código nativo.

## 4. Historias de usuario

- **HU-14.1** Como desarrollador, quiero instalar en mi celular una build de desarrollo con un solo comando, para probar código nativo como las notificaciones.
- **HU-14.2** Como desarrollador, quiero seguir usando Expo Go con `make up` como hasta ahora, para no pagar el tiempo de compilación en el trabajo diario.
- **HU-14.3** Como desarrollador, quiero que `make doctor` me diga qué falta para compilar (JDK, SDK, build instalada), para no depurar a ciegas.

## 5. Requisitos funcionales

| ID | Requisito | HU |
|---|---|---|
| RF-14.1 | `app.json` DEBE declarar `android.package` (`com.diabetapp.app`) y el plugin `expo-notifications`; el proyecto DEBE incluir `expo-dev-client`. | HU-14.1 |
| RF-14.2 | `make build` DEBE compilar e instalar la development build en el celular conectado, configurando por sí mismo `JAVA_HOME` (JDK de Android Studio) y `ANDROID_HOME` si no están definidos. | HU-14.1 |
| RF-14.3 | `make up DEV_CLIENT=1` DEBE levantar la BD, el backend y Metro en modo *dev client* y abrir la build instalada apuntando a Metro por la red local, con la misma `EXPO_PUBLIC_API_URL` que el modo Expo Go. | HU-14.1 |
| RF-14.4 | `make up` sin `DEV_CLIENT` DEBE comportarse exactamente como hoy (Expo Go). | HU-14.2 |
| RF-14.5 | Las carpetas `android/` e `ios/` DEBEN quedar ignoradas por git. | HU-14.1 |
| RF-14.6 | `make doctor` DEBE informar si hay JDK, si hay Android SDK con NDK, y si la development build (`com.diabetapp.app`) está instalada en el celular; sin fallar si el modo *dev client* no se usa. | HU-14.3 |
| RF-14.7 | En la development build, `expo-notifications` DEBE cargarse (sin error) y las notificaciones locales DEBEN programarse y mostrarse. | HU-14.1 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-14.1 | No se toca la CI ni se versionan artefactos nativos (`android/`, APK, `.gradle`). |
| RNF-14.2 | Toda la lógica nueva vive en `scripts/dev.sh` (el Makefile solo enruta), con la misma convención de mensajes y `die`/`ok`/`warn` que el resto. |
| RNF-14.3 | Los comandos son idempotentes: repetir `make build` reutiliza la caché de Gradle; regenerar con `prebuild` no pierde configuración (todo sale de `app.json` y los plugins). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-14.1 | Un PC con Android Studio y el celular autorizado | Se ejecuta `make build` | La app «DiabetApp» (paquete `com.diabetapp.app`) queda instalada en el celular | RF-14.2 |
| CA-14.2 | La build instalada | Se ejecuta `make up DEV_CLIENT=1` | La app abre, carga el bundle de Metro por la red local y llega al backend | RF-14.3 |
| CA-14.3 | El modo por defecto | Se ejecuta `make up` | Abre en Expo Go como antes | RF-14.4 |
| CA-14.4 | Se genera `android/` | Se revisa `git status` | Las carpetas nativas no aparecen como cambios | RF-14.5 |
| CA-14.5 | Falta el JDK o la build | Se ejecuta `make doctor` | Se informa con un aviso claro y el resto de comprobaciones sigue igual | RF-14.6 |
| CA-14.6 | La development build | Se abre «Notificaciones» y se activa un aviso | Se pide el permiso del sistema y no hay pantalla roja | RF-14.7 |
| CA-14.7 | Un medicamento con un horario 2 minutos en el futuro y avisos de medicación activos | Se abre el dashboard y se espera | Llega la notificación con el nombre y la dosis (= CA-13.10) | RF-14.7 |

## 8. Decisiones (aprobadas con la recomendación de la fase 13)

- **Resuelta (2026-09-26):** development build **local** (`expo run:android`) en vez de EAS Build en la nube: no requiere cuenta ni cola, y este PC ya tiene el SDK.
- **Resuelta (2026-09-26):** el código nativo se **genera** (`expo prebuild`) y **no se versiona**: la fuente de verdad sigue siendo `app.json` y los plugins de Expo, sin carpetas nativas que mantener a mano.
- **Resuelta (2026-09-26):** Expo Go sigue siendo el modo por defecto; el modo *dev client* es opt-in (`DEV_CLIENT=1`), porque solo hace falta para código nativo.
- **Resuelta (2026-09-26):** identificador de paquete `com.diabetapp.app` (el esquema `diabetapp` ya existe en `app.json`).
- **Riesgo aceptado:** si la ruta larga rompe la compilación, se compila desde una unidad corta creada con `subst` (p. ej. `X:`); se documenta en `CLAUDE.md` si hace falta.

## 9. Definición de terminado

- CA-14.1 … CA-14.7 verificados en el celular; además CA-13.10 – CA-13.15 de la fase 13.
- `CLAUDE.md` actualizado con `make build`, `DEV_CLIENT=1` y las particularidades encontradas.
- Fase 13 marcada como `Implementada` en [specs/README.md](../README.md); #51 cerrado con su comentario.
