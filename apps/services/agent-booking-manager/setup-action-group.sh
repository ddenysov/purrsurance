#!/bin/bash

# Script to set up the Action Group for AgentBookingManager
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-booking-manager"
TOOL_STACK_NAME="purrsurance-tool-find-vet-clinic"
REGION="us-east-1"

echo "Setting up Action Group for AgentBookingManager..."
echo ""

# Get Agent ID from stack outputs
echo "Fetching Agent ID from CloudFormation stack..."
AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`BookingManagerAgentId`].OutputValue' \
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
  --query 'Stacks[0].Outputs[?OutputKey==`FindVetClinicFunction`].OutputValue' \
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
  --query 'actionGroupSummaries[?actionGroupName==`VetClinicFinderActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AG" ]; then
  echo "Action group already exists with ID: $EXISTING_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_AG \
    --action-group-name VetClinicFinderActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "FindVetClinic",
          "description": "Finds veterinary clinics based on location, specialty, and urgency. Use this function when a user needs to find a vet clinic for booking an appointment. Returns a list of available clinics with their contact information, ratings, and availability.",
          "parameters": {
            "location": {
              "description": "The location or city where to search for vet clinics (e.g., New York, downtown, near Central Park). If not specified, searches in the current area.",
              "type": "string",
              "required": false
            },
            "specialty": {
              "description": "The type of veterinary specialty needed (e.g., emergency, general practice, surgery, dental, cardiology, dermatology). Use any for all types.",
              "type": "string",
              "required": false
            },
            "urgency": {
              "description": "The urgency level for the appointment: urgent (emergency or same-day needed), normal (regular appointment within a few days), routine (flexible scheduling)",
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
    --action-group-name VetClinicFinderActionGroup \
    --action-group-executor "lambda=$LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "FindVetClinic",
          "description": "Finds veterinary clinics based on location, specialty, and urgency. Use this function when a user needs to find a vet clinic for booking an appointment. Returns a list of available clinics with their contact information, ratings, and availability.",
          "parameters": {
            "location": {
              "description": "The location or city where to search for vet clinics (e.g., New York, downtown, near Central Park). If not specified, searches in the current area.",
              "type": "string",
              "required": false
            },
            "specialty": {
              "description": "The type of veterinary specialty needed (e.g., emergency, general practice, surgery, dental, cardiology, dermatology). Use any for all types.",
              "type": "string",
              "required": false
            },
            "urgency": {
              "description": "The urgency level for the appointment: urgent (emergency or same-day needed), normal (regular appointment within a few days), routine (flexible scheduling)",
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
echo "Action Group: VetClinicFinderActionGroup"
echo "Function: FindVetClinic"
echo "Status: Ready"
echo ""
echo "The AgentBookingManager can now find vet clinics and help users book appointments."
echo "You can test the agent in the AWS Console or via AWS CLI."


