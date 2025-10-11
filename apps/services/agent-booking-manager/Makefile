.PHONY: help build deploy delete validate logs clean status deploy-full

# Default target
help:
	@echo "Agent Booking Manager - Available commands:"
	@echo "  make build         - Build SAM application"
	@echo "  make deploy        - Deploy to AWS"
	@echo "  make deploy-full   - Deploy stack (full deployment)"
	@echo "  make delete        - Delete CloudFormation stack"
	@echo "  make validate      - Validate SAM template"
	@echo "  make logs          - View stack events"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make status        - Show stack status"

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
	aws cloudformation describe-stack-events --stack-name purrsurance-agent-booking-manager --max-items 20

# Show stack status
status:
	@echo "Stack status..."
	aws cloudformation describe-stacks --stack-name purrsurance-agent-booking-manager --query 'Stacks[0].[StackName,StackStatus]' --output table

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam

# Deploy full stack (currently no action groups needed)
deploy-full: deploy
	@echo "✅ Deployment complete!"


