.PHONY: help build deploy delete validate logs clean status setup-action-group deploy-full get-agent-id update-instruction

# Default target
help:
	@echo "Agent Policy Manager - Available commands:"
	@echo "  make build                - Build SAM application"
	@echo "  make deploy               - Deploy to AWS (using deploy.sh script that reads instruction.txt)"
	@echo "  make deploy-full          - Deploy stack + setup action group"
	@echo "  make update-instruction   - Update agent instruction only (fast, no full deploy)"
	@echo "  make setup-action-group   - Setup action group after deployment"
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
	aws cloudformation describe-stack-events --stack-name purrsurance-agent-policy-manager --max-items 20

# Show stack status
status:
	@echo "Stack status..."
	aws cloudformation describe-stacks --stack-name purrsurance-agent-policy-manager --query 'Stacks[0].[StackName,StackStatus]' --output table

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
		--stack-name purrsurance-agent-policy-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`PolicyManagerAgentId`].OutputValue' \
		--output text 2>/dev/null); \
	if [ -z "$$AGENT_ID" ]; then \
		echo "❌ Error: Could not get Agent ID from stack. Make sure the stack is deployed."; \
		exit 1; \
	fi; \
	echo "🔍 Found Agent ID: $$AGENT_ID"; \
	echo "📤 Updating instruction..."; \
	INSTRUCTION=$$(cat instruction.txt); \
	ROLE_ARN=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-policy-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`PolicyManagerAgentRoleArn`].OutputValue' \
		--output text); \
	aws bedrock-agent update-agent \
		--agent-id "$$AGENT_ID" \
		--agent-name "AgentPolicyManager" \
		--foundation-model "us.anthropic.claude-3-5-haiku-20241022-v1:0" \
		--instruction "$$INSTRUCTION" \
		--agent-resource-role-arn "$$ROLE_ARN" \
		--idle-session-ttl-in-seconds 900 \
		--output text > /dev/null; \
	echo "🔄 Preparing agent..."; \
	aws bedrock-agent prepare-agent \
		--agent-id "$$AGENT_ID" \
		--output text > /dev/null; \
	echo "✅ Instruction updated successfully!"; \
	echo "⏳ Waiting for agent to be ready..."; \
	MAX_WAIT=60; \
	COUNTER=0; \
	while [ $$COUNTER -lt $$MAX_WAIT ]; do \
		AGENT_STATUS=$$(aws bedrock-agent get-agent \
			--agent-id "$$AGENT_ID" \
			--query 'agent.agentStatus' \
			--output text); \
		if [ "$$AGENT_STATUS" = "PREPARED" ] || [ "$$AGENT_STATUS" = "NOT_PREPARED" ]; then \
			break; \
		fi; \
		echo "  Agent status: $$AGENT_STATUS (waiting...)"; \
		sleep 2; \
		COUNTER=$$((COUNTER + 2)); \
	done; \
	if [ $$COUNTER -ge $$MAX_WAIT ]; then \
		echo "⚠️  Warning: Agent preparation timeout. Alias not created."; \
		exit 1; \
	fi; \
	echo "🔗 Creating new agent alias..."; \
	TIMESTAMP=$$(date +%Y%m%d-%H%M%S); \
	ALIAS_ID=$$(aws bedrock-agent create-agent-alias \
		--agent-id "$$AGENT_ID" \
		--agent-alias-name "alias-$$TIMESTAMP" \
		--query 'agentAlias.agentAliasId' \
		--output text); \
	if [ -z "$$ALIAS_ID" ]; then \
		echo "❌ Error: Failed to create alias"; \
		exit 1; \
	fi; \
	echo "✅ New alias created successfully!"; \
	echo ""; \
	echo "📋 Alias ID: $$ALIAS_ID"; \
	echo "📋 Alias Name: alias-$$TIMESTAMP"; \
	echo ""

# Get Agent ID
get-agent-id:
	@echo "Fetching Agent ID..."
	@aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-policy-manager \
		--query 'Stacks[0].Outputs[?OutputKey==`PolicyManagerAgentId`].OutputValue' \
		--output text

# Setup action group (run after deploy)
setup-action-group:
	@echo "Setting up action group..."
	./setup-action-group.sh

# Deploy full stack with action group
deploy-full: deploy setup-action-group
	@echo "✅ Deployment complete!"

