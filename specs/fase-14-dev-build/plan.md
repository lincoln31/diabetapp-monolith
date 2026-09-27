# Plan técnico F14 — Development build

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 0. Punto de partida: una compilación de prueba primero

Igual que en la fase 13, lo incierto se prueba antes de escribir scripts: instalar `expo-dev-client`, fijar `android.package`, generar `android/` con `npx expo prebuild` y compilar con el JDK de Android Studio (T14.2). Si Gradle falla (NDK, licencias, ruta larga), se resuelve **antes** de automatizar. Los scripts se escriben una vez que se sabe qué pasos hacen falta de verdad.

## 1. Decisiones

### D-14.1 Configuración de Expo

- `npx expo install expo-dev-client`.
- `app.json`: `"android": { "package": "com.diabetapp.app", … }` y el plugin `"expo-notifications"` en `plugins` (sin icono/color propios en esta fase; se pueden añadir después).
- `expo-dev-client` no rompe Expo Go: en Expo Go simplemente no se usa. `npx expo-doctor` debe seguir limpio.

### D-14.2 Carpetas nativas fuera de git

`diabetapp-frontend/.gitignore` añade `/android` y `/ios`. Se regeneran con `npx expo prebuild --platform android` (lo hace `expo run:android` si faltan). Cambios de configuración nativa = editar `app.json`/plugins y volver a generar (`--clean` si hace falta).

### D-14.3 Entorno de compilación (`scripts/dev.sh`)

Una función `setup_android_env` que, **si no están definidas**, exporta:

- `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr` (si existe `bin/java.exe`).
- `ANDROID_HOME` y `ANDROID_SDK_ROOT` = `$LOCALAPPDATA/Android/Sdk` (el mismo que ya usa el script para `adb`).
- `PATH` con `$JAVA_HOME/bin`.

Sin instalar nada global ni tocar variables del sistema del usuario: solo dentro de la ejecución del script.

### D-14.4 Comandos nuevos

- `cmd_build` (`make build`): `cmd_doctor`-ligero (celular listo, JDK), `setup_android_env`, y desde `diabetapp-frontend`: `EXPO_PUBLIC_API_URL=<url> npx expo run:android --device <serial>`. Instala la build y arranca Metro; la primera vez tarda (descarga de Gradle/NDK).
- `cmd_app` gana el modo *dev client*: con `DEV_CLIENT=1` ejecuta `npx expo start --dev-client --lan --clear` y abre la build con `adb shell am start -a android.intent.action.VIEW -d "com.diabetapp.app://expo-development-client/?url=<url-de-metro>"` (o el esquema `exp+diabetapp://`, según lo que genere el cliente; se confirma en T14.2). Sin `DEV_CLIENT`, el comportamiento actual no cambia (RF-14.4).
- `cmd_up` pasa `DEV_CLIENT` tal cual a `cmd_app`.
- El Makefile solo enruta: `build` y la variable `DEV_CLIENT`.

### D-14.5 `make doctor`

Comprobaciones **informativas** (aviso, no error) para el modo *dev client*: JDK encontrado (`java -version` con el `JAVA_HOME` resuelto), NDK presente en `$ANDROID_HOME/ndk`, y si `com.diabetapp.app` está instalada (`adb shell pm list packages`). Nunca hacen fallar `make doctor` si no se usa el modo *dev client*.

### D-14.6 Ruta larga (ajustado tras T14.2)

**subst no funciona:** Node resuelve la ruta real y Gradle termina mezclando X:\ con C:\ («this and base files have different roots»). La salida que sí funciona es compilar en una **copia mínima del frontend con ruta corta** (BUILD_DIR, por defecto C:/dpb): sync_build_dir copia app.json, package.json, package-lock.json, .npmrc, .env y assets/, ejecuta npm ci solo si cambió el lock y regenera android/ solo si cambió app.json o package.json. La app JS no se compila allí (--no-bundler): la sirve Metro desde el repo. Texto original:

Si la compilación falla por longitud de ruta (CMake/Ninja: «Filename longer than 260 characters» o rutas truncadas), la salida es compilar desde una unidad corta: `subst X: <raíz-del-repo>` y ejecutar `make build` desde `X:\`. Se documenta el procedimiento exacto en `CLAUDE.md` solo si hace falta.

## 2. Verificación

| CA | Cómo |
|---|---|
| CA-14.1, CA-14.2, CA-14.6, CA-14.7 | En el celular (moto g34 5G, Android 15). |
| CA-14.3, CA-14.4 | `make up` (Expo Go) y `git status` tras generar `android/`. |
| CA-14.5 | `make doctor` con y sin JDK/NDK/build. |
| Fase 13 (CA-13.10 – CA-13.15) | Recorrido completo sobre la development build. |

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| Faltan NDK/CMake (no están instalados) | Gradle los descarga si las licencias están aceptadas (la carpeta `licenses` existe); si no, se aceptan con `sdkmanager --licenses` del SDK de Android Studio. |
| Ruta larga en Windows | D-14.6 (`subst`). |
| Primera compilación lenta (10–20 min) | Es una sola vez; las siguientes usan la caché de Gradle. |
| Versiones de JDK/Gradle incompatibles con React Native 0.86 | Se usa el JDK de Android Studio (JBR 17/21); si Gradle lo rechaza, se ajusta en T14.2 antes de automatizar. |
| El cliente de desarrollo reacciona distinto a la red local | Mismo `--lan` y misma IP que ya usa Expo Go; se confirma el esquema del enlace en T14.2. |
| Regenerar `android/` pierde ajustes manuales | No se hacen ajustes manuales: todo va en `app.json`/plugins (RNF-14.3). |
