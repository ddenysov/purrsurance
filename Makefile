.PHONY: help install test-db migrate migrate-down seed clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies (root, data, apps)"
	@echo "  make test-db       - Test database connection"
	@echo "  make migrate       - Run database migrations"
	@echo "  make migrate-down  - Rollback database migrations"
	@echo "  make seed          - Seed database with mock data"
	@echo "  make clean         - Clean all node_modules"

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

