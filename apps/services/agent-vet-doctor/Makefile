.PHONY: help build deploy delete validate logs clean status deploy-full update-instruction get-agent-id setup-action-group

# Default target
help:
	@echo "Agent Vet Doctor - Available commands:"
	@echo "  make build              - Build SAM application"
	@echo "  make deploy             - Deploy to AWS (reads instruction from instruction.txt)"
	@echo "  make deploy-full        - Same as deploy (build and deploy)"
	@echo "  make update-instruction - Update agent instruction only (fast, no full deploy)"
	@echo "  make setup-action-group - Setup action group for RecommendDoctorVisit tool"
	@echo "  make get-agent-id       - Get agent ID from CloudFormation stack"
	@echo "  make delete             - Delete CloudFormation stack"
	@echo "  make validate           - Validate SAM template"
	@echo "  make logs               - View stack events"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make status             - Show stack status"

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
	aws cloudformation describe-stack-events --stack-name purrsurance-agent-vet-doctor --max-items 20

# Show stack status
status:
	@echo "Stack status..."
	aws cloudformation describe-stacks --stack-name purrsurance-agent-vet-doctor --query 'Stacks[0].[StackName,StackStatus]' --output table

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam

# Deploy full stack
deploy-full: deploy
	@echo "Deployment complete!"
	@echo "Agent ID and Alias ID are exported as CloudFormation outputs."
	@echo "Use 'make status' to view stack information."

# Get Agent ID from CloudFormation stack
get-agent-id:
	@aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-vet-doctor \
		--query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentId`].OutputValue' \
		--output text

# Update agent instruction only (fast update without full deploy)
update-instruction:
	@echo "📝 Updating agent instruction from instruction.txt..."
	@if [ ! -f instruction.txt ]; then \
		echo "❌ Error: instruction.txt not found!"; \
		exit 1; \
	fi
	@AGENT_ID=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-vet-doctor \
		--query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentId`].OutputValue' \
		--output text 2>/dev/null); \
	if [ -z "$$AGENT_ID" ]; then \
		echo "❌ Error: Could not get Agent ID from stack. Make sure the stack is deployed."; \
		exit 1; \
	fi; \
	echo "🔍 Found Agent ID: $$AGENT_ID"; \
	echo "📤 Updating instruction..."; \
	INSTRUCTION=$$(cat instruction.txt); \
	ROLE_ARN=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-agent-vet-doctor \
		--query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentRoleArn`].OutputValue' \
		--output text); \
	aws bedrock-agent update-agent \
		--agent-id "$$AGENT_ID" \
		--agent-name "AgentVetDoctor" \
		--foundation-model "us.anthropic.claude-3-5-haiku-20241022-v1:0" \
		--instruction "$$INSTRUCTION" \
		--agent-resource-role-arn "$$ROLE_ARN" \
		--idle-session-ttl-in-seconds 900 \
		--output text > /dev/null; \
	echo "🔄 Preparing agent (validating changes)..."; \
	PREPARE_OUTPUT=$$(aws bedrock-agent prepare-agent \
		--agent-id "$$AGENT_ID" \
		--output json); \
	PREPARE_STATUS=$$(echo $$PREPARE_OUTPUT | jq -r '.agentStatus'); \
	PREPARED_AT=$$(echo $$PREPARE_OUTPUT | jq -r '.preparedAt'); \
	echo "   Prepare status: $$PREPARE_STATUS"; \
	echo "   Prepared at: $$PREPARED_AT"; \
	echo ""; \
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
	echo "✅ Agent DRAFT Updated Successfully!"; \
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
	echo "📌 Agent ID: $$AGENT_ID"; \
	echo "📌 Status: $$PREPARE_STATUS"; \
	echo "📌 Version: DRAFT (working version)"; \
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
	echo ""; \
	echo "💡 Note: The DRAFT version has been updated and is ready for testing."; \
	echo "💡 To create a snapshot version and update the 'prod' alias, check your"; \
	echo "💡 existing alias in AWS Console and update it manually to snapshot DRAFT."; \
	echo ""; \
	echo "📋 Current agent versions:"; \
	aws bedrock-agent list-agent-versions \
		--agent-id "$$AGENT_ID" \
		--max-results 5 \
		--query 'agentVersionSummaries[*].[agentVersion,agentStatus,createdAt]' \
		--output table 2>/dev/null || echo "   (No versions yet)"; \
	echo ""; \
	echo "📋 Current agent aliases:"; \
	aws bedrock-agent list-agent-aliases \
		--agent-id "$$AGENT_ID" \
		--max-results 5 \
		--query 'agentAliasSummaries[*].[agentAliasName,agentAliasId,agentAliasStatus,routingConfiguration[0].agentVersion]' \
		--output table 2>/dev/null || echo "   (No aliases yet)"; \
	echo ""; \
	echo "🎉 Instruction updated! Test with DRAFT version in AWS Console."

# Setup action group for RecommendDoctorVisit tool
setup-action-group:
	@echo "🔧 Setting up action group for RecommendDoctorVisit..."
	@./setup-action-group.sh


