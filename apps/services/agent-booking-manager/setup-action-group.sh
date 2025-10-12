#!/bin/bash

# Script to set up the Action Groups for AgentBookingManager
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-booking-manager"
VET_CLINIC_TOOL_STACK="purrsurance-tool-find-vet-clinic"
POLICY_DETAILS_TOOL_STACK="purrsurance-tool-policy-details"
CONTEXT_SAVE_TOOL_STACK="purrsurance-tool-context-save"
CONTEXT_GET_TOOL_STACK="purrsurance-tool-context-get"
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

# Get Lambda Function ARN for SaveContext
echo "Fetching SaveContext Lambda Function ARN..."
CONTEXT_SAVE_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $CONTEXT_SAVE_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`SaveContextFunction`].OutputValue' \
  --output text)

if [ -z "$CONTEXT_SAVE_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve SaveContext Lambda ARN from tool stack outputs"
  exit 1
fi

echo "SaveContext Lambda ARN: $CONTEXT_SAVE_LAMBDA_ARN"
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

# ========================================
# Action Group 3: ContextActionGroup
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
    --action-group-executor "lambda=$CONTEXT_SAVE_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "SaveContext",
          "description": "Saves contextual information (appointment details, booking preferences, user requests, etc.) to the session context for later retrieval. Use this whenever you need to remember important information about the conversation, booking details, or any other relevant data that should persist across the session.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: appointment_details, booking_preferences, clinic_preferences, scheduling_notes, special_requests, follow_up_needed. This helps organize information for later retrieval.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: appointment details, user preferences, or a complex object with multiple fields.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved. This helps understand the context when reviewing saved information later.",
              "type": "string",
              "required": false
            }
          }
        },
        {
          "name": "GetContext",
          "description": "Retrieves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. You can get specific information by key, all context at once, or list available keys.",
          "parameters": {
            "contextKey": {
              "description": "Optional. The category or type of information to retrieve. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations, assessment, urgency_level. If not specified, returns list of available keys.",
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
  
  echo "✓ ContextActionGroup updated successfully!"
else
  echo "Creating new ContextActionGroup..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name ContextActionGroup \
    --action-group-executor "lambda=$CONTEXT_SAVE_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "SaveContext",
          "description": "Saves contextual information (appointment details, booking preferences, user requests, etc.) to the session context for later retrieval. Use this whenever you need to remember important information about the conversation, booking details, or any other relevant data that should persist across the session.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: appointment_details, booking_preferences, clinic_preferences, scheduling_notes, special_requests, follow_up_needed. This helps organize information for later retrieval.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: appointment details, user preferences, or a complex object with multiple fields.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved. This helps understand the context when reviewing saved information later.",
              "type": "string",
              "required": false
            }
          }
        },
        {
          "name": "GetContext",
          "description": "Retrieves contextual information (diagnosis, complaints, symptoms, treatment plan, etc.) from the session context. Use this to access previously saved information about the conversation, medical findings, or any other relevant data. You can get specific information by key, all context at once, or list available keys.",
          "parameters": {
            "contextKey": {
              "description": "Optional. The category or type of information to retrieve. Common values: diagnosis, symptoms, complaints, treatment_plan, medication, allergies, notes, recommendations, assessment, urgency_level. If not specified, returns list of available keys.",
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
echo "  1. VetClinicFinderActionGroup"
echo "     - Function: FindVetClinic"
echo "  2. PolicyDetailsActionGroup"
echo "     - Function: GetPolicyDetails"
echo "  3. ContextActionGroup"
echo "     - Function: SaveContext"
echo "     - Function: GetContext"
echo ""
echo "Status: Ready"
echo ""
echo "The AgentBookingManager can now:"
echo "  - Find vet clinics and help users book appointments"
echo "  - Retrieve policy details for insurance verification"
echo "  - Save contextual information (appointment details, preferences, etc.)"
echo "  - Retrieve contextual information (diagnosis, symptoms, recommendations, etc.)"
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."


