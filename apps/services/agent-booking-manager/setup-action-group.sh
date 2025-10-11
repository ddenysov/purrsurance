#!/bin/bash

# Script to set up the Action Groups for AgentBookingManager
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-booking-manager"
VET_CLINIC_TOOL_STACK="purrsurance-tool-find-vet-clinic"
POLICY_DETAILS_TOOL_STACK="purrsurance-tool-policy-details"
REGION="us-east-1"

echo "Setting up Action Groups for AgentBookingManager..."
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

# Get Lambda Function ARN for FindVetClinic
echo "Fetching FindVetClinic Lambda Function ARN..."
VET_CLINIC_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $VET_CLINIC_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`FindVetClinicFunction`].OutputValue' \
  --output text)

if [ -z "$VET_CLINIC_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve FindVetClinic Lambda ARN from tool stack outputs"
  exit 1
fi

echo "FindVetClinic Lambda ARN: $VET_CLINIC_LAMBDA_ARN"
echo ""

# Get Lambda Function ARN for GetPolicyDetails
echo "Fetching GetPolicyDetails Lambda Function ARN..."
POLICY_DETAILS_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $POLICY_DETAILS_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`GetPolicyDetailsFunction`].OutputValue' \
  --output text)

if [ -z "$POLICY_DETAILS_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve GetPolicyDetails Lambda ARN from tool stack outputs"
  exit 1
fi

echo "GetPolicyDetails Lambda ARN: $POLICY_DETAILS_LAMBDA_ARN"
echo ""

# ========================================
# Action Group 1: VetClinicFinderActionGroup
# ========================================
echo "Setting up VetClinicFinderActionGroup..."

# Check if VetClinicFinderActionGroup already exists
EXISTING_VET_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`VetClinicFinderActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_VET_AG" ]; then
  echo "VetClinicFinderActionGroup already exists with ID: $EXISTING_VET_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_VET_AG \
    --action-group-name VetClinicFinderActionGroup \
    --action-group-executor "lambda=$VET_CLINIC_LAMBDA_ARN" \
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
  
  echo "✓ VetClinicFinderActionGroup updated successfully!"
else
  echo "Creating new VetClinicFinderActionGroup..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name VetClinicFinderActionGroup \
    --action-group-executor "lambda=$VET_CLINIC_LAMBDA_ARN" \
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
  
  echo "✓ VetClinicFinderActionGroup created successfully!"
fi

echo ""

# ========================================
# Action Group 2: PolicyDetailsActionGroup
# ========================================
echo "Setting up PolicyDetailsActionGroup..."

# Check if PolicyDetailsActionGroup already exists
EXISTING_POLICY_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`PolicyDetailsActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_POLICY_AG" ]; then
  echo "PolicyDetailsActionGroup already exists with ID: $EXISTING_POLICY_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_POLICY_AG \
    --action-group-name PolicyDetailsActionGroup \
    --action-group-executor "lambda=$POLICY_DETAILS_LAMBDA_ARN" \
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
  
  echo "✓ PolicyDetailsActionGroup updated successfully!"
else
  echo "Creating new PolicyDetailsActionGroup..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name PolicyDetailsActionGroup \
    --action-group-executor "lambda=$POLICY_DETAILS_LAMBDA_ARN" \
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
  
  echo "✓ PolicyDetailsActionGroup created successfully!"
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
echo "  1. VetClinicFinderActionGroup"
echo "     - Function: FindVetClinic"
echo "  2. PolicyDetailsActionGroup"
echo "     - Function: GetPolicyDetails"
echo ""
echo "Status: Ready"
echo ""
echo "The AgentBookingManager can now:"
echo "  - Find vet clinics and help users book appointments"
echo "  - Retrieve policy details for insurance verification"
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."


