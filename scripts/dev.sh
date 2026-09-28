#!/usr/bin/env bash
# =============================================================================
# Entorno de desarrollo con el celular Android por WiFi (misma red que el PC).
#
# Lo usa el Makefile (make up, make logs...), pero también se puede ejecutar
# directamente:  bash scripts/dev.sh <comando>
#
# La lógica vive aquí y no en el Makefile porque `make` en Windows pasa los
# textos a bash con la codificación equivocada (acentos y emojis salen rotos);
# un archivo .sh bash lo lee bien.
#
# Por qué WiFi y no `adb reverse` (USB): se probó primero el túnel USB, pero
# en esta máquina las conexiones se cortaban a medias (ERR_EMPTY_RESPONSE en
# el celular) — típico de puertos/cables USB con ahorro de energía o de la
# combinación adb+Windows con ciertos chipsets. `make reverse` se deja como
# alternativa si el celular no puede unirse a la misma red que el PC.
# =============================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

BACKEND=diabetapp-backend
FRONTEND=diabetapp-frontend
LOGDIR=.logs
API_PORT=3000
METRO_PORT=8081
EXPO_GO=host.exp.exponent

# adb: el del PATH, o el que instala Android Studio
ADB="$(command -v adb 2>/dev/null || echo "${LOCALAPPDATA:-}/Android/Sdk/platform-tools/adb.exe")"

# IP del PC en la red local (WiFi o Ethernet), para que el celular hable con el
# backend como si fuera otro dispositivo de la red. LAN_IP=<ip> la fija a mano
# si la detección automática elige la interfaz equivocada (varias tarjetas de
# red, VPN, etc.).
#
# Se usa Node (os.networkInterfaces), NO PowerShell (Get-NetIPAddress): Metro
# también es un proceso Node y elige la IP con el mismo mecanismo, así que
# usar otra vía puede devolver una IP distinta a la que Metro le anuncia al
# celular (visto en producción: PowerShell devolvía una segunda IP en la
# misma subred que Node ni siquiera veía, y la app cargaba pero no podía
# hablar con el backend, aunque Metro y Expo Go sí se conectaban bien).
detect_lan_ip() {
  if [ -n "${LAN_IP:-}" ]; then
    echo "$LAN_IP"
    return 0
  fi

  node -e "
    const os = require('os');
    for (const addrs of Object.values(os.networkInterfaces())) {
      for (const a of addrs || []) {
        if (a.family === 'IPv4' && !a.internal) { console.log(a.address); process.exit(0); }
      }
    }
  " 2>/dev/null
}

# Con más de un celular conectado: SERIAL=<id> (ver `make devices`)
SERIAL="${SERIAL:-}"
ADB_S=()
if [ -n "$SERIAL" ]; then
  ADB_S=(-s "$SERIAL")
  export ANDROID_SERIAL="$SERIAL" # Expo usa este mismo celular
fi

adb_() { "$ADB" "${ADB_S[@]}" "$@"; }

FAIL=0
ok() { echo "  ✅ $1"; }
bad() {
  echo "  ❌ $1"
  FAIL=1
}
warn() { echo "  ⚠️  $1"; }
die() {
  echo "❌ $1" >&2
  exit 1
}

# --- Celular ------------------------------------------------------------------

# Estado del celular: device | unauthorized | offline | many | none
device_state() {
  "$ADB" start-server >/dev/null 2>&1 || true

  local listing
  listing="$("$ADB" devices | tail -n +2 | tr -d '\r' | sed '/^$/d')"
  [ -n "$SERIAL" ] && listing="$(grep "^$SERIAL" <<<"$listing" || true)"

  if [ -z "$listing" ]; then
    echo none
  elif [ "$(wc -l <<<"$listing")" -gt 1 ] && [ -z "$SERIAL" ]; then
    echo many
  elif grep -q unauthorized <<<"$listing"; then
    echo unauthorized
  elif grep -q offline <<<"$listing"; then
    echo offline
  else
    echo device
  fi
}

