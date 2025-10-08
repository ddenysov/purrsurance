.PHONY: help build deploy delete validate logs clean

# Default target
help:
	@echo "Intention Classifier Agent - Available commands:"
	@echo "  make build        - Build SAM application"
	@echo "  make deploy       - Deploy to AWS"
	@echo "  make delete       - Delete CloudFormation stack"
	@echo "  make validate     - Validate SAM template"
	@echo "  make logs         - View stack events"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make status       - Show stack status"

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
	aws cloudformation describe-stack-events --stack-name purrsurance-agent-intention-classifier --max-items 20

# Show stack status
status:
	@echo "Stack status..."
	aws cloudformation describe-stacks --stack-name purrsurance-agent-intention-classifier --query 'Stacks[0].[StackName,StackStatus]' --output table

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam

