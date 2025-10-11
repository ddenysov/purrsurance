#!/bin/bash

# Script to set up the Action Group for AgentVetDoctor
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-vet-doctor"
TOOL_STACK_NAME="purrsurance-tool-recommend-doctor-visit"
REGION="us-east-1"

echo "Setting up Action Group for AgentVetDoctor..."
echo ""

# Get Agent ID from stack outputs
echo "Fetching Agent ID from CloudFormation stack..."
AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDoctorAgentId`].OutputValue' \
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
  --query 'Stacks[0].Outputs[?OutputKey==`RecommendDoctorVisitFunction`].OutputValue' \
  --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve Lambda ARN from tool stack outputs"
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
  --query 'actionGroupSummaries[?actionGroupName==`DoctorVisitActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AG" ]; then
  echo "Action group already exists with ID: $EXISTING_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_AG \
    --action-group-name DoctorVisitActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "RecommendDoctorVisit",
          "description": "Recommends a veterinary doctor visit when the pet needs medical attention. Use this function when symptoms indicate the need for professional veterinary care.",
          "parameters": {
            "reason": {
              "description": "The primary reason for recommending the vet visit (e.g., unusual symptoms, health concern, follow-up needed)",
              "type": "string",
              "required": true
            },
            "urgency": {
              "description": "The urgency level of the visit: emergency (immediate care needed), urgent (within 24 hours), normal (schedule at convenience), routine (regular checkup)",
              "type": "string",
              "required": false
            },
            "symptoms": {
              "description": "Comma-separated list of observed symptoms or concerns (e.g., coughing, lethargy, vomiting, loss of appetite)",
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
    --action-group-name DoctorVisitActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "RecommendDoctorVisit",
          "description": "Recommends a veterinary doctor visit when the pet needs medical attention. Use this function when symptoms indicate the need for professional veterinary care.",
          "parameters": {
            "reason": {
              "description": "The primary reason for recommending the vet visit (e.g., unusual symptoms, health concern, follow-up needed)",
              "type": "string",
              "required": true
            },
            "urgency": {
              "description": "The urgency level of the visit: emergency (immediate care needed), urgent (within 24 hours), normal (schedule at convenience), routine (regular checkup)",
              "type": "string",
              "required": false
            },
            "symptoms": {
              "description": "Comma-separated list of observed symptoms or concerns (e.g., coughing, lethargy, vomiting, loss of appetite)",
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
echo "Action Group: DoctorVisitActionGroup"
echo "Function: RecommendDoctorVisit"
echo "Status: Ready"
echo ""
echo "The AgentVetDoctor can now recommend doctor visits and publish events to the Event Publisher."
echo "You can test the agent in the AWS Console or via AWS CLI."


