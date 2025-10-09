.PHONY: help install build deploy delete invoke logs clean test validate sync-agents list-agents get-urls update-env

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
	@echo "  make get-urls     - Get deployed API endpoint URL"
	@echo "  make update-env   - Update env.json with deployed API endpoint URL"

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

# Get deployed API endpoint URL
get-urls:
	@echo "Fetching deployment URLs..."
	@aws cloudformation describe-stacks \
		--stack-name purrsurance-service-router \
		--query 'Stacks[0].Outputs[?OutputKey==`ServiceRouterApi`].[OutputKey,OutputValue]' \
		--output table

# Update env.json with deployed API endpoint URL
update-env:
	@echo "Updating env.json with deployed API endpoint URL..."
	@API_URL=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-service-router \
		--query 'Stacks[0].Outputs[?OutputKey==`ServiceRouterApi`].OutputValue' \
		--output text 2>/dev/null || echo ""); \
	if [ -z "$$API_URL" ]; then \
		echo "Error: Could not fetch API URL. Is the stack deployed?"; \
		exit 1; \
	fi; \
	echo "API URL: $$API_URL"; \
	if [ -f env.json ]; then \
		jq --arg url "$$API_URL" '.ServiceRouterFunction.API_ENDPOINT = $$url' env.json > env.json.tmp && mv env.json.tmp env.json; \
		echo "env.json updated successfully!"; \
	else \
		echo "Error: env.json not found"; \
		exit 1; \
	fi

