# VetDocAgent - Veterinary Documentation Assistant

AWS Bedrock Agent for veterinary documentation and pet insurance assistance in the Purrsurance system.

## Overview

VetDocAgent is a specialized AI agent built on Claude Sonnet 3.5 that helps with:
- Veterinary medical documentation
- Pet insurance policy information
- Claims processing guidance
- Pet health information
- Medical record keeping

## Architecture

The agent is defined entirely in the SAM template with no custom Lambda functions:

```
SAM Template
    ↓
AWS::Bedrock::Agent (VetDocAgent)
    ↓
IAM Role (VetDocAgentRole)
    ↓
AWS::Bedrock::AgentAlias
    ↓
Claude Sonnet 3.5 Foundation Model
```

## Configuration

### Model Selection

The agent uses Claude Sonnet 3.5 by default:
- Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Alternative: `anthropic.claude-3-5-sonnet-20240620-v1:0`

To change the model, update the `VetDocAgentFoundationModel` parameter in `samconfig.toml` or at deployment time.

### Instruction Prompt

The system instruction defines the agent's behavior and capabilities. The default instruction is:

```
You are VetDocAgent, a specialized veterinary documentation assistant for Purrsurance pet insurance.

Your role is to help veterinarians and pet insurance agents with:
- Medical documentation and record-keeping
- Insurance policy explanations
- Claims processing guidance
- Veterinary medical knowledge
- Pet health information

Always provide accurate, professional, and helpful information.
When discussing medical topics, remind users to consult with licensed veterinarians for specific cases.
For insurance-related questions, reference policy documents and standard procedures.
```

#### Customizing the Instruction

Option 1: Override at deployment time

```bash
sam deploy --parameter-overrides VetDocAgentInstruction="Your custom instruction here"
```

Option 2: Update `samconfig.toml`

```toml
parameter_overrides = "... VetDocAgentInstruction=\"Your custom instruction\""
```

Option 3: Update `template.yaml` default in Parameters.

### Session Configuration

- Idle Session TTL: 600 seconds (10 minutes) by default
- Range: 60-3600 seconds
- Configure via: `VetDocAgentIdleSessionTTL` parameter

## Deployment

### Prerequisites
- AWS SAM CLI installed
- AWS account with Bedrock access
- Appropriate IAM permissions
- Bedrock model access enabled for Claude models

### Deploy Agent

```bash
cd apps/services

# Build (no code to compile, validates template)
sam build

# Deploy to production
sam deploy
```

### Get Agent Information

```bash
# Get all outputs
sam list stack-outputs --stack-name agent-operator-prod

# Get specific output (example)
aws cloudformation describe-stacks \
  --stack-name agent-operator-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDocAgentId`].OutputValue' \
  --output text
```

## Using VetDocAgent

### From Lambda Function

```javascript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

const command = new InvokeAgentCommand({
  agentId: process.env.VETDOC_AGENT_ID,
  agentAliasId: process.env.VETDOC_AGENT_ALIAS_ID,
  sessionId: "unique-session-id",
  inputText: "What vaccinations are required for a puppy?"
});

const response = await client.send(command);
```

### Environment Variables for Lambda

```yaml
Environment:
  Variables:
    VETDOC_AGENT_ID: !Ref VetDocAgent
    VETDOC_AGENT_ALIAS_ID: !GetAtt VetDocAgentAlias.AgentAliasId
```

### Required IAM Permissions for Lambda

```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - bedrock:InvokeAgent
        Resource:
          - !GetAtt VetDocAgent.AgentArn
          - !Sub '${VetDocAgent.AgentArn}/*'
```

## Parameters Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `VetDocAgentName` | String | VetDocAgent | Agent name (add env suffix for multi-env) |
| `VetDocAgentFoundationModel` | String | anthropic.claude-3-5-sonnet-20241022-v2:0 | Foundation model ID |
| `VetDocAgentInstruction` | String | (see above) | System instruction/prompt |
| `VetDocAgentIdleSessionTTL` | Number | 600 | Session timeout in seconds |

## Outputs Reference

| Output | Description | Use Case |
|--------|-------------|----------|
| `VetDocAgentId` | Agent ID | Required for invoking agent |
| `VetDocAgentAliasId` | Alias ID | Required for invoking agent |
| `VetDocAgentArn` | Agent ARN | IAM policies, monitoring |
| `VetDocAgentRoleArn` | IAM Role ARN | Reference, auditing |

## Monitoring and Troubleshooting

### CloudWatch Logs

```bash
aws logs tail /aws/bedrock/agents/VetDocAgent --follow
```

Common issues:
- Ensure Bedrock model access is enabled in the account
- Verify IAM role trust and permissions
- Validate template: `sam validate`

## Cost Considerations

- Claude 3.5 Sonnet pricing applies to token usage
- Manage `IdleSessionTTL` for cost optimization
- Monitor invocation and token usage in CloudWatch


