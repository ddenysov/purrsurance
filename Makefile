.PHONY: help install test-db migrate migrate-down seed clean deploy-services-install deploy-services setup-action-groups sync-agents setup

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup                   - Full setup: install, deploy, configure action groups, and sync agents"
	@echo "  make install                 - Install all dependencies (root, data, apps)"
	@echo "  make test-db                 - Test database connection"
	@echo "  make migrate                 - Run database migrations"
	@echo "  make migrate-down            - Rollback database migrations"
	@echo "  make seed                    - Seed database with mock data"
	@echo "  make clean                   - Clean all node_modules"
	@echo "  make deploy-services-install - Install dependencies for all backend services"
	@echo "  make deploy-services         - Install and deploy all backend services to AWS"
	@echo "  make setup-action-groups     - Configure action groups for all agents"
	@echo "  make sync-agents             - Sync agent IDs in service-router"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pnpm install
	@echo "Installing data dependencies..."
	cd data && pnpm install
	@echo "✓ All dependencies installed"

# Test database connection
test-db:
	@echo "Testing database connection..."
	@if [ ! -d "data/node_modules" ]; then \
		echo "Installing data dependencies first..."; \
		cd data && pnpm install; \
	fi
	cd data && pnpm run test
	@echo "✓ Database connection test completed"

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@if [ ! -d "data/node_modules" ]; then \
		echo "Installing data dependencies first..."; \
		cd data && pnpm install; \
	fi
	cd data && pnpm run migrate
	@echo "✓ Migrations completed"

# Rollback migrations
migrate-down:
	@echo "Rolling back database migrations..."
	@if [ ! -d "data/node_modules" ]; then \
		echo "Installing data dependencies first..."; \
		cd data && pnpm install; \
	fi
	cd data && pnpm run migrate:down
	@echo "✓ Migrations rolled back"

# Seed database
seed:
	@echo "Seeding database..."
	@if [ ! -d "data/node_modules" ]; then \
		echo "Installing data dependencies first..."; \
		cd data && pnpm install; \
	fi
	cd data && pnpm run seed
	@echo "✓ Database seeded"

# Clean all node_modules
clean:
	@echo "Cleaning node_modules..."
	rm -rf node_modules
	rm -rf data/node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	@echo "✓ Cleaned"

# Install dependencies for all backend services
deploy-services-install:
	@echo "Installing dependencies for all backend services..."
	@for service in apps/services/*/; do \
		if [ -f "$$service/Makefile" ]; then \
			service_name=$$(basename $$service); \
			echo "→ Installing dependencies for $$service_name..."; \
			cd $$service && make install && cd - > /dev/null; \
		fi \
	done
	@echo "✓ All backend services dependencies installed"

# Install and deploy all backend services to AWS
deploy-services: deploy-services-install
	@echo "Deploying all backend services to AWS..."
	@for service in apps/services/*/; do \
		if [ -f "$$service/Makefile" ]; then \
			service_name=$$(basename $$service); \
			echo "→ Deploying $$service_name..."; \
			cd $$service && make deploy && cd - > /dev/null; \
		fi \
	done
	@echo "✓ All backend services deployed to AWS"

# Setup action groups for agents that have setup-action-group.sh scripts
setup-action-groups:
	@echo "Setting up action groups for agents..."
	@for service in apps/services/agent-*/; do \
		if [ -f "$$service/setup-action-group.sh" ]; then \
			service_name=$$(basename $$service); \
			echo "→ Setting up action groups for $$service_name..."; \
			cd $$service && bash setup-action-group.sh && cd - > /dev/null; \
		fi \
	done
	@for service in apps/services/tool-*/; do \
		if [ -f "$$service/setup-action-group.sh" ]; then \
			service_name=$$(basename $$service); \
			echo "→ Setting up action groups for $$service_name..."; \
			cd $$service && bash setup-action-group.sh && cd - > /dev/null; \
		fi \
	done
	@echo "✓ All action groups configured"

# Sync agents in service-router
sync-agents:
	@echo "Syncing agent IDs in service-router..."
	@cd apps/services/service-router && make sync-agents && cd - > /dev/null
	@echo "✓ Agent IDs synced"

# Full setup: install all dependencies and deploy all services
setup: install deploy-services setup-action-groups sync-agents
	@echo "✓ Setup complete! All dependencies installed, services deployed, action groups configured, and agents synced"

