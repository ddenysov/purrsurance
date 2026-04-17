# PET-12: Create SupervisorAgent in AWS SAM Template

## Description
Create a new AWS Bedrock Agent resource in SAM template called `SupervisorAgent`. This agent will be based on Claude 3.5 Haiku model and will serve as a supervisor with routing capabilities to direct user requests to appropriate specialized agents. The model and instruction prompt must be configurable through parameters for easy updates without code changes.

## Business Logic
1. **Agent Definition**: Create Bedrock Agent resource in CloudFormation
2. **Model Configuration**: Use Claude 3.5 Haiku (anthropic.claude-3-5-haiku-20241022-v1:0) for fast routing
3. **Instruction Prompt**: Configurable system instruction for supervisor/routing context
4. **Agent Alias**: Create alias for version management
5. **IAM Roles**: Setup necessary permissions for the agent
6. **No Lambda Functions**: Pure infrastructure definition, no custom Lambda code

## Technical Overview

### Architecture
```
SAM Template → AWS::Bedrock::Agent → SupervisorAgent
                         ↓
                  IAM Role with Bedrock permissions
                         ↓
                  Agent Alias (for versioning)
                         ↓
                  Claude 3.5 Haiku Foundation Model
                         ↓
                  Routes to specialized agents (VetDocAgent, etc.)
```

### Components
1. **AWS::Bedrock::Agent** - Main supervisor agent resource
2. **AWS::IAM::Role** - Service role for the agent
3. **AWS::Bedrock::AgentAlias** - Agent alias for deployment
4. **Parameters** - Configurable model and prompt
5. **Outputs** - Agent ID and Alias ID for use in Lambda functions

### Agent Configuration
- **Name**: SupervisorAgent
- **Foundation Model**: anthropic.claude-3-5-haiku-20241022-v1:0 (fast, cost-effective)
- **Instruction**: Configurable routing/supervision prompt
- **Idle Session TTL**: 600 seconds (10 minutes)
- **User Input**: Enabled
- **Purpose**: Route requests to appropriate specialized agents

---

## Implementation Steps

### Step 1: Add Configuration Parameters to SAM Template

**What to do:**
Add new parameters for SupervisorAgent configuration at the top of template.yaml.

**Update file: `apps/services/template.yaml`**

Add these parameters after the existing VetDocAgent parameters:

```yaml
  # SupervisorAgent Configuration
  SupervisorAgentName:
    Type: String
    Default: SupervisorAgent
    Description: Name for the Supervisor/Router Agent
  
  SupervisorAgentFoundationModel:
    Type: String
    Default: anthropic.claude-3-5-haiku-20241022-v1:0
    Description: Foundation model for SupervisorAgent (Claude 3.5 Haiku for fast routing)
    AllowedValues:
      - anthropic.claude-3-5-haiku-20241022-v1:0
      - anthropic.claude-3-haiku-20240307-v1:0
      - anthropic.claude-3-5-sonnet-20241022-v2:0
  
  SupervisorAgentInstruction:
    Type: String
    Default: |
      You are SupervisorAgent, an intelligent request router for the Вет Експерт pet insurance system.
      
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
    Description: System instruction/prompt for SupervisorAgent routing logic
  
  SupervisorAgentIdleSessionTTL:
    Type: Number
    Default: 600
    MinValue: 60
    MaxValue: 3600
    Description: Idle session timeout in seconds for SupervisorAgent (60-3600)
```

**Important notes:**
- Haiku model selected for fast, cost-effective routing decisions
- Instruction includes routing logic for different agent types
- Can upgrade to Sonnet if more complex routing needed
- Session TTL configurable for cost optimization

---

### Step 2: Create IAM Role for SupervisorAgent

**What to do:**
Create an IAM role that allows the Bedrock Agent to invoke foundation models and potentially other agents.

**Update file: `apps/services/template.yaml`**

Add this resource in the Resources section:

