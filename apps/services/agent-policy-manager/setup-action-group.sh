#!/bin/bash

# Script to set up the Action Group for AgentPolicyManager
# Run this after deploying the CloudFormation stack

set -e

STACK_NAME="vet-expert-agent-policy-manager"
TOOL_STACK_NAME="vet-expert-tool-policy-details"
CONTEXT_GET_TOOL_STACK="vet-expert-tool-context-get"
REGION="us-east-1"

echo "Setting up Action Group for AgentPolicyManager..."
echo ""

# Get Agent ID from stack outputs
echo "Fetching Agent ID from CloudFormation stack..."
AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`PolicyManagerAgentId`].OutputValue' \
  --output text)

if [ -z "$AGENT_ID" ]; then
  echo "Error: Could not retrieve Agent ID from stack outputs"
  exit 1
fi

echo "Agent ID: $AGENT_ID"
echo ""

# Get Lambda Function ARN from tool stack
echo "Fetching Lambda Function ARN from tool stack..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $TOOL_STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`GetPolicyDetailsFunction`].OutputValue' \
  --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve Lambda ARN from tool stack outputs"
  exit 1
fi

echo "Lambda ARN: $LAMBDA_ARN"
echo ""

# Get Lambda Function ARN for GetContext
echo "Fetching GetContext Lambda Function ARN..."
CONTEXT_GET_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $CONTEXT_GET_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`GetContextFunction`].OutputValue' \
  --output text)

if [ -z "$CONTEXT_GET_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve GetContext Lambda ARN from tool stack outputs"
  exit 1
fi

echo "GetContext Lambda ARN: $CONTEXT_GET_LAMBDA_ARN"
echo ""

# Create the action group
echo "Creating action group..."

# First, check if action group already exists
EXISTING_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`PolicyDetailsActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AG" ]; then
  echo "Action group already exists with ID: $EXISTING_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_AG \
    --action-group-name PolicyDetailsActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetPolicyDetails",
          "description": "Retrieves detailed information about an insurance policy including pet details, owner information, coverage, medical history, and claims",
          "parameters": {
            "policyId": {
              "description": "The unique identifier for the insurance policy (e.g., POL-2025-001234)",
              "type": "string",
              "required": true
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "Action group updated successfully!"
else
  echo "Creating new action group..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name PolicyDetailsActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetPolicyDetails",
          "description": "Retrieves detailed information about an insurance policy including pet details, owner information, coverage, medical history, and claims",
          "parameters": {
            "policyId": {
              "description": "The unique identifier for the insurance policy (e.g., POL-2025-001234)",
              "type": "string",
              "required": true
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "Action group created successfully!"
fi

echo ""

# ========================================
# Action Group 2: ContextActionGroup
# ========================================
echo "Setting up ContextActionGroup..."

# Check if ContextActionGroup already exists
EXISTING_CONTEXT_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`ContextActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CONTEXT_AG" ]; then
  echo "ContextActionGroup already exists with ID: $EXISTING_CONTEXT_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_CONTEXT_AG \
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$CONTEXT_GET_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContext",
          "description": "Retrieves all contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. Always returns complete context with all saved information.",
          "parameters": {
            "sessionId": {
              "description": "Required. The session identifier that was provided at the start of the conversation. This is the same sessionId from your session attributes. Use this to retrieve context for the correct session.",
              "type": "string",
              "required": true
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "✓ ContextActionGroup updated successfully!"
else
  echo "Creating new ContextActionGroup..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$CONTEXT_GET_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContext",
          "description": "Retrieves all contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. Always returns complete context with all saved information.",
          "parameters": {
            "sessionId": {
              "description": "Required. The session identifier that was provided at the start of the conversation. This is the same sessionId from your session attributes. Use this to retrieve context for the correct session.",
              "type": "string",
              "required": true
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "✓ ContextActionGroup created successfully!"
fi

echo ""
echo "Preparing agent..."
aws bedrock-agent prepare-agent \
  --agent-id $AGENT_ID \
  --region $REGION

echo ""
echo "✅ Setup complete!"
echo ""
echo "Agent ID: $AGENT_ID"
echo ""
echo "Action Groups configured:"
echo "  1. PolicyDetailsActionGroup"
echo "     - Function: GetPolicyDetails"
echo "  2. ContextActionGroup"
echo "     - Function: GetContext"
echo ""
echo "Status: Ready"
echo ""
echo "The AgentPolicyManager can now:"
echo "  - Retrieve policy details for insurance information"
echo "  - Retrieve contextual information from the session"
echo ""
echo "You can now test the agent in the AWS Console or via AWS CLI."