# Explica qué hacer según el estado; devuelve 0 solo si el celular está listo
explain_device() {
  case "$(device_state)" in
    device) return 0 ;;
    unauthorized)
      echo "El celular pide autorización: desbloquéalo y acepta «Permitir depuración USB» (marca «Permitir siempre»)."
      ;;
    offline)
      echo "El celular figura sin conexión: desconecta y vuelve a conectar el cable, o ejecuta «make adb-reset»."
      ;;
    many)
      echo "Hay varios celulares conectados. Elige uno: make <comando> SERIAL=<id> (ver «make devices»)."
      ;;
    none)
      echo "No hay celular conectado. En el celular: Ajustes > Acerca del teléfono > toca 7 veces «Número de compilación»;"
      echo "luego Ajustes > Opciones de desarrollador > Depuración USB. Conéctalo por cable en modo «Transferencia de archivos»."
      ;;
  esac
  return 1
}

require_device() {
  local msg
  if ! msg="$(explain_device)"; then
    echo "❌ $msg" >&2
    exit 1
  fi
}

# SDK de Expo del proyecto (p. ej. 53), leído de package.json
project_sdk() {
  node -p "String(require('./$FRONTEND/package.json').dependencies.expo).match(/\d+/)[0]" 2>/dev/null || true
}

# Expo Go solo abre proyectos de su propio SDK. La Play Store instala siempre la
# última, así que casi siempre choca con el SDK del proyecto.
check_expo_go() {
  local installed version sdk major
  installed="$(adb_ shell pm list packages 2>/dev/null | tr -d '\r' | grep -c "package:$EXPO_GO" || true)"

  if [ "$installed" -eq 0 ]; then
    warn "Expo Go no está instalado: «make app» ofrecerá instalar el que necesita el proyecto"
    return
  fi

  version="$(adb_ shell dumpsys package "$EXPO_GO" 2>/dev/null | tr -d '\r' | grep -m1 versionName | sed 's/.*=//')"
  sdk="$(project_sdk)"
  major="${version%%.*}"

  # Las versiones nuevas de Expo Go se numeran igual que su SDK (57.x = SDK 57);
  # las de SDK 53 y anteriores usan el esquema 2.x (por eso el filtro > 10)
  if [ -n "$sdk" ] && [ "${major:-0}" -gt 10 ] && [ "$major" != "$sdk" ]; then
    warn "Expo Go $version es de otro SDK; el proyecto usa SDK $sdk (Expo Go solo abre proyectos de su propio SDK)."
    warn "«make app» te ofrecerá instalar la versión correcta: responde Y. Si falla al instalar, ejecuta «make reinstall-expo-go» y luego «make app»."
  else
    ok "Expo Go ${version:-instalado}"
  fi
}

# --- Comandos -----------------------------------------------------------------

# --- Development build (spec fase 14) ---------------------------------------
# Expo Go no puede cargar expo-notifications (Android, SDK 53+): para probar avisos hace
# falta una build propia con expo-dev-client. `make build` la compila e instala;
# `make up DEV_CLIENT=1` la usa en vez de Expo Go. Sin DEV_CLIENT todo sigue como antes.
DEV_CLIENT="${DEV_CLIENT:-}"
APP_ID=com.diabetapp.app

# Carpeta de compilación con ruta CORTA. Con la ruta del repo, CMake/Ninja fallan en Windows
# («ninja: manifest 'build.ninja' still dirty after 100 tries»): los objetos nativos anidan
# rutas de más de 260 caracteres. `subst` no sirve (Node resuelve la ruta real y Gradle mezcla
# X: con C:), así que se compila en una copia mínima del frontend.
BUILD_DIR="${BUILD_DIR:-C:/dpb}"

# Ruta en formato «C:/...» (Gradle y Android Studio la aceptan sin escapes)
to_mixed() { cygpath -m "$1" 2>/dev/null || echo "$1"; }