```yaml
  SupervisorAgentRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-SupervisorAgentRole'
      Description: IAM role for SupervisorAgent to invoke Bedrock foundation models and route to other agents
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: bedrock.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId
              ArnLike:
                aws:SourceArn: !Sub 'arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:agent/*'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonBedrockFullAccess
      Policies:
        - PolicyName: BedrockModelInvokePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:InvokeModel
                  - bedrock:InvokeModelWithResponseStream
                Resource:
                  - !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/anthropic.claude-*'
        - PolicyName: BedrockAgentInvokePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:InvokeAgent
                Resource:
                  - !Sub 'arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:agent/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Agent
          Value: SupervisorAgent
        - Key: Role
          Value: Supervisor
```

**Important notes:**
- Role allows invoking both models and other agents
- Permissions for routing to specialized agents
- Scoped to prevent unauthorized access
- Tagged for resource management and cost tracking

---

### Step 3: Create SupervisorAgent Bedrock Agent

**What to do:**
Create the main Bedrock Agent resource with configurable parameters for routing.

**Update file: `apps/services/template.yaml`**

Add this resource after SupervisorAgentRole:

```yaml
  SupervisorAgent:
    Type: AWS::Bedrock::Agent
    Properties:
      AgentName: !Ref SupervisorAgentName
      Description: Supervisor agent with routing capabilities for Вет Експерт system
      AgentResourceRoleArn: !GetAtt SupervisorAgentRole.Arn
      FoundationModel: !Ref SupervisorAgentFoundationModel
      Instruction: !Ref SupervisorAgentInstruction
      IdleSessionTTLInSeconds: !Ref SupervisorAgentIdleSessionTTL
      AutoPrepare: true
      Tags:
        Environment: !Ref Environment
        Service: SupervisorAgent
        ManagedBy: SAM
        Purpose: Routing
```

**Important notes:**
- `AutoPrepare: true` automatically prepares agent after changes
- All key properties (model, instruction, TTL) are parameterized
- Haiku model provides fast routing at lower cost
- Agent resource role allows model invocation and agent routing
- Tags help with cost tracking and identifying routing layer

---

### Step 4: Create Agent Alias

**What to do:**
Create an alias for the supervisor agent to enable version management and deployment.

**Update file: `apps/services/template.yaml`**

Add this resource after SupervisorAgent:

```yaml
  SupervisorAgentAlias:
    Type: AWS::Bedrock::AgentAlias
    Properties:
      AgentId: !Ref SupervisorAgent
      AgentAliasName: !Sub '${Environment}-supervisor-alias'
      Description: !Sub 'Supervisor agent alias for ${Environment} environment'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Agent
          Value: SupervisorAgent
        - Key: Role
          Value: Supervisor
```

**Important notes:**
- Alias name includes "supervisor" for easy identification
- Enables safe deployments with version rollback
- Required for invoking the agent
- Each environment gets its own supervisor alias

---

### Step 5: Add Outputs for SupervisorAgent

**What to do:**
Add outputs to expose supervisor agent information for use in Lambda functions and documentation.

**Update file: `apps/services/template.yaml`**

Add these outputs at the end of the Outputs section:

```yaml
  SupervisorAgentId:
    Description: "SupervisorAgent Bedrock Agent ID"
    Value: !Ref SupervisorAgent
    Export:
      Name: !Sub '${AWS::StackName}-SupervisorAgentId'
  
  SupervisorAgentAliasId:
    Description: "SupervisorAgent Alias ID"
    Value: !GetAtt SupervisorAgentAlias.AgentAliasId
    Export:
      Name: !Sub '${AWS::StackName}-SupervisorAgentAliasId'
  
  SupervisorAgentArn:
    Description: "SupervisorAgent ARN"
    Value: !GetAtt SupervisorAgent.AgentArn
    Export:
      Name: !Sub '${AWS::StackName}-SupervisorAgentArn'
  
  SupervisorAgentRoleArn:
    Description: "SupervisorAgent IAM Role ARN"
    Value: !GetAtt SupervisorAgentRole.Arn
```

