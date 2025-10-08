.PHONY: help build validate deploy deploy-dev deploy-staging deploy-prod test-local clean logs

# Default target
help:
	@echo "Available commands:"
	@echo "  make build          - Build SAM application"
	@echo "  make validate       - Validate SAM template"
	@echo "  make deploy         - Build and deploy to PRODUCTION"
	@echo "  make deploy-dev     - Build and deploy to DEV environment"
	@echo "  make deploy-staging - Build and deploy to STAGING environment"
	@echo "  make deploy-prod    - Build and deploy to PRODUCTION environment"
	@echo "  make test-local     - Start local API for testing"
	@echo "  make logs           - Tail production Lambda logs"
	@echo "  make clean          - Clean build artifacts"

# Build the SAM application
build:
	@echo ">>> Building SAM application..."
	sam build --parallel

# Validate SAM template
validate:
	@echo ">>> Validating SAM template..."
	sam validate --lint

# Build and deploy to PRODUCTION
deploy: build
	@echo ">>> Deploying to PRODUCTION environment..."
	@echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
	sam deploy --region us-east-1 --stack-name agent-operator --parameter-overrides BedrockAgentId="2QAS7CGXW9"
	@echo "✅ Successfully deployed to PRODUCTION!"

# Deploy to DEV environment
deploy-dev: build
	@echo ">>> Deploying to DEV environment..."
	sam deploy --config-env dev
	@echo "✅ Successfully deployed to DEV!"

# Deploy to STAGING environment
deploy-staging: build
	@echo ">>> Deploying to STAGING environment..."
	sam deploy --config-env staging
	@echo "✅ Successfully deployed to STAGING!"

# Deploy to PRODUCTION environment (same as deploy, but explicit)
deploy-prod: deploy

# Start local API for testing
test-local:
	@echo ">>> Starting local API..."
	@echo "API will be available at http://127.0.0.1:3000"
	sam local start-api --env-vars hello-world/env.json --warm-containers EAGER

# Tail production logs
logs:
	@echo ">>> Tailing production Lambda logs..."
	sam logs --stack-name agent-operator-prod --tail

# Clean build artifacts
clean:
	@echo ">>> Cleaning build artifacts..."
	rm -rf .aws-sam
	@echo "✅ Cleaned!"

