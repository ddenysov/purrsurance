#!/bin/bash

# Script to set up the Action Groups for AgentVetDoctor
# Run this after deploying the CloudFormation stacks

set -e

STACK_NAME="purrsurance-agent-vet-doctor"
TOOL_STACK_NAME="purrsurance-tool-recommend-doctor-visit"
POLICY_DETAILS_TOOL_STACK="purrsurance-tool-policy-details"
CONTEXT_SAVE_TOOL_STACK="purrsurance-tool-context-save"
REGION="us-east-1"

echo "Setting up Action Groups for AgentVetDoctor..."
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

# ========================================
# Action Group 1: DoctorVisitActionGroup
# ========================================
echo "Setting up DoctorVisitActionGroup..."

# Check if DoctorVisitActionGroup already exists
EXISTING_AG=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query 'actionGroupSummaries[?actionGroupName==`DoctorVisitActionGroup`].actionGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AG" ]; then
  echo "DoctorVisitActionGroup already exists with ID: $EXISTING_AG"
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
  
  echo "✓ DoctorVisitActionGroup updated successfully!"
else
  echo "Creating new DoctorVisitActionGroup..."
  
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
  
  echo "✓ DoctorVisitActionGroup created successfully!"
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
          "description": "Saves important medical and diagnostic information to session context for use by other agents (like booking manager). Use this to preserve diagnosis, symptoms, assessment results, recommendations, and any information that would help other agents provide better service.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: diagnosis, symptoms, assessment, recommendations, urgency_level, treatment_advice, medical_notes, pet_condition, visit_recommendation. This helps organize information for other agents.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: diagnosis details, symptom list, assessment results, or complete medical notes.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved and why it would be useful for other agents. This helps other agents understand the context.",
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
          "description": "Saves important medical and diagnostic information to session context for use by other agents (like booking manager). Use this to preserve diagnosis, symptoms, assessment results, recommendations, and any information that would help other agents provide better service.",
          "parameters": {
            "contextKey": {
              "description": "The category or type of information being saved. Common values: diagnosis, symptoms, assessment, recommendations, urgency_level, treatment_advice, medical_notes, pet_condition, visit_recommendation. This helps organize information for other agents.",
              "type": "string",
              "required": true
            },
            "data": {
              "description": "The actual information to save. Can be a string or a JSON object containing structured data. For example: diagnosis details, symptom list, assessment results, or complete medical notes.",
              "type": "string",
              "required": true
            },
            "description": {
              "description": "Optional human-readable description of what is being saved and why it would be useful for other agents. This helps other agents understand the context.",
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
echo "  1. DoctorVisitActionGroup"
echo "     - Function: RecommendDoctorVisit"
echo "  2. PolicyDetailsActionGroup"
echo "     - Function: GetPolicyDetails"
echo "  3. ContextActionGroup"
echo "     - Function: SaveContext"
echo ""
echo "Status: Ready"
echo ""
echo "The AgentVetDoctor can now:"
echo "  - Recommend doctor visits and publish events to the Event Publisher"
echo "  - Retrieve policy details for insurance verification"
echo "  - Save diagnostic and medical information to context for other agents"
echo ""
echo "You can test the agent in the AWS Console or via AWS CLI."