# JDK que trae Android Studio (no hace falta instalar otro)
find_java_home() {
  local candidate
  if [ -n "${JAVA_HOME:-}" ] && [ -e "$JAVA_HOME/bin/java.exe" ]; then
    echo "$JAVA_HOME"
    return 0
  fi
  for candidate in "C:/Program Files/Android/Android Studio/jbr" "${LOCALAPPDATA:-}/Programs/Android Studio/jbr"; do
    if [ -e "$candidate/bin/java.exe" ]; then
      to_mixed "$candidate"
      return 0
    fi
  done
  return 1
}

# Solo dentro de esta ejecución: no toca las variables del sistema del usuario
setup_android_env() {
  local sdk java_home
  sdk="${ANDROID_HOME:-${LOCALAPPDATA:-}/Android/Sdk}"
  sdk="$(to_mixed "$sdk")"
  export ANDROID_HOME="$sdk" ANDROID_SDK_ROOT="$sdk"

  java_home="$(find_java_home)" || die "No encuentro un JDK. Instala Android Studio (trae uno) o define JAVA_HOME."
  export JAVA_HOME="$java_home"
}

# Copia a BUILD_DIR solo lo que necesita la compilación nativa (la app JS la sirve Metro
# desde el repo) y reinstala dependencias o regenera android/ únicamente si algo cambió.
sync_build_dir() {
  local dst="$BUILD_DIR/$FRONTEND" lock_hash cfg_hash
  mkdir -p "$dst"

  cp "$FRONTEND/app.json" "$FRONTEND/package.json" "$FRONTEND/package-lock.json" "$dst/"
  [ -f "$FRONTEND/.npmrc" ] && cp "$FRONTEND/.npmrc" "$dst/"
  [ -f "$FRONTEND/.env" ] && cp "$FRONTEND/.env" "$dst/"
  rm -rf "$dst/assets" && cp -r "$FRONTEND/assets" "$dst/assets"
  [ -d "$FRONTEND/plugins" ] && { rm -rf "$dst/plugins" && cp -r "$FRONTEND/plugins" "$dst/plugins"; }
  # Las development builds cargan el JS en vivo desde Metro (corriendo en el repo real), así
  # que nunca hizo falta el código fuente aquí. La build "release" en cambio empaqueta el JS
  # como parte del build de Gradle, leyendo `app/`/`src/` de ESTA copia: sin esto, el bundle
  # queda vacío y la app se cae con "Error: No routes found" (spec fase 16, hallazgo real).
  rm -rf "$dst/app" "$dst/src" && cp -r "$FRONTEND/app" "$dst/app" && cp -r "$FRONTEND/src" "$dst/src"
  cp "$FRONTEND/tsconfig.json" "$dst/"

  lock_hash="$(cksum <"$FRONTEND/package-lock.json" | cut -d' ' -f1)"
  if [ ! -d "$dst/node_modules" ] || [ "$(cat "$dst/.lock-hash" 2>/dev/null || true)" != "$lock_hash" ]; then
    echo "Instalando dependencias en $dst ..."
    (cd "$dst" && npm ci)
    echo "$lock_hash" >"$dst/.lock-hash"
  fi

  # Un cambio en app.json/package.json puede cambiar el código nativo: se regenera android/
  cfg_hash="$(cat "$FRONTEND/app.json" "$FRONTEND/package.json" | cksum | cut -d' ' -f1)"
  if [ "$(cat "$dst/.cfg-hash" 2>/dev/null || true)" != "$cfg_hash" ]; then
    rm -rf "$dst/android"
    echo "$cfg_hash" >"$dst/.cfg-hash"
  fi
}

dev_build_installed() {
  adb_ shell pm list packages 2>/dev/null | tr -d '' | grep -q "^package:$APP_ID$"
}

# Informativo: solo hace falta para las notificaciones (nunca hace fallar el doctor)
check_dev_build() {
  local java_home sdk
  if java_home="$(find_java_home)"; then
    ok "JDK para compilar: $java_home"
  else
    warn "No encuentro un JDK (Android Studio trae uno): hace falta solo para «make build»"
  fi

  sdk="${ANDROID_HOME:-${LOCALAPPDATA:-}/Android/Sdk}"
  if [ -d "$sdk/ndk" ]; then
    ok "Android NDK instalado"
  else
    warn "Aún no hay Android NDK: Gradle lo descarga en el primer «make build»"
  fi

  if dev_build_installed; then
    ok "Development build instalada ($APP_ID): «make up DEV_CLIENT=1» la usa"
  else
    warn "Development build no instalada; solo hace falta para notificaciones: «make build»"
  fi
}

