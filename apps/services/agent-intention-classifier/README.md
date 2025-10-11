# Intention Classifier Agent

AWS Bedrock Agent for classifying user intentions in the Purrsurance pet insurance system.

## Overview

The Intention Classifier Agent analyzes user input and determines which specialized agent should handle the request. It classifies user intentions into four categories:

- **PolicyAgent** - For insurance policy, claims, and car accident related queries
- **VetDocAgent** - For pet health symptoms and veterinary questions
- **BookingAgent** - For booking and scheduling veterinarian appointments
- **AgentNotFoundException** - For greetings and other unrelated queries

## Architecture

- **Foundation Model**: Claude 3.5 Haiku (fast classification)
- **Session Timeout**: 600 seconds (10 minutes)
- **Auto Prepare**: Enabled

## Deployment

### Prerequisites

- AWS SAM CLI installed
- AWS credentials configured
- AWS region: us-east-1

### Commands

```bash
# Validate template
make validate

# Build
make build

# Deploy
make deploy

# Check status
make status

# Get Agent ID
make get-agent-id

# Update instruction only (fast, no full deploy)
make update-instruction

# Delete stack
make delete
```

### Updating Agent Instruction

The agent instruction is stored in `instruction.txt`. To update it:

1. Edit `instruction.txt` with your new instruction
2. Run `make update-instruction`

This will update the agent instruction and create a new alias without requiring a full CloudFormation deployment.

## Configuration

Configuration is managed through `samconfig.toml`. The stack name is `purrsurance-agent-intention-classifier`.

## Outputs

The stack exports:

- `IntentionClassifierAgentId` - Bedrock Agent ID
- `IntentionClassifierAgentAliasId` - Agent Alias ID
- `IntentionClassifierAgentArn` - Agent ARN
- `IntentionClassifierAgentRoleArn` - IAM Role ARN

## Classification Rules

1. **Insurance queries** → PolicyAgent
2. **Pet health symptoms** → VetDocAgent
3. **Booking/scheduling appointments** → BookingAgent
4. **Other queries** → AgentNotFoundException

## Files

- `template.yaml` - CloudFormation template for the agent
- `instruction.txt` - Agent instruction prompt (can be updated separately)
- `Makefile` - Build and deployment commands
- `samconfig.toml` - SAM deployment configuration

