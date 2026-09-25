# =============================================================================
# DiabetApp: levantar el entorno y probar la app en un celular Android por USB
#
#   make doctor     comprueba que todo esté listo (incluye el celular)
#   make up         base de datos + backend + app en el celular
#   make logs       ve los logs del celular en vivo
#   make report     guarda un informe con logs para revisar o compartir
#
# Requisitos: Docker Desktop, Node (ver .nvmrc) y depuración USB activada en el celular.
# Se ejecuta desde Git Bash (o cualquier terminal con `bash` en el PATH).
#
# Este archivo solo enruta: la lógica está en scripts/dev.sh, que también se
# puede usar sin make:  bash scripts/dev.sh doctor
# =============================================================================

SHELL := bash
.DEFAULT_GOAL := help
DEV := bash scripts/dev.sh

.PHONY: help doctor devices db backend backend-bg reverse app up stop down \
	logs logs-crash logs-backend report status reinstall-expo-go adb-reset

help: ## Muestra esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/^([a-z-]+):.*## (.*)/  make \1|\2/' | column -t -s '|'
	@echo
	@echo "Con varios celulares conectados: make <comando> SERIAL=<id> (el id sale de 'make devices')"

doctor: ## Comprueba Node, Docker, dependencias y el celular
	@$(DEV) doctor

devices: ## Lista los celulares conectados
	@$(DEV) devices

db: ## Levanta PostgreSQL (Docker) y aplica las migraciones
	@$(DEV) db

backend: ## Backend en primer plano con recarga automática (log en .logs/backend.log)
	@$(DEV) backend

backend-bg: ## Backend en segundo plano (log en .logs/backend.log)
	@$(DEV) backend-bg

reverse: ## Abre el puente USB: el celular ve el backend y Metro como localhost
	@$(DEV) reverse

app: ## Arranca Metro e instala/abre la app en el celular (instala Expo Go si falta)
	@$(DEV) app

up: ## Todo junto: BD + backend + app en el celular
	@$(DEV) up

stop: ## Detiene backend y Metro (deja PostgreSQL corriendo)
	@$(DEV) stop

down: ## Detiene todo, también PostgreSQL
	@$(DEV) down

logs: ## Logs del celular en vivo: JavaScript y errores de React Native
	@$(DEV) logs

logs-crash: ## Solo cierres inesperados y errores nativos del celular
	@$(DEV) logs-crash

logs-backend: ## Logs del backend en vivo
	@$(DEV) logs-backend

report: ## Guarda .logs/report-<fecha>.txt con estado, logs del celular y del backend
	@$(DEV) report

status: ## Qué está corriendo ahora
	@$(DEV) status

reinstall-expo-go: ## Desinstala Expo Go del celular (si choca con la versión del proyecto)
	@$(DEV) reinstall-expo-go

adb-reset: ## Reinicia adb (si el celular no aparece)
	@$(DEV) adb-reset