cmd_doctor() {
  echo "Entorno"
  command -v node >/dev/null && ok "Node $(node -v) (el repo usa $(tr -d '\r\n' <.nvmrc))" || bad "Node no encontrado"
  docker info >/dev/null 2>&1 && ok "Docker en marcha" || bad "Docker no responde: abre Docker Desktop"
  [ -f "$BACKEND/.env" ] && ok "$BACKEND/.env" || bad "Falta $BACKEND/.env (copia env.example y ejecuta «npm run generate-secret»)"
  [ -d "$BACKEND/node_modules" ] && ok "Dependencias del backend" || bad "Ejecuta: cd $BACKEND && npm install"
  [ -d "$FRONTEND/node_modules" ] && ok "Dependencias de la app" || bad "Ejecuta: cd $FRONTEND && npm install"

  echo "Red"
  local lan_ip
  lan_ip="$(detect_lan_ip)"
  if [ -n "$lan_ip" ]; then
    ok "IP del PC en la red local: $lan_ip (asegúrate de que el celular esté en la misma WiFi)"
  else
    bad "No pude detectar la IP de red del PC. Fija LAN_IP=<tu-ip> (ver 'ipconfig')."
  fi

  echo "Celular (USB, para detectarlo y ver logs; la app usa WiFi)"
  if [ ! -e "$ADB" ]; then
    bad "No encuentro adb. Instala Android Studio o las «platform-tools» de Android."
  else
    ok "adb: $ADB"
    local msg
    if msg="$(explain_device)"; then
      local model version
      model="$(adb_ shell getprop ro.product.model 2>/dev/null | tr -d '\r' || true)"
      version="$(adb_ shell getprop ro.build.version.release 2>/dev/null | tr -d '\r' || true)"
      ok "Celular listo: ${model:-desconocido}, Android ${version:-?}"

      check_expo_go
      check_dev_build
    else
      while IFS= read -r line; do bad "$line"; done <<<"$msg"
    fi
  fi

  if [ "$FAIL" -eq 0 ]; then
    echo "Todo listo."
  else
    echo "Hay problemas por resolver."
    exit 1
  fi
}

cmd_devices() {
  "$ADB" start-server >/dev/null 2>&1 || true
  "$ADB" devices -l
}

cmd_db() {
  (cd "$BACKEND" && docker compose up -d --wait && npx prisma migrate deploy)
}

cmd_backend() {
  cmd_db
  mkdir -p "$LOGDIR"
  cd "$BACKEND"
  npm run dev 2>&1 | tee "../$LOGDIR/backend.log"
}

backend_up() { curl -sf "http://localhost:${API_PORT}/api/health" >/dev/null; }

cmd_backend_bg() {
  cmd_db
  mkdir -p "$LOGDIR"

  if backend_up; then
    echo "✅ El backend ya está corriendo"
    return 0
  fi

  echo "Levantando el backend (log: $LOGDIR/backend.log)..."
  # --exitcrash: si se detiene el servidor (make stop), nodemon también se cierra
  # Se redirige el subshell completo (no solo el comando) para que no retenga la
  # salida de quien nos llamó: si no, `make backend-bg | tail` nunca terminaría.
  (cd "$BACKEND" && exec npx nodemon --exitcrash src/server.ts) >"$LOGDIR/backend.log" 2>&1 </dev/null &

  local i
  for i in $(seq 1 60); do
    if backend_up; then
      echo "✅ Backend listo en :${API_PORT}"
      return 0
    fi
    sleep 1
  done

  echo "❌ El backend no respondió en 60 s. Últimas líneas del log:" >&2
  tail -n 25 "$LOGDIR/backend.log" >&2
  exit 1
}