**Important notes:**
- Exports allow cross-stack references
- Agent ID and Alias ID needed for Lambda invocations
- ARNs useful for IAM policies and monitoring
- Stack name prefix prevents naming conflicts

---

### Step 6: Update samconfig.toml with SupervisorAgent Parameters

**What to do:**
Add SupervisorAgent parameters to deployment configuration for different environments.

**Update file: `apps/services/samconfig.toml`**

Update the `parameter_overrides` in each environment section:

**For default environment (line 23):**
```toml
parameter_overrides = "Environment=\"dev\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"TSTALIASID\" VetDocAgentName=\"VetDocAgent\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\" SupervisorAgentName=\"SupervisorAgent\" SupervisorAgentFoundationModel=\"anthropic.claude-3-5-haiku-20241022-v1:0\" SupervisorAgentIdleSessionTTL=\"600\""
```

**For dev environment (line 48):**
```toml
parameter_overrides = "Environment=\"dev\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"TSTALIASID\" VetDocAgentName=\"VetDocAgent-Dev\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\" SupervisorAgentName=\"SupervisorAgent-Dev\" SupervisorAgentFoundationModel=\"anthropic.claude-3-5-haiku-20241022-v1:0\" SupervisorAgentIdleSessionTTL=\"600\""
```

**For staging environment (line 61):**
```toml
parameter_overrides = "Environment=\"staging\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"HCIMPAKGK2\" VetDocAgentName=\"VetDocAgent-Staging\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\" SupervisorAgentName=\"SupervisorAgent-Staging\" SupervisorAgentFoundationModel=\"anthropic.claude-3-5-haiku-20241022-v1:0\" SupervisorAgentIdleSessionTTL=\"600\""
```

**For prod environment (line 74):**
```toml
parameter_overrides = "Environment=\"prod\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"HCIMPAKGK2\" VetDocAgentName=\"VetDocAgent-Prod\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\" SupervisorAgentName=\"SupervisorAgent-Prod\" SupervisorAgentFoundationModel=\"anthropic.claude-3-5-haiku-20241022-v1:0\" SupervisorAgentIdleSessionTTL=\"600\""
```

**Important notes:**
- Each environment has unique supervisor agent name
- Haiku model used by default for cost-effective routing
- Can upgrade to Sonnet for complex routing scenarios
- Instruction can be overridden at deploy time
- Parameters on single line for TOML compatibility

---

### Step 7: Create Documentation

**What to do:**
Create comprehensive documentation for SupervisorAgent configuration and routing logic.

**Create new file: `apps/services/SupervisorAgent-README.md`**

```markdown
# SupervisorAgent - Request Router with Supervision

AWS Bedrock Agent for intelligent request routing in the Вет Експерт pet insurance system.

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
You are SupervisorAgent, an intelligent request router for the Вет Експерт pet insurance system.

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

## Cost Considerations

### Bedrock Pricing (us-east-1)

**Claude 3.5 Haiku (Recommended):**
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens

**Claude 3.5 Sonnet (If needed):**
- **Input**: $3.00 per 1M tokens
- **Output**: $15.00 per 1M tokens

### Estimated Monthly Cost

**Assuming 100K routing decisions/month:**

With Haiku:
- Average tokens per routing: ~200 input, ~50 output
- Monthly tokens: 20M input, 5M output
- **Cost**: ~$11/month

With Sonnet:
- Same token usage
- **Cost**: ~$135/month

**Savings**: ~92% by using Haiku for routing

### Cost Optimization

1. Use Haiku for routing (sufficient for most cases)
2. Keep routing prompts concise
3. Set appropriate `IdleSessionTTL`
4. Monitor routing patterns
5. Cache frequent routing decisions if possible

## Monitoring

### CloudWatch Logs

Supervisor agent interactions are logged automatically:

```bash
# View logs
aws logs tail /aws/bedrock/agents/SupervisorAgent --follow
```

### Metrics to Monitor

- **Routing decisions per agent**
- **Routing accuracy** (manual validation)
- **Response time**
- **Error rate**
- **Token usage**
- **Session duration**

### Routing Analytics

Track routing patterns:
```javascript
const routingMetrics = {
  vetdoc: 0,
  policy: 0,
  direct: 0,
  unknown: 0
};

