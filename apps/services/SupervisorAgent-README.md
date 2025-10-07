# SupervisorAgent - Request Router with Supervision

AWS Bedrock Agent for intelligent request routing in the Purrsurance pet insurance system.

## Overview

SupervisorAgent is a specialized AI agent built on Claude 3.5 Haiku that acts as an intelligent router:
- Analyzes incoming user requests
- Routes to appropriate specialized agents (VetDocAgent, etc.)
- Handles simple general inquiries directly
- Ensures users reach the right specialist quickly
- Provides fast, cost-effective routing decisions

## Architecture

The supervisor agent is defined entirely in the SAM template with no custom Lambda functions:

```
User Request
    ↓
SupervisorAgent (Claude 3.5 Haiku)
    ↓
Decision/Routing Logic
    ↓
    ├─→ VetDocAgent (medical queries)
    ├─→ PolicyAgent (insurance queries)
    └─→ Direct Response (general queries)
```

## Why Claude 3.5 Haiku?

**Haiku is ideal for routing because:**
- **Fast**: Low latency for routing decisions
- **Cost-effective**: ~80% cheaper than Sonnet
- **Sufficient**: Routing doesn't need advanced reasoning
- **Reliable**: Consistent classification performance

**Comparison:**
- **Haiku**: $0.25/$1.25 per 1M tokens (in/out)
- **Sonnet**: $3.00/$15.00 per 1M tokens (in/out)

## Configuration

### Model Selection

The agent uses Claude 3.5 Haiku by default:
- **Model ID**: `anthropic.claude-3-5-haiku-20241022-v1:0`
- **Alternative**: `anthropic.claude-3-haiku-20240307-v1:0` (older version)
- **Upgrade Option**: `anthropic.claude-3-5-sonnet-20241022-v2:0` (for complex routing)

To change the model, update the `SupervisorAgentFoundationModel` parameter in samconfig.toml or at deployment.

### Instruction Prompt

The system instruction defines the agent's routing logic and behavior. The default instruction includes:

```
You are SupervisorAgent, an intelligent request router for the Purrsurance pet insurance system.

Your primary role is to analyze incoming user requests and route them to the appropriate specialized agent:

**Routing Guidelines:**

1. **VetDocAgent** - Route requests about:
   - Veterinary medical documentation
   - Medical record keeping
   - Veterinary knowledge and procedures
   - Pet health conditions and symptoms
   - Medical terminology

2. **Insurance/Policy Questions** - Route requests about:
   - Policy coverage and benefits
   - Claims processing and status
   - Premium calculations
   - Policy terms and conditions
   - Insurance product information

3. **General Inquiries** - Handle directly:
   - Greeting and general conversation
   - Navigation help
   - System status questions
   - Simple FAQs

**Response Format:**
When routing, clearly indicate which agent should handle the request and why.
For general inquiries, provide a brief, helpful response directly.

**Tone:** Professional, efficient, and helpful.
**Goal:** Ensure users reach the right specialist quickly.
```

#### Customizing the Routing Logic

**Option 1: Override at deployment time**

```bash
sam deploy --parameter-overrides SupervisorAgentInstruction="Your custom routing logic here"
```

**Option 2: Update samconfig.toml**

Add to parameter_overrides:
```toml
parameter_overrides = "... SupervisorAgentInstruction=\"Your custom instruction\""
```

**Option 3: Update template.yaml default**

Change the Default value in the Parameters section.

### Session Configuration

- **Idle Session TTL**: 600 seconds (10 minutes) by default
- **Range**: 60-3600 seconds
- **Configure via**: `SupervisorAgentIdleSessionTTL` parameter

## Deployment

### Prerequisites
- AWS SAM CLI installed
- AWS account with Bedrock access
- Appropriate IAM permissions
- Bedrock model access enabled for Claude Haiku

### Deploy Agent

```bash
cd apps/services

# Build (validates template)
sam build

# Deploy to dev
sam deploy --config-env dev

# Deploy to staging
sam deploy --config-env staging

# Deploy to production
sam deploy --config-env prod
```

### Get Agent Information

After deployment, get the supervisor agent details:

```bash
# Get all outputs
sam list stack-outputs --stack-name agent-operator-dev

# Get specific output
aws cloudformation describe-stacks \
  --stack-name agent-operator-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`SupervisorAgentId`].OutputValue' \
  --output text
```

## Using SupervisorAgent

### From Lambda Function

To invoke SupervisorAgent from a Lambda function:

```javascript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

const command = new InvokeAgentCommand({
  agentId: process.env.SUPERVISOR_AGENT_ID,
  agentAliasId: process.env.SUPERVISOR_AGENT_ALIAS_ID,
  sessionId: 'unique-session-id',
  inputText: 'My dog has been coughing. What should I check?'
});

const response = await client.send(command);

// Parse response to determine routing
// Response will indicate which specialized agent to call
```

### Routing Pattern

```javascript
async function handleUserRequest(userInput, sessionId) {
  // Step 1: Ask supervisor for routing decision
  const routingDecision = await invokeSupervisorAgent(userInput, sessionId);
  
  // Step 2: Parse routing decision
  const targetAgent = parseRoutingDecision(routingDecision);
  
  // Step 3: Route to appropriate agent
  switch(targetAgent) {
    case 'VetDocAgent':
      return await invokeVetDocAgent(userInput, sessionId);
    case 'PolicyAgent':
      return await invokePolicyAgent(userInput, sessionId);
    case 'direct':
      return routingDecision; // Supervisor handled it
    default:
      return await invokeDefaultAgent(userInput, sessionId);
  }
}
```

### Environment Variables for Lambda

Add to your Lambda function environment:

```yaml
Environment:
  Variables:
    SUPERVISOR_AGENT_ID: !Ref SupervisorAgent
    SUPERVISOR_AGENT_ALIAS_ID: !GetAtt SupervisorAgentAlias.AgentAliasId
    VETDOC_AGENT_ID: !Ref VetDocAgent
    VETDOC_AGENT_ALIAS_ID: !GetAtt VetDocAgentAlias.AgentAliasId
```

### Required IAM Permissions for Lambda

Lambda function needs permission to invoke the supervisor:

```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - bedrock:InvokeAgent
        Resource:
          - !GetAtt SupervisorAgent.AgentArn
          - !Sub '${SupervisorAgent.AgentArn}/*'
```

## Parameters Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SupervisorAgentName` | String | SupervisorAgent | Agent name (add env suffix for multi-env) |
| `SupervisorAgentFoundationModel` | String | anthropic.claude-3-5-haiku-20241022-v1:0 | Foundation model ID |
| `SupervisorAgentInstruction` | String | (see above) | Routing logic and system instruction |
| `SupervisorAgentIdleSessionTTL` | Number | 600 | Session timeout in seconds |

## Outputs Reference

| Output | Description | Use Case |
|--------|-------------|----------|
| `SupervisorAgentId` | Agent ID | Required for invoking supervisor |
| `SupervisorAgentAliasId` | Alias ID | Required for invoking supervisor |
| `SupervisorAgentArn` | Agent ARN | IAM policies, monitoring |
| `SupervisorAgentRoleArn` | IAM Role ARN | Reference, auditing |

## Environment-Specific Configuration

### Development
- **Name**: SupervisorAgent-Dev
- **Purpose**: Testing routing logic
- **TTL**: 600 seconds
- **Model**: Claude 3.5 Haiku

### Staging
- **Name**: SupervisorAgent-Staging
- **Purpose**: Pre-production validation
- **TTL**: 600 seconds
- **Model**: Claude 3.5 Haiku

### Production
- **Name**: SupervisorAgent-Prod
- **Purpose**: Production routing
- **TTL**: 600 seconds
- **Model**: Claude 3.5 Haiku (or Sonnet if needed)

## References

- AWS Bedrock Agents Documentation: https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html
- Claude 3.5 Haiku Model Card: https://www.anthropic.com/claude/haiku
- Multi-Agent Orchestration Patterns: https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent.html
- SAM Template Reference: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html