cmd_reverse() {
  require_device
  adb_ reverse "tcp:${API_PORT}" "tcp:${API_PORT}" >/dev/null
  adb_ reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}" >/dev/null
  echo "✅ Puente USB: el celular ve el backend (:${API_PORT}) y Metro (:${METRO_PORT}) como localhost"
  echo "   (alternativa a WiFi; si el celular no puede unirse a la red del PC)"
}

cmd_app() {
  local lan_ip api_url
  lan_ip="$(detect_lan_ip)"
  [ -n "$lan_ip" ] || die "No pude detectar la IP de red del PC. Fija LAN_IP=<tu-ip> (ver 'ipconfig') o usa 'make reverse' + USB."
  api_url="http://${lan_ip}:${API_PORT}/api"

  echo "PC en la red local como $lan_ip — asegúrate de que el celular esté en la misma WiFi."
  echo "API para la app: $api_url"

  if [ -n "$DEV_CLIENT" ]; then
    dev_build_installed || die "La development build no está instalada en el celular: ejecuta «make build» primero."
    echo "Modo development build (con notificaciones): se abre «DiabetApp», no Expo Go."
    cd "$FRONTEND"
    EXPO_PUBLIC_API_URL="$api_url" exec npx expo start --dev-client --android --lan --clear
  fi

  echo "Si Expo pregunta por instalar Expo Go en el celular, responde Y (necesita la versión de su SDK)."
  cd "$FRONTEND"
  # --lan hace que Metro escuche en todas las interfaces, no solo localhost.
  # La variable en la línea de comandos tiene prioridad sobre .env, pero Metro
  # cachea el bundle con la URL ya incrustada: sin --clear podría servir la de
  # una ejecución anterior. Cuesta unos segundos.
  EXPO_PUBLIC_API_URL="$api_url" exec npx expo start --android --lan --clear
}

# Compila e instala la development build en el celular (spec fase 14). La primera vez tarda
# (Gradle y el NDK se descargan); las siguientes reutilizan la caché.
cmd_build() {
  local lan_ip api_url
  require_device
  setup_android_env
  lan_ip="$(detect_lan_ip)"
  [ -n "$lan_ip" ] || die "No pude detectar la IP de red del PC. Fija LAN_IP=<tu-ip>."
  api_url="http://${lan_ip}:${API_PORT}/api"

  sync_build_dir
  echo "Compilando la development build en $BUILD_DIR/$FRONTEND (JDK: $JAVA_HOME)..."
  cd "$BUILD_DIR/$FRONTEND"
  EXPO_PUBLIC_API_URL="$api_url" npx expo run:android --no-bundler
  echo "Listo. Ahora: make up DEV_CLIENT=1"
}

# Compila e instala una build "release" (standalone): el JavaScript queda empacado dentro
# del APK (nada de Metro) y la API apunta fija al backend en producción, así que la app
# funciona sola, sin el PC ni la WiFi del PC (spec fase 16). Firma con el keystore de debug
# (no hay uno de release configurado): sirve para instalarla por USB, no para la Play Store.
# API_URL=<otra-url> para apuntar a otro backend si hiciera falta.
cmd_release() {
  local api_url="${API_URL:-https://diabetapp-backend.onrender.com/api}"
  require_device
  setup_android_env

  sync_build_dir
  echo "Compilando la build release en $BUILD_DIR/$FRONTEND (API: $api_url)..."
  cd "$BUILD_DIR/$FRONTEND"
  EXPO_PUBLIC_API_URL="$api_url" npx expo run:android --variant release
  echo "Lista: queda instalada y funciona sola, sin Metro ni el PC (API: $api_url)."
}

cmd_up() {
  cmd_doctor
  cmd_backend_bg
  cmd_app
}

kill_port() {
  local port="$1" pid
  pid="$(netstat -ano | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1 || true)"

  if [ -n "$pid" ] && MSYS_NO_PATHCONV=1 taskkill /F /PID "$pid" >/dev/null 2>&1; then
    echo "Detenido lo que escuchaba en el puerto $port"
  fi
}

