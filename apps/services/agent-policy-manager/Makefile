.PHONY: help build deploy delete validate logs clean status setup-action-group deploy-full

# Default target
help:
	@echo "Agent Policy Manager - Available commands:"
	@echo "  make build              - Build SAM application"
	@echo "  make deploy             - Deploy to AWS (stack only)"
	@echo "  make setup-action-group - Setup action group after deployment"
	@echo "  make deploy-full        - Deploy stack and setup action group"
	@echo "  make delete             - Delete CloudFormation stack"
	@echo "  make validate           - Validate SAM template"
	@echo "  make logs               - View stack events"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make status             - Show stack status"

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

# Validate SAM template
validate:
	@echo "Validating SAM template..."
	sam validate --lint

# View stack events
logs:
	@echo "Viewing stack events..."
	aws cloudformation describe-stack-events --stack-name purrsurance-agent-policy-manager --max-items 20

# Show stack status
status:
	@echo "Stack status..."
	aws cloudformation describe-stacks --stack-name purrsurance-agent-policy-manager --query 'Stacks[0].[StackName,StackStatus]' --output table

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam

# Setup action group (run after deploy)
setup-action-group:
	@echo "Setting up action group..."
	./setup-action-group.sh

# Deploy full stack with action group
deploy-full: deploy
	@echo "Stack deployed, now setting up action group..."
	@sleep 5
	$(MAKE) setup-action-group

