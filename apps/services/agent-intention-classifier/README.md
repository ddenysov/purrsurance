# Intention Classifier Agent

AWS Bedrock Agent for classifying user intentions in the Purrsurance pet insurance system.

## Overview

The Intention Classifier Agent analyzes user input and determines which specialized agent should handle the request. It classifies user intentions into three categories:

- **PolicyAgent** - For insurance policy, claims, and car accident related queries
- **VetDocAgent** - For pet health symptoms and veterinary questions
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

# Delete stack
make delete
```

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
3. **Other queries** → AgentNotFoundException