cmd_stop() {
  kill_port "$API_PORT"
  kill_port "$METRO_PORT"

  # Cierra el puente USB (solo si el celular está listo: adb se cuelga si no)
  if [ "$(device_state)" = device ]; then
    adb_ reverse --remove-all >/dev/null 2>&1 && echo "Puente USB cerrado"
  fi
  echo "Listo."
}

cmd_down() {
  cmd_stop
  (cd "$BACKEND" && docker compose stop)
}

cmd_logs() {
  require_device
  mkdir -p "$LOGDIR"
  adb_ logcat -c || true
  echo "Logs del celular en vivo (Ctrl+C para salir). También se guardan en $LOGDIR/device.log"
  adb_ logcat -v time ReactNative:V ReactNativeJS:V AndroidRuntime:E '*:S' | tee "$LOGDIR/device.log"
}

cmd_logs_crash() {
  require_device
  adb_ logcat -v time AndroidRuntime:E ReactNative:E DEBUG:E libc:F '*:S'
}

cmd_logs_backend() {
  [ -f "$LOGDIR/backend.log" ] || die "Aún no hay log del backend: usa «make backend-bg» o «make up»."
  tail -n 50 -f "$LOGDIR/backend.log"
}

cmd_report() {
  mkdir -p "$LOGDIR"
  local file msg
  file="$LOGDIR/report-$(date +%Y%m%d-%H%M%S).txt"

  {
    echo "== Informe $(date) =="
    echo
    echo "== Dispositivos =="
    "$ADB" devices -l || true
    echo
    echo "== Celular: JavaScript y errores (últimas 300 líneas) =="
    # Con el celular sin autorizar, `adb logcat` se queda esperando en vez de fallar:
    # solo se pide si está listo, y con un límite de tiempo por seguridad.
    if msg="$(explain_device)"; then
      timeout 20 "$ADB" "${ADB_S[@]}" logcat -d -v time ReactNative:V ReactNativeJS:V AndroidRuntime:E '*:S' 2>&1 | tail -n 300 || true
    else
      echo "(sin logs del celular) $msg"
    fi
    echo
    echo "== Backend (últimas 100 líneas) =="
    tail -n 100 "$LOGDIR/backend.log" 2>&1 || echo "(sin log del backend)"
    echo
    echo "== Docker =="
    (cd "$BACKEND" && docker compose ps) 2>&1 || true
  } >"$file" 2>&1

  echo "✅ Informe guardado en $file"
  echo "   Revísalo antes de compartirlo: puede incluir correos de prueba."
}

cmd_status() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${API_PORT}/api/health" 2>/dev/null || true)"
  echo "Backend :${API_PORT}  -> $([ "$code" = 200 ] && echo 'funcionando' || echo 'apagado')"
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${METRO_PORT}/status" 2>/dev/null || true)"
  echo "Metro   :${METRO_PORT}  -> $([ "$code" = 200 ] && echo 'funcionando' || echo 'apagado')"
  (cd "$BACKEND" && docker compose ps --format 'PostgreSQL -> {{.Status}}') 2>/dev/null || echo "PostgreSQL -> apagado"
  "$ADB" devices | tail -n +2 | tr -d '\r' | sed '/^$/d' | sed 's/^/Celular -> /' || true
}

cmd_reinstall_expo_go() {
  require_device
  adb_ uninstall "$EXPO_GO" || true
  echo "Ahora ejecuta «make app»: Expo instalará la versión que necesita el proyecto."
}

cmd_adb_reset() {
  "$ADB" kill-server
  "$ADB" start-server
  "$ADB" devices
}

# --- Entrada ------------------------------------------------------------------

command_name="${1:-}"
[ -n "$command_name" ] || die "Uso: bash scripts/dev.sh <doctor|devices|db|backend|backend-bg|reverse|app|build|up|stop|down|logs|logs-crash|logs-backend|report|status|reinstall-expo-go|adb-reset>"

fn="cmd_${command_name//-/_}"
declare -F "$fn" >/dev/null || die "Comando desconocido: $command_name"
"$fn"
