#!/usr/bin/env bash
# =============================================================================
# Entorno de desarrollo con el celular Android conectado por USB.
#
# Lo usa el Makefile (make up, make logs...), pero también se puede ejecutar
# directamente:  bash scripts/dev.sh <comando>
#
# La lógica vive aquí y no en el Makefile porque `make` en Windows pasa los
# textos a bash con la codificación equivocada (acentos y emojis salen rotos);
# un archivo .sh bash lo lee bien.
# =============================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

BACKEND=diabetapp-backend
FRONTEND=diabetapp-frontend
LOGDIR=.logs
API_PORT=3000
METRO_PORT=8081
EXPO_GO=host.exp.exponent

# Con el puente USB (adb reverse) el celular llega al PC como "localhost":
# no hace falta WiFi ni conocer la IP de la red.
API_URL="http://localhost:${API_PORT}/api"

# adb: el del PATH, o el que instala Android Studio
ADB="$(command -v adb 2>/dev/null || echo "${LOCALAPPDATA:-}/Android/Sdk/platform-tools/adb.exe")"

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
  # las de SDK 53 y anteriores usan el esquema 2.x
  if [ -n "$sdk" ] && [ "${major:-0}" -gt 10 ] && [ "$major" != "$sdk" ]; then
    warn "Expo Go $version es de otro SDK; el proyecto usa SDK $sdk (necesita Expo Go 2.x)."
    warn "«make app» te ofrecerá instalar la versión correcta: responde Y. Si falla al instalar, ejecuta «make reinstall-expo-go» y luego «make app»."
  else
    ok "Expo Go ${version:-instalado}"
  fi
}

# --- Comandos -----------------------------------------------------------------

cmd_doctor() {
  echo "Entorno"
  command -v node >/dev/null && ok "Node $(node -v) (el repo usa $(tr -d '\r\n' <.nvmrc))" || bad "Node no encontrado"
  docker info >/dev/null 2>&1 && ok "Docker en marcha" || bad "Docker no responde: abre Docker Desktop"
  [ -f "$BACKEND/.env" ] && ok "$BACKEND/.env" || bad "Falta $BACKEND/.env (copia env.example y ejecuta «npm run generate-secret»)"
  [ -d "$BACKEND/node_modules" ] && ok "Dependencias del backend" || bad "Ejecuta: cd $BACKEND && npm install"
  [ -d "$FRONTEND/node_modules" ] && ok "Dependencias de la app" || bad "Ejecuta: cd $FRONTEND && npm install"

  echo "Celular (USB)"
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
}

cmd_app() {
  cmd_reverse
  echo "API para la app: $API_URL"
  echo "Si Expo pregunta por instalar Expo Go en el celular, responde Y (necesita la versión de su SDK)."
  cd "$FRONTEND"
  # La variable en la línea de comandos tiene prioridad sobre .env, pero Metro
  # cachea el bundle con la URL ya incrustada: sin --clear podría servir la de
  # una ejecución anterior (p. ej. la IP WiFi de .env). Cuesta unos segundos.
  EXPO_PUBLIC_API_URL="$API_URL" exec npx expo start --android --localhost --clear
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
[ -n "$command_name" ] || die "Uso: bash scripts/dev.sh <doctor|devices|db|backend|backend-bg|reverse|app|up|stop|down|logs|logs-crash|logs-backend|report|status|reinstall-expo-go|adb-reset>"

fn="cmd_${command_name//-/_}"
declare -F "$fn" >/dev/null || die "Comando desconocido: $command_name"
"$fn"
