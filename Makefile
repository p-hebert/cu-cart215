COMPOSE := docker compose
SERVICE := frontend

.PHONY: help build install ci dev up down restart shell lint format test test-watch build-app preview clean npm

help:
	@echo "Available commands:"
	@echo "  make install      Install/update npm deps inside Docker; updates package-lock.json locally"
	@echo "  make ci           Install exactly from package-lock.json inside Docker"
	@echo "  make dev          Start Vite dev server"
	@echo "  make up           Same as dev"
	@echo "  make down         Stop containers"
	@echo "  make restart      Restart dev server"
	@echo "  make shell        Open shell inside frontend container"
	@echo "  make lint         Run ESLint"
	@echo "  make format       Run Prettier"
	@echo "  make test         Run Jest"
	@echo "  make test-watch   Run Jest in watch mode"
	@echo "  make build-app    Run vite build"
	@echo "  make preview      Run vite preview"
	@echo "  make clean        Remove containers and dependency/cache volumes"
	@echo ""
	@echo "Pass npm args with:"
	@echo "  make npm ARGS='install some-package'"
	@echo "  make npm ARGS='install -D some-dev-package'"

build:
	$(COMPOSE) build

install:
	$(COMPOSE) run --rm $(SERVICE) npm install

ci:
	$(COMPOSE) run --rm $(SERVICE) npm ci

dev up:
	$(COMPOSE) up

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) down
	$(COMPOSE) up

shell:
	$(COMPOSE) run --rm $(SERVICE) sh

lint:
	$(COMPOSE) run --rm $(SERVICE) npm run lint

format:
	$(COMPOSE) run --rm $(SERVICE) npm run format

test:
	$(COMPOSE) run --rm $(SERVICE) npm test

test-watch:
	$(COMPOSE) run --rm $(SERVICE) npm run test:watch

build-app:
	$(COMPOSE) run --rm $(SERVICE) npm run build

preview:
	$(COMPOSE) run --rm --service-ports $(SERVICE) npm run preview -- --host 0.0.0.0

npm:
	$(COMPOSE) run --rm $(SERVICE) npm $(ARGS)

clean:
	$(COMPOSE) down -v