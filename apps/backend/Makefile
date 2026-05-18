SHELL := /bin/sh

APP_SERVICE := app
WORKER_SERVICE := queue-worker
COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help build up down restart ps logs worker-logs shell root composer npm npm-dev npm-build artisan migrate migrate-fresh test pint install setup mcp-demo ngrok ngrok-stop ngrok-sync-env ngrok-tg tg telegram-set-webhook telegram-delete-webhook telegram-set-webhook-all telegram-delete-webhook-all

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nAvailable commands:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  make %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	$(COMPOSE) build

up: ## Start containers in background
	$(COMPOSE) up -d

down: ## Stop and remove containers
	$(COMPOSE) down

restart: down up ## Restart containers

ps: ## Show container status
	$(COMPOSE) ps

logs: ## Follow container logs
	$(COMPOSE) logs -f

worker-logs: ## Follow queue worker logs
	$(COMPOSE) logs -f $(WORKER_SERVICE)

shell: ## Open shell in the app container
	$(COMPOSE) exec $(APP_SERVICE) sh

root: ## Open root shell in the app container
	$(COMPOSE) exec --user root $(APP_SERVICE) sh

composer: ## Run Composer command, e.g. make composer ARGS="require laravel/sanctum"
	$(COMPOSE) exec $(APP_SERVICE) composer $(ARGS)

npm: ## Run npm command, e.g. make npm ARGS="install"
	$(COMPOSE) exec $(APP_SERVICE) npm $(ARGS)

npm-dev: ## Start Vite dev server
	$(COMPOSE) exec $(APP_SERVICE) npm run dev -- --host 0.0.0.0

npm-build: ## Build frontend assets
	$(COMPOSE) exec $(APP_SERVICE) npm run build

artisan: ## Run Artisan command, e.g. make artisan ARGS="route:list"
	$(COMPOSE) exec $(APP_SERVICE) php artisan $(ARGS)

mcp-server: ## Run MCP calculator demo (stdio); requires containers up (`make up`)
	$(COMPOSE) exec $(APP_SERVICE) php mcp/server.php

migrate: ## Run database migrations
	$(COMPOSE) exec $(APP_SERVICE) php artisan migrate

migrate-fresh: ## Recreate database schema and seed
	$(COMPOSE) exec $(APP_SERVICE) php artisan migrate:fresh --seed

test: ## Run Laravel test suite
	$(COMPOSE) exec $(APP_SERVICE) php artisan test

pint: ## Format PHP code with Pint
	$(COMPOSE) exec $(APP_SERVICE) ./vendor/bin/pint

install: ## Install PHP and JS dependencies
	$(COMPOSE) exec $(APP_SERVICE) composer install
	$(COMPOSE) exec $(APP_SERVICE) npm install

setup: build up install migrate npm-build ## Build, start, install deps, migrate and build assets

# Tunnel local HTTP port to the internet and set PUBLIC_APP_URL in .env (see scripts/ngrok-sync-public-app-url.sh).
# Default port matches docker nginx APP_PORT (80). Example: make ngrok NGROK_PORT=8080
# Pid file for stop: NGROK_PID_FILE (default .ngrok.pid), gitignored.
NGROK_PORT ?= 80

ngrok-sync-env: ## Set PUBLIC_APP_URL from a running ngrok (http://127.0.0.1:4040/api/tunnels)
	@sh scripts/ngrok-sync-public-app-url.sh sync

ngrok: ## Start ngrok on NGROK_PORT, write PUBLIC_APP_URL to .env (ngrok stays running in background)
	@sh scripts/ngrok-sync-public-app-url.sh start "$(NGROK_PORT)"

ngrok-stop: ## Stop ngrok (pid from .ngrok.pid, then pkill if tunnel API still responds)
	@sh scripts/ngrok-sync-public-app-url.sh stop

# Start ngrok, write PUBLIC_APP_URL to .env, then register all Telegram webhooks (`telegram:set-webhook --all`).
# Requires: ngrok on PATH, `make up` (app container + DB). Same NGROK_PORT as `make ngrok` (default 80).
tg: ## Short: ngrok + PUBLIC_APP_URL + Telegram webhooks for all channels with tokens
	@sh scripts/ngrok-sync-public-app-url.sh start "$(NGROK_PORT)"
	$(COMPOSE) exec $(APP_SERVICE) php artisan telegram:set-webhook --all

ngrok-tg: tg ## Alias for `make tg`

# Register Telegram Bot API webhook for a delivery channel (agent_channels.uuid, type telegram).
# Requires containers up, DB migrated, channel saved with bot_token. Base URL: PUBLIC_APP_URL or APP_URL (must be HTTPS).
# Example: make telegram-set-webhook CHANNEL_UUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CHANNEL_UUID ?=

telegram-set-webhook: ## Call Telegram setWebhook for CHANNEL_UUID (agent_channels.uuid)
	@test -n "$(CHANNEL_UUID)" || (echo >&2 "Usage: make telegram-set-webhook CHANNEL_UUID=<agent_channels.uuid>"; exit 1)
	$(COMPOSE) exec $(APP_SERVICE) php artisan telegram:set-webhook "$(CHANNEL_UUID)"

telegram-delete-webhook: ## Call Telegram deleteWebhook for CHANNEL_UUID (same channel as set-webhook)
	@test -n "$(CHANNEL_UUID)" || (echo >&2 "Usage: make telegram-delete-webhook CHANNEL_UUID=<agent_channels.uuid>"; exit 1)
	$(COMPOSE) exec $(APP_SERVICE) php artisan telegram:set-webhook "$(CHANNEL_UUID)" --delete

telegram-set-webhook-all: ## Call Telegram setWebhook for every Telegram channel that has a bot_token
	$(COMPOSE) exec $(APP_SERVICE) php artisan telegram:set-webhook --all

telegram-delete-webhook-all: ## Call Telegram deleteWebhook for every Telegram channel that has a bot_token
	$(COMPOSE) exec $(APP_SERVICE) php artisan telegram:set-webhook --all --delete
