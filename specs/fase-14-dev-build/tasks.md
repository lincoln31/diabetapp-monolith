# Tareas F14 — Development build

Implementa: [plan.md](plan.md) · Rama: `feat/fase-14-dev-build`

## Bloque 0 — Viabilidad

- [x] **T14.1** Spec aprobada (recomendación de la fase 13 aceptada).
- [ ] **T14.2** ⏳ (requiere celular) **Compilación de prueba**: `expo-dev-client`, `android.package`, plugin de notificaciones, `prebuild` y compilar con el JDK de Android Studio; anotar los pasos exactos que hicieron falta (NDK, licencias, ruta larga, esquema del enlace). — plan §0 · depende de T14.1

## Bloque A — Configuración

- [ ] **T14.3** `app.json` (`android.package`, plugin `expo-notifications`), `expo-dev-client` instalado y `/android`, `/ios` en `.gitignore`. — RF-14.1, RF-14.5 · depende de T14.2

## Bloque B — Scripts

- [ ] **T14.4** `setup_android_env` en `scripts/dev.sh` (JAVA_HOME, ANDROID_HOME, PATH). — RF-14.2, RNF-14.2 · depende de T14.2
- [ ] **T14.5** `cmd_build` y `make build`. — RF-14.2 · depende de T14.4
- [ ] **T14.6** Modo `DEV_CLIENT=1` en `cmd_app`/`cmd_up` y en el Makefile; el modo por defecto queda igual. — RF-14.3, RF-14.4 · depende de T14.5
- [ ] **T14.7** Comprobaciones informativas en `cmd_doctor` (JDK, NDK, build instalada). — RF-14.6 · depende de T14.4

## Bloque C — Verificación y cierre

- [ ] **T14.8** ⏳ (requiere celular) Recorrido: CA-14.1 – CA-14.7 sobre la development build.
- [ ] **T14.9** ⏳ (requiere celular) Recorrido de la fase 13: CA-13.10 – CA-13.15 (recordatorios a 2 minutos, archivar, logro nuevo, backend apagado, todo apagado). — depende de T14.8
- [ ] **T14.10** `CLAUDE.md` (`make build`, `DEV_CLIENT=1`, particularidades), fases 13 y 14 como `Implementada` en `specs/README.md`, #51 cerrado con su comentario.

## Trazabilidad

| RF | Tareas | CA |
|---|---|---|
| RF-14.1 | T14.3 | CA-14.1 |
| RF-14.2 | T14.4, T14.5 | CA-14.1 |
| RF-14.3 | T14.6 | CA-14.2 |
| RF-14.4 | T14.6 | CA-14.3 |
| RF-14.5 | T14.3 | CA-14.4 |
| RF-14.6 | T14.7 | CA-14.5 |
| RF-14.7 | T14.8, T14.9 | CA-14.6, CA-14.7 |
