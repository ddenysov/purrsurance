#!/bin/bash

# Script to set up the Action Group for GetContext tool
# This tool can be attached to any agent that needs to retrieve contextual information
# Run this after deploying the CloudFormation stack
#
# Usage: ./setup-action-group.sh <AGENT_ID>
# Example: ./setup-action-group.sh ABCDEF1234

set -e

TOOL_STACK_NAME="purrsurance-tool-context-get"
REGION="us-east-1"

# Check if agent ID is provided
if [ -z "$1" ]; then
  echo "Error: Agent ID is required"
  echo ""
  echo "Usage: ./setup-action-group.sh <AGENT_ID>"
  echo "Example: ./setup-action-group.sh ABCDEF1234"
  echo ""
  echo "Available agents:"
  aws bedrock-agent list-agents --region $REGION --query 'agentSummaries[].[agentId,agentName]' --output table
  exit 1
fi

AGENT_ID=$1

echo "Setting up GetContext Action Group for Agent: $AGENT_ID"
echo ""

# Get Lambda Function ARN from tool stack
echo "Fetching Lambda Function ARN from tool stack..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $TOOL_STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`GetContextFunction`].OutputValue' \
  --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve Lambda ARN from tool stack outputs"
  echo "Make sure the stack $TOOL_STACK_NAME is deployed"
  exit 1
fi

echo "Lambda ARN: $LAMBDA_ARN"
echo ""

# Create the action group
echo "Creating action group..."

# First, check if action group already exists
EXISTING_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`ContextActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AG" ]; then
  echo "Action group ContextActionGroup already exists with ID: $EXISTING_AG"
  echo "Updating existing action group to add GetContext function..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_AG \
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContext",
          "description": "Retrieves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. You can get specific information by key, all context at once, or list available keys.",
          "parameters": {
            "contextKey": {
              "description": "Optional. The category or type of information to retrieve. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations. If not specified, returns list of available keys.",
              "type": "string",
              "required": false
            },
            "includeAll": {
              "description": "Optional. Set to true to retrieve all context data regardless of contextKey. Returns complete context with all saved information. Use this when you need full session history.",
              "type": "string",
              "required": false
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
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContext",
          "description": "Retrieves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. You can get specific information by key, all context at once, or list available keys.",
          "parameters": {
            "contextKey": {
              "description": "Optional. The category or type of information to retrieve. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations. If not specified, returns list of available keys.",
              "type": "string",
              "required": false
            },
            "includeAll": {
              "description": "Optional. Set to true to retrieve all context data regardless of contextKey. Returns complete context with all saved information. Use this when you need full session history.",
              "type": "string",
              "required": false
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
echo "Preparing agent..."
aws bedrock-agent prepare-agent \
  --agent-id $AGENT_ID \
  --region $REGION

echo ""
echo "✅ Setup complete!"
echo ""
echo "Agent ID: $AGENT_ID"
echo "Action Group: ContextActionGroup"
echo "Function: GetContext"
echo "Status: Ready"
echo ""
echo "The agent can now retrieve contextual information from the session context."
echo "Usage examples:"
echo "  - Get specific context: contextKey='diagnosis'"
echo "  - Get all context: includeAll='true'"
echo "  - List available keys: (no parameters)"
echo ""
echo "For full functionality, make sure SaveContext tool is also attached to this agent."
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."

