.PHONY: help build deploy delete validate logs clean status deploy-full setup-action-group get-agent-id update-instruction

# Default target
help:
	@echo "Agent Booking Manager - Available commands:"
	@echo "  make build                - Build SAM application"
	@echo "  make deploy               - Deploy to AWS (using deploy.sh script that reads instruction.txt)"
	@echo "  make deploy-full          - Deploy stack + setup action group"
	@echo "  make update-instruction   - Update agent instruction only (fast, no full deploy)"
	@echo "  make setup-action-group   - Setup action group for FindVetClinic tool"
	@echo "  make get-agent-id         - Get Agent ID from stack outputs"
	@echo "  make delete               - Delete CloudFormation stack"
	@echo "  make validate             - Validate SAM template"
	@echo "  make logs                 - View stack events"
	@echo "  make clean                - Clean build artifacts"
	@echo "  make status               - Show stack status"

# Build the SAM application
build:
	@echo "Building SAM application..."
	sam build

# Deploy to AWS (using deploy.sh script that reads instruction.txt)
deploy: build
	@echo "Deploying to AWS..."
	@./deploy.sh

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

# Update agent instruction from instruction.txt (fast update without full deploy)
update-instruction:
	@echo "📝 Updating agent instruction from instruction.txt..."
	@if [ ! -f instruction.txt ]; then \
		echo "❌ Error: instruction.txt not found!"; \
		exit 1; \
	fi
	@AGENT_ID=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-booking-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`BookingManagerAgentId`].OutputValue' \
		--output text 2>/dev/null); \
	if [ -z "$$AGENT_ID" ]; then \
		echo "❌ Error: Could not get Agent ID from stack. Make sure the stack is deployed."; \
		exit 1; \
	fi; \
	echo "🔍 Found Agent ID: $$AGENT_ID"; \
	echo "📤 Updating instruction..."; \
	INSTRUCTION=$$(cat instruction.txt); \
	ROLE_ARN=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-booking-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`BookingManagerAgentRoleArn`].OutputValue' \
		--output text); \
	aws bedrock-agent update-agent \
		--agent-id "$$AGENT_ID" \
		--agent-name "AgentBookingManager" \
		--foundation-model "us.anthropic.claude-3-5-haiku-20241022-v1:0" \
		--instruction "$$INSTRUCTION" \
		--agent-resource-role-arn "$$ROLE_ARN" \
		--idle-session-ttl-in-seconds 900 \
		--output text > /dev/null; \
	echo "🔄 Preparing agent..."; \
	aws bedrock-agent prepare-agent \
		--agent-id "$$AGENT_ID" \
		--output text > /dev/null; \
	echo "✅ Instruction updated successfully!"

# Get Agent ID
get-agent-id:
	@echo "Fetching Agent ID..."
	@aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-booking-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`BookingManagerAgentId`].OutputValue' \
		--output text

# Setup action group for FindVetClinic tool
setup-action-group:
	@echo "🔧 Setting up action group for FindVetClinic..."
	@./setup-action-group.sh

# Deploy full stack with action groups
deploy-full: deploy setup-action-group
	@echo "✅ Deployment complete!"