// Increment after each routing decision
routingMetrics[targetAgent]++;
```

### Alarms

Set up CloudWatch alarms for:
- High error rate in routing
- Unusual distribution shifts
- Response time degradation
- Token limit exceeded

## Troubleshooting

### Incorrect Routing

**Cause**: Instruction prompt not clear enough
**Solution**: 
- Review routing examples in logs
- Update instruction with better examples
- Consider upgrading to Sonnet for complex cases

### Agent Not Found

**Cause**: Agent not deployed or incorrect ID
**Solution**: 
```bash
sam deploy --config-env dev
aws bedrock-agent list-agents
```

### Permission Denied

**Cause**: Lambda doesn't have invoke permission
**Solution**: Add IAM policy to Lambda role (see above)

### Slow Routing

**Cause**: Using Sonnet instead of Haiku
**Solution**: Switch to Haiku model (parameter override)

### Session Timeout

**Cause**: Idle session TTL too short
**Solution**: Increase `SupervisorAgentIdleSessionTTL` parameter

## Routing Best Practices

### 1. Clear Categories

Define clear, non-overlapping categories:
- Medical/Veterinary
- Insurance/Policy
- General/Navigation

### 2. Examples in Prompt

Include example queries for each category:
```
Example medical queries:
- "My dog has a fever"
- "What vaccines does a puppy need?"

Example insurance queries:
- "Does my policy cover surgery?"
- "How do I file a claim?"
```

### 3. Fallback Strategy

Define what to do with ambiguous requests:
- Default to general agent
- Ask clarifying question
- Route to most likely specialist

### 4. Routing Confidence

Have supervisor indicate confidence:
```json
{
  "target_agent": "VetDocAgent",
  "confidence": "high",
  "reason": "Medical symptom query"
}
```

### 5. Learning from Mistakes

Log routing decisions and corrections:
- Track when users override routing
- Periodically review and update prompt
- Add edge cases to instruction

## Advanced Routing Patterns

### Multi-Agent Collaboration

For complex queries needing multiple agents:

```javascript
async function handleComplexQuery(query, sessionId) {
  const routing = await supervisorAgent(query);
  
  if (routing.agents.length > 1) {
    // Query requires multiple specialists
    const results = await Promise.all(
      routing.agents.map(agent => invokeAgent(agent, query, sessionId))
    );
    
    // Aggregate results
    return aggregateResponses(results);
  }
  
  return invokeSingleAgent(routing.agents[0], query, sessionId);
}
```

### Contextual Routing

Use conversation history for better routing:

```javascript
const context = await getConversationContext(sessionId);
const routingDecision = await supervisorAgent({
  query: userInput,
  history: context,
  previousAgent: context.lastAgent
});
```

### Dynamic Agent Discovery

Automatically discover available agents:

```javascript
const availableAgents = await listBedrockAgents();
const routingPrompt = generateRoutingPrompt(availableAgents);
await updateSupervisorInstruction(routingPrompt);
```

## Updating the Agent

### Update Routing Logic

```bash
# Option 1: Via parameter override
sam deploy --parameter-overrides SupervisorAgentInstruction="Updated routing logic"

# Option 2: Update template.yaml default and redeploy
sam build
sam deploy
```

### Change Foundation Model

```bash
# Upgrade to Sonnet for complex routing
sam deploy --parameter-overrides \
  SupervisorAgentFoundationModel="anthropic.claude-3-5-sonnet-20241022-v2:0"

# Downgrade to older Haiku
sam deploy --parameter-overrides \
  SupervisorAgentFoundationModel="anthropic.claude-3-haiku-20240307-v1:0"
