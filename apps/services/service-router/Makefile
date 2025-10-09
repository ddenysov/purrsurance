.PHONY: help install build deploy delete invoke logs clean test validate sync-agents list-agents

# Default target
help:
	@echo "Service Router Service - Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make build        - Build SAM application"
	@echo "  make deploy       - Deploy to AWS"
	@echo "  make delete       - Delete CloudFormation stack"
	@echo "  make invoke       - Test function locally"
	@echo "  make logs         - Tail CloudWatch logs"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make test         - Run tests"
	@echo "  make validate     - Validate SAM template"
	@echo "  make sync-agents  - Sync agent IDs from AWS Bedrock to config files"
	@echo "  make list-agents  - List all AWS Bedrock agents"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pnpm install

# Build the SAM application
build:
	@echo "Building SAM application..."
	sam build

# Deploy to AWS
deploy: build
	@echo "Deploying to AWS..."
	sam deploy --no-confirm-changeset

# Delete the CloudFormation stack
delete:
	@echo "Deleting stack..."
	sam delete

# Test function locally with mock event
invoke:
	@echo "Invoking function locally..."
	@echo '{"httpMethod":"POST","body":"{\"message\":\"Hello Agent\"}"}' | sam local invoke ServiceRouterFunction

# Start local API
start-api: build
	@echo "Starting local API..."
	sam local start-api --warm-containers EAGER

# Tail CloudWatch logs
logs:
	@echo "Tailing logs..."
	sam logs -n ServiceRouterFunction --stack-name purrsurance-service-router --tail

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam
	rm -rf node_modules

# Run tests
test:
	@echo "Running tests..."
	pnpm test

# Validate SAM template
validate:
	@echo "Validating SAM template..."
	sam validate --lint

# Sync agent IDs from AWS Bedrock
sync-agents:
	@echo "Syncing agent IDs from AWS Bedrock..."
	./sync-agents.sh

# List all AWS Bedrock agents (quick view)
list-agents:
	@echo "Listing AWS Bedrock agents..."
	@aws bedrock-agent list-agents --query 'agentSummaries[*].[agentName,agentId,agentStatus]' --output table

