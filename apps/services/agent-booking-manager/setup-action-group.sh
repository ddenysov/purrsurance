#!/bin/bash

# Script to set up the Action Groups for AgentBookingManager
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-booking-manager"
VET_CLINIC_TOOL_STACK="purrsurance-tool-find-vet-clinic"
BOOK_VET_CLINIC_TOOL_STACK="purrsurance-tool-book-vet-clinic"
POLICY_DETAILS_TOOL_STACK="purrsurance-tool-policy-details"
CONTEXT_DETAILS_TOOL_STACK="purrsurance-tool-context-details"
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

# Get Lambda Function ARN for BookVetClinic
echo "Fetching BookVetClinic Lambda Function ARN..."
BOOK_VET_CLINIC_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $BOOK_VET_CLINIC_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`BookVetClinicFunction`].OutputValue' \
  --output text)

if [ -z "$BOOK_VET_CLINIC_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve BookVetClinic Lambda ARN from tool stack outputs"
  exit 1
fi

echo "BookVetClinic Lambda ARN: $BOOK_VET_CLINIC_LAMBDA_ARN"
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

# Get Lambda Function ARN for GetContextDetails
echo "Fetching GetContextDetails Lambda Function ARN..."
CONTEXT_DETAILS_LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $CONTEXT_DETAILS_TOOL_STACK \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`GetContextDetailsFunction`].OutputValue' \
  --output text)

if [ -z "$CONTEXT_DETAILS_LAMBDA_ARN" ]; then
  echo "Error: Could not retrieve GetContextDetails Lambda ARN from tool stack outputs"
  exit 1
fi

echo "GetContextDetails Lambda ARN: $CONTEXT_DETAILS_LAMBDA_ARN"
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
          "parameters": {}
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
          "parameters": {}
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION

  echo "✓ VetClinicFinderActionGroup created successfully!"
fi

echo ""

# ========================================
# Action Group 2: BookVetClinicActionGroup
# ========================================
echo "Setting up BookVetClinicActionGroup..."