```

### Update Session TTL

```bash
sam deploy --parameter-overrides SupervisorAgentIdleSessionTTL="900"
```

## Security Considerations

1. **IAM Roles**: Supervisor role follows least privilege
2. **Resource Scoping**: Agent only accesses allowed models and agents
3. **Session Isolation**: Each session is isolated
4. **Audit Trail**: All routing decisions logged to CloudWatch
5. **Encryption**: Data encrypted at rest and in transit
6. **Agent Permissions**: Supervisor can only invoke authorized agents

## Integration Examples

### With API Gateway

```yaml
ApiGatewayIntegration:
  Type: AWS::ApiGatewayV2::Integration
  Properties:
    IntegrationType: AWS_PROXY
    IntegrationUri: !GetAtt RouterFunction.Arn
    
RouterFunction:
  Type: AWS::Serverless::Function
  Properties:
    Environment:
      Variables:
        SUPERVISOR_AGENT_ID: !Ref SupervisorAgent
        SUPERVISOR_AGENT_ALIAS_ID: !GetAtt SupervisorAgentAlias.AgentAliasId
```

### With Step Functions

```yaml
StateMachine:
  Type: AWS::Serverless::StateMachine
  Properties:
    Definition:
      StartAt: RouteRequest
      States:
        RouteRequest:
          Type: Task
          Resource: !GetAtt SupervisorAgent.AgentArn
          Next: ProcessRouting
```

### With EventBridge

```yaml
RouterRule:
  Type: AWS::Events::Rule
  Properties:
    EventPattern:
      source:
        - vet-expert.chat
      detail-type:
        - UserMessage
    Targets:
      - Arn: !GetAtt RouterFunction.Arn
```

## Future Enhancements

- [ ] Add machine learning for routing optimization
- [ ] Implement routing confidence scores
- [ ] Add A/B testing for routing strategies
- [ ] Create routing analytics dashboard
- [ ] Implement automatic prompt optimization
- [ ] Add multi-turn routing conversations
- [ ] Integrate with knowledge base for context
- [ ] Create routing performance benchmarks

## References

- [AWS Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Claude 3.5 Haiku Model Card](https://www.anthropic.com/claude/haiku)
- [Multi-Agent Orchestration Patterns](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent.html)
- [SAM Template Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
```

---

## Acceptance Criteria

- [ ] SupervisorAgent parameters added to template.yaml
- [ ] IAM role created with correct permissions (including agent invocation)
- [ ] Bedrock Agent resource created with routing instruction
- [ ] Agent Alias resource created
- [ ] Outputs added for Agent ID and Alias ID
- [ ] samconfig.toml updated with parameters for all environments
- [ ] Documentation created with routing examples
- [ ] Template validates successfully
- [ ] Agent deploys to AWS without errors
- [ ] Agent can be invoked successfully
- [ ] Routing logic is configurable
- [ ] Model selection is configurable
- [ ] Different names for dev/staging/prod environments
- [ ] Haiku model configured by default
- [ ] IAM permissions allow invoking other agents

---

## Testing Checklist

### Template Validation
1. [ ] `sam validate` passes
2. [ ] `sam build` completes successfully
3. [ ] No syntax errors in YAML
4. [ ] Parameters have valid defaults
5. [ ] Resource dependencies correct

### Deployment Testing
1. [ ] Deploy to dev environment succeeds
2. [ ] Agent ID appears in outputs
3. [ ] Agent Alias ID appears in outputs
4. [ ] Agent visible in Bedrock console
5. [ ] Correct foundation model configured (Haiku)
6. [ ] IAM role created successfully
7. [ ] Role has permissions to invoke other agents

### Functional Testing
1. [ ] Agent can be invoked via AWS CLI
2. [ ] Agent responds to routing requests
3. [ ] Routing instruction is followed
4. [ ] Agent correctly identifies medical queries
5. [ ] Agent correctly identifies insurance queries
6. [ ] Agent handles general queries directly
7. [ ] Session management works
8. [ ] Agent alias routing works

### Routing Logic Testing
1. [ ] Medical query routes to VetDocAgent
2. [ ] Insurance query routes to PolicyAgent
3. [ ] General query handled directly
4. [ ] Ambiguous query has fallback behavior
5. [ ] Routing response is parseable
6. [ ] Routing confidence indicated (if applicable)

