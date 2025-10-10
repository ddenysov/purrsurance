#!/bin/bash

# Deploy script for AgentVetDoctor
# This script reads the instruction from instruction.txt and passes it as a parameter

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Deploying Agent Vet Doctor..."
echo ""

# Check if instruction.txt exists
if [ ! -f "instruction.txt" ]; then
    echo "❌ Error: instruction.txt not found!"
    exit 1
fi

# Read instruction from file
INSTRUCTION_CONTENT=$(cat instruction.txt)
INSTRUCTION_LENGTH=${#INSTRUCTION_CONTENT}

echo "📝 Instruction file loaded (${INSTRUCTION_LENGTH} characters)"
echo ""

echo "📦 Deploying to AWS..."

# We need to escape the instruction content for passing as parameter
# Use printf to escape special characters and pass through base64 if too complex
# For simplicity, we'll save to a temp file and read during sam deploy

# Create a temporary override file
TEMP_OVERRIDE=$(mktemp)
cat > "$TEMP_OVERRIDE" << 'HEREDOC'
Environment=prod
HEREDOC

# Append instruction parameter (properly escaped)
echo -n "VetDoctorAgentInstruction=" >> "$TEMP_OVERRIDE"
# Use awk to escape newlines and special characters
awk '{printf "%s\\n", $0}' instruction.txt | sed 's/\\n$//' >> "$TEMP_OVERRIDE"

# Deploy using parameter overrides from file
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides file://"$TEMP_OVERRIDE" 2>/dev/null || {
    echo "⚠️  File-based parameter override failed, trying inline method..."
    # Fallback: try inline (this may fail for very long instructions)
    sam deploy \
      --no-confirm-changeset \
      --parameter-overrides \
        Environment=prod \
        VetDoctorAgentInstruction="$INSTRUCTION_CONTENT"
  }

# Clean up
rm -f "$TEMP_OVERRIDE"

echo ""
echo "✅ CloudFormation deployment complete!"
echo ""

# Update instruction via AWS CLI (this ensures the latest instruction is applied)
echo "📝 Updating agent instruction via AWS CLI..."
echo ""

AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name purrsurance-agent-vet-doctor \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentId`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
  echo "⚠️  Warning: Could not get Agent ID from stack. Skipping instruction update."
else
  echo "🔍 Found Agent ID: $AGENT_ID"
  echo "📤 Updating instruction..."
  
  ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name purrsurance-agent-vet-doctor \
    --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentRoleArn`].OutputValue' \
    --output text)
  
  aws bedrock-agent update-agent \
    --agent-id "$AGENT_ID" \
    --agent-name "AgentVetDoctor" \
    --foundation-model "us.anthropic.claude-3-5-haiku-20241022-v1:0" \
    --instruction "$INSTRUCTION_CONTENT" \
    --agent-resource-role-arn "$ROLE_ARN" \
    --idle-session-ttl-in-seconds 900 \
    --output text > /dev/null
  
  echo "🔄 Preparing agent..."
  aws bedrock-agent prepare-agent \
    --agent-id "$AGENT_ID" \
    --output text > /dev/null
  
  echo "✅ Instruction updated successfully!"
fi

echo ""
echo "🎉 Full deployment complete!"
echo ""
echo "📊 To view stack outputs:"
echo "   make status"
echo ""
echo "💡 To update only the instruction (fast):"
echo "   make update-instruction"

