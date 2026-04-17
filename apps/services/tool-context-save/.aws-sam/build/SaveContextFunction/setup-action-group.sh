#!/bin/bash

# Script to set up the Action Group for SaveContext tool
# This tool can be attached to any agent that needs to save contextual information
# Run this after deploying the CloudFormation stack
#
# Usage: ./setup-action-group.sh <AGENT_ID>
# Example: ./setup-action-group.sh ABCDEF1234

set -e

TOOL_STACK_NAME="vet-expert-tool-context-save"
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

echo "Setting up SaveContext Action Group for Agent: $AGENT_ID"
echo ""

# Get Lambda Function ARN from tool stack
echo "Fetching Lambda Function ARN from tool stack..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $TOOL_STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`SaveContextFunction`].OutputValue' \
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
  echo "Action group already exists with ID: $EXISTING_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_AG \
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "SaveContext",
          "description": "Saves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) to the session context for later retrieval. Use this whenever you need to remember important information about the conversation, medical findings, or any other relevant data that should persist across the session.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations. This helps organize information for later retrieval.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: a diagnosis text, symptoms list, or a complex object with multiple fields.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved. This helps understand the context when reviewing saved information later.",
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
          "name": "SaveContext",
          "description": "Saves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) to the session context for later retrieval. Use this whenever you need to remember important information about the conversation, medical findings, or any other relevant data that should persist across the session.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations. This helps organize information for later retrieval.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: a diagnosis text, symptoms list, or a complex object with multiple fields.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved. This helps understand the context when reviewing saved information later.",
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
echo "Function: SaveContext"
echo "Status: Ready"
echo ""
echo "The agent can now save contextual information to the session context."
echo "Examples of what can be saved:"
echo "  - Diagnosis information"
echo "  - Symptoms and complaints"
echo "  - Treatment plans"
echo "  - Medication details"
echo "  - Allergies"
echo "  - Follow-up notes"
echo "  - Recommendations"
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."