### Configuration Testing
1. [ ] Can update instruction via parameter
2. [ ] Can change model from Haiku to Sonnet
3. [ ] Can adjust TTL via parameter
4. [ ] Parameters override defaults correctly
5. [ ] Environment-specific names work

### AWS Console Verification
1. [ ] Agent appears in Bedrock Agents console
2. [ ] Agent shows correct model (Haiku)
3. [ ] Agent instruction displays routing logic
4. [ ] Alias is created and active
5. [ ] IAM role attached correctly
6. [ ] Role has agent invocation permissions

---

## Important Notes

### Model Selection Rationale

**Why Haiku for Supervisor:**
1. **Speed**: Routing needs to be fast (< 1 second)
2. **Cost**: Routing happens on every request
3. **Sufficiency**: Classification doesn't need advanced reasoning
4. **Reliability**: Haiku is very consistent for structured tasks

**When to Use Sonnet:**
1. Complex multi-criteria routing decisions
2. Need to analyze conversation context deeply
3. Ambiguous queries requiring nuanced understanding
4. Routing based on sentiment or intent analysis

### Routing Architecture

**Single-Stage Routing (Current):**
```
User → Supervisor → Specialist
```

**Multi-Stage Routing (Future):**
```
User → L1 Supervisor → L2 Supervisor → Specialist
```

### IAM Permissions

The SupervisorAgent role includes:
1. Permission to invoke foundation models (for its own operation)
2. Permission to invoke other Bedrock agents (for routing)
3. Scoped to account and region for security

### Cost Impact

With 100K requests/month:
- **Supervisor (Haiku)**: ~$11/month
- **Specialists (Sonnet)**: ~$50-200/month
- **Total System**: ~$61-211/month
- **Without Routing**: Same (no overhead if specialist chosen correctly)

The supervisor adds minimal cost but ensures correct specialist selection.

---

## Priority
High

## Estimated Time
2-3 hours

## Created
2025-10-07

## Assignee
AI Agent / Dmytro

## Labels
aws, bedrock, agent, claude, haiku, infrastructure, sam, cloudformation, ai, routing, supervisor

## Dependencies
- AWS SAM CLI installed
- AWS account with Bedrock access
- Bedrock model access enabled for Claude Haiku
- Appropriate IAM permissions
- VetDocAgent already deployed (for routing target)

## Files to Modify

1. `apps/services/template.yaml` - Add SupervisorAgent resources
2. `apps/services/samconfig.toml` - Add parameter overrides

## Files to Create

1. `apps/services/SupervisorAgent-README.md` - Documentation

## External Resources

- [AWS::Bedrock::Agent](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-agent.html)
- [AWS::Bedrock::AgentAlias](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-agentalias.html)
- [Bedrock Agents User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Claude 3.5 Haiku](https://www.anthropic.com/claude/haiku)
- [Multi-Agent Orchestration](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent.html)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

## Success Criteria Summary

**Infrastructure:**
1. SupervisorAgent resource created in template.yaml
2. IAM role with permissions for models and agent invocation
3. Agent alias for version management
4. All parameters configurable

**Configuration:**
1. Model: Claude 3.5 Haiku (fast, cost-effective)
2. Instruction: Routing logic with clear categories
3. Session TTL: Configurable
4. Environment-specific naming

**Deployment:**
1. Template validates successfully
2. Deploys to AWS without errors
3. Agent appears in Bedrock console
4. Outputs show Agent ID and Alias ID

**Documentation:**
1. Complete README with routing examples
2. Parameter reference documented
3. Cost comparison (Haiku vs Sonnet)
4. Routing patterns and best practices
5. Integration examples

**No Lambda Functions:**
1. Pure infrastructure definition
2. No custom code required
3. Only template and configuration changes
4. Agent managed entirely by AWS Bedrock

**Routing Capability:**
1. Can analyze requests and determine target agent
2. Handles general queries directly
3. Provides clear routing decisions
4. Configurable routing logic