# Check if BookVetClinicActionGroup already exists
EXISTING_BOOK_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`BookVetClinicActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_BOOK_AG" ]; then
  echo "BookVetClinicActionGroup already exists with ID: $EXISTING_BOOK_AG"
  echo "Updating existing action group..."

  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_BOOK_AG \
    --action-group-name BookVetClinicActionGroup \
    --action-group-executor "lambda=$BOOK_VET_CLINIC_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "BookVetClinic",
          "description": "Books a veterinary appointment for a pet at a specified clinic. Use this function after the user has selected a clinic and confirmed appointment details. Creates an appointment record in the system and returns a confirmation number.",
          "parameters": {
            "policyId": {
              "description": "The insurance policy ID associated with the pet (e.g., POL-2025-001234)",
              "type": "string",
              "required": true
            },
            "pet": {
              "description": "Pet information as a JSON object containing: id, name, species, breed, sex, dateOfBirth, ageMonths, weight, microchip, spayedNeutered, allergies, conditions, vaccinations",
              "type": "string",
              "required": true
            },
            "owner": {
              "description": "Owner information as a JSON object containing: id, fullName, phone, email, address",
              "type": "string",
              "required": true
            },
            "clinic": {
              "description": "Clinic information as a JSON object containing: id, name, address, phone, email, specialty, acceptsInsurance",
              "type": "string",
              "required": true
            },
            "appointmentDate": {
              "description": "The date and time for the appointment in ISO 8601 format (e.g., 2025-10-15T14:30:00Z)",
              "type": "string",
              "required": true
            },
            "appointmentType": {
              "description": "Type of appointment (e.g., routine_checkup, vaccination, emergency, consultation, surgery, dental, grooming)",
              "type": "string",
              "required": true
            },
            "reason": {
              "description": "Reason for the appointment (e.g., annual checkup, vaccination, illness, injury, follow-up)",
              "type": "string",
              "required": true
            },
            "duration": {
              "description": "Duration of the appointment in minutes (default: 30)",
              "type": "integer",
              "required": false
            },
            "notes": {
              "description": "Additional notes or special requests for the appointment",
              "type": "string",
              "required": false
            },
            "preparationInstructions": {
              "description": "Special preparation instructions for the pet owner (e.g., fasting required, bring medical records)",
              "type": "string",
              "required": false
            },
            "medicalContext": {
              "description": "Medical context from previous interactions as a JSON object (symptoms, diagnosis, recommendations, etc.)",
              "type": "string",
              "required": false
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION

  echo "✓ BookVetClinicActionGroup updated successfully!"
else
  echo "Creating new BookVetClinicActionGroup..."

  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name BookVetClinicActionGroup \
    --action-group-executor "lambda=$BOOK_VET_CLINIC_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "BookVetClinic",
          "description": "Books a veterinary appointment for a pet at a specified clinic. Use this function after the user has selected a clinic and confirmed appointment details. Creates an appointment record in the system and returns a confirmation number.",
          "parameters": {
            "policyId": {
              "description": "The insurance policy ID associated with the pet (e.g., POL-2025-001234)",
              "type": "string",
              "required": true
            },
            "pet": {
              "description": "Pet information as a JSON object containing: id, name, species, breed, sex, dateOfBirth, ageMonths, weight, microchip, spayedNeutered, allergies, conditions, vaccinations",
              "type": "string",
              "required": true
            },
            "owner": {
              "description": "Owner information as a JSON object containing: id, fullName, phone, email, address",
              "type": "string",
              "required": true
            },
            "clinic": {
              "description": "Clinic information as a JSON object containing: id, name, address, phone, email, specialty, acceptsInsurance",
              "type": "string",
              "required": true
            },
            "appointmentDate": {
              "description": "The date and time for the appointment in ISO 8601 format (e.g., 2025-10-15T14:30:00Z)",
              "type": "string",
              "required": true
            },
            "appointmentType": {
              "description": "Type of appointment (e.g., routine_checkup, vaccination, emergency, consultation, surgery, dental, grooming)",
              "type": "string",
              "required": true
            },
            "reason": {
              "description": "Reason for the appointment (e.g., annual checkup, vaccination, illness, injury, follow-up)",
              "type": "string",
              "required": true
            },
            "duration": {
              "description": "Duration of the appointment in minutes (default: 30)",
              "type": "integer",
              "required": false
            },
            "notes": {
              "description": "Additional notes or special requests for the appointment",
              "type": "string",
              "required": false
            },
            "preparationInstructions": {
              "description": "Special preparation instructions for the pet owner (e.g., fasting required, bring medical records)",
              "type": "string",
              "required": false
            },
            "medicalContext": {
              "description": "Medical context from previous interactions as a JSON object (symptoms, diagnosis, recommendations, etc.)",
              "type": "string",
              "required": false
            }
          }
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION

  echo "✓ BookVetClinicActionGroup created successfully!"
fi

echo ""

# ========================================
# Action Group 3: ContextSaveActionGroup
# ========================================
echo "Setting up ContextSaveActionGroup..."

# Check if ContextSaveActionGroup already exists
EXISTING_CONTEXT_SAVE_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`ContextSaveActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CONTEXT_SAVE_AG" ]; then
  echo "ContextSaveActionGroup already exists with ID: $EXISTING_CONTEXT_SAVE_AG"
  echo "Updating existing action group..."
  
  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_CONTEXT_SAVE_AG \
    --action-group-name ContextSaveActionGroup \
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
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "✓ ContextSaveActionGroup updated successfully!"
else
  echo "Creating new ContextSaveActionGroup..."
  
  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name ContextSaveActionGroup \
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
        }
      ]
    }' \
    --action-group-state ENABLED \
    --region $REGION
  
  echo "✓ ContextSaveActionGroup created successfully!"
fi

# ========================================
# Action Group 4: ContextDetailsActionGroup
# ========================================
echo "Setting up ContextDetailsActionGroup..."

# Check if ContextDetailsActionGroup already exists
EXISTING_CONTEXT_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`ContextDetailsActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CONTEXT_AG" ]; then
  echo "ContextDetailsActionGroup already exists with ID: $EXISTING_CONTEXT_AG"
  echo "Updating existing action group..."

  aws bedrock-agent update-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-id $EXISTING_CONTEXT_AG \
    --action-group-name ContextDetailsActionGroup \
    --action-group-executor "lambda=$CONTEXT_DETAILS_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContextDetails",
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

  echo "✓ ContextDetailsActionGroup updated successfully!"
else
  echo "Creating new ContextDetailsActionGroup..."

  aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name ContextDetailsActionGroup \
    --action-group-executor "lambda=$CONTEXT_DETAILS_LAMBDA_ARN" \
    --function-schema '{
      "functions": [
        {
          "name": "GetContextDetails",
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

  echo "✓ ContextDetailsActionGroup created successfully!"
fi



echo ""
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
echo "  2. BookVetClinicActionGroup"
echo "     - Function: BookVetClinic"
echo "  3. ContextDetailsActionGroup"
echo "     - Function: GetContextDetails"
echo "  4. ContextSaveActionGroup"
echo "     - Function: SaveContext"
echo ""
echo "Status: Ready"
echo ""
echo "The AgentBookingManager can now:"
echo "  - Find vet clinics based on location, specialty, and urgency"
echo "  - Book veterinary appointments and create confirmation numbers"
echo "  - Retrieve policy details for insurance verification"
echo "  - Save contextual information (appointment details, preferences, etc.)"
echo "  - Retrieve contextual information (diagnosis, symptoms, recommendations, etc.)"
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."


