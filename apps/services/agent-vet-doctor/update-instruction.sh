#!/bin/bash

# Script to update Agent Vet Doctor instruction via AWS CLI
# This is much faster than full SAM deploy as it only updates the instruction

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📝 Updating Agent Vet Doctor instruction..."
echo ""

# Check if instruction.txt exists
if [ ! -f "instruction.txt" ]; then
    echo "❌ Error: instruction.txt not found!"
    exit 1
fi

# Read instruction from file
INSTRUCTION_CONTENT=$(cat instruction.txt)
INSTRUCTION_LENGTH=${#INSTRUCTION_CONTENT}

echo "✅ Instruction file loaded (${INSTRUCTION_LENGTH} characters)"
echo ""

# Get Agent ID from CloudFormation stack
echo "🔍 Getting Agent ID from CloudFormation stack..."
AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name purrsurance-agent-vet-doctor \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentId`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
  echo "❌ Error: Could not get Agent ID from stack."
  echo "   Make sure the stack 'purrsurance-agent-vet-doctor' is deployed."
  exit 1
fi

echo "✅ Found Agent ID: $AGENT_ID"
echo ""

# Get Role ARN from CloudFormation stack
echo "🔍 Getting Role ARN from CloudFormation stack..."
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name purrsurance-agent-vet-doctor \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentRoleArn`].OutputValue' \
  --output text)

echo "✅ Found Role ARN: $ROLE_ARN"
echo ""

# Update the agent instruction
echo "📤 Updating agent instruction via AWS Bedrock API..."
aws bedrock-agent update-agent \
  --agent-id "$AGENT_ID" \
  --agent-name "AgentVetDoctor" \
  --foundation-model "us.anthropic.claude-3-5-haiku-20241022-v1:0" \
  --instruction "$INSTRUCTION_CONTENT" \
  --agent-resource-role-arn "$ROLE_ARN" \
  --idle-session-ttl-in-seconds 900 \
  --output text > /dev/null

echo "✅ Instruction updated"
echo ""

# Prepare the agent (required after update)
echo "🔄 Preparing agent (this may take a few seconds)..."
aws bedrock-agent prepare-agent \
  --agent-id "$AGENT_ID" \
  --output text > /dev/null

echo "⏳ Waiting for agent to be fully prepared..."
# Poll agent status until it's prepared
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  AGENT_STATUS=$(aws bedrock-agent get-agent \
    --agent-id "$AGENT_ID" \
    --query 'agent.agentStatus' \
    --output text)
  
  if [ "$AGENT_STATUS" == "PREPARED" ] || [ "$AGENT_STATUS" == "NOT_PREPARED" ]; then
    break
  fi
  
  echo "   Status: $AGENT_STATUS (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "⚠️  Warning: Agent preparation timed out, but continuing..."
fi

echo "✅ Agent prepared"
echo ""

# Get the latest prepared version
echo "🔍 Getting latest prepared version..."
LATEST_VERSION=$(aws bedrock-agent list-agent-versions \
    --agent-id "$AGENT_ID" \
    --query 'sort_by(agentVersionSummaries, &createdAt)[-1].agentVersion' \
    --output text)

# Skip DRAFT version if it's returned
if [ "$LATEST_VERSION" == "DRAFT" ]; then
  LATEST_VERSION=$(aws bedrock-agent list-agent-versions \
    --agent-id "$AGENT_ID" \
    --query 'sort_by(agentVersionSummaries, &createdAt)[-2].agentVersion' \
    --output text)
fi

echo "✅ Latest prepared version: $LATEST_VERSION"
echo ""

# Get Agent Alias ID from CloudFormation stack
echo "🔍 Getting Agent Alias ID from CloudFormation stack..."
AGENT_ALIAS_ID=$(aws cloudformation describe-stacks \
  --stack-name purrsurance-agent-vet-doctor \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentAliasId`].OutputValue' \
  --output text)

if [ -z "$AGENT_ALIAS_ID" ]; then
  echo "❌ Error: Could not get Agent Alias ID from stack."
  exit 1
fi

echo "✅ Found Agent Alias ID: $AGENT_ALIAS_ID"
echo ""

# Update the alias to point to the new version
echo "🔄 Updating alias to point to version $LATEST_VERSION..."
aws bedrock-agent update-agent-alias \
  --agent-id "$AGENT_ID" \
  --agent-alias-id "$AGENT_ALIAS_ID" \
  --agent-alias-name "prod-vet-doctor-alias" \
  --routing-configuration "[{\"agentVersion\": \"$LATEST_VERSION\"}]" \
  --output text > /dev/null

echo "✅ Alias updated to version $LATEST_VERSION"
echo ""
echo "🎉 Instruction update complete!"
echo ""
echo "💡 The agent alias is now using version $LATEST_VERSION with the updated instruction"
echo ""

