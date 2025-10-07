# PET-11: Create VetDocAgent in AWS SAM Template

## Description
Create a new AWS Bedrock Agent resource in SAM template called `VetDocAgent`. This agent will be based on Claude Sonnet 3.5 model and will serve as a veterinary documentation assistant. The model and instruction prompt must be configurable through parameters for easy updates without code changes.

## Business Logic
1. **Agent Definition**: Create Bedrock Agent resource in CloudFormation
2. **Model Configuration**: Use Claude Sonnet 3.5 (anthropic.claude-3-5-sonnet-20241022-v2:0)
3. **Instruction Prompt**: Configurable system instruction for veterinary context
4. **Agent Alias**: Create alias for version management
5. **IAM Roles**: Setup necessary permissions for the agent
6. **No Lambda Functions**: Pure infrastructure definition, no custom Lambda code

## Technical Overview

### Architecture
```
SAM Template → AWS::Bedrock::Agent → VetDocAgent
                         ↓
                  IAM Role with Bedrock permissions
                         ↓
                  Agent Alias (for versioning)
                         ↓
                  Claude Sonnet 3.5 Foundation Model
```

### Components
1. **AWS::Bedrock::Agent** - Main agent resource
2. **AWS::IAM::Role** - Service role for the agent
3. **AWS::Bedrock::AgentAlias** - Agent alias for deployment
4. **Parameters** - Configurable model and prompt
5. **Outputs** - Agent ID and Alias ID for use in Lambda functions

### Agent Configuration
- **Name**: VetDocAgent
- **Foundation Model**: anthropic.claude-3-5-sonnet-20241022-v2:0
- **Instruction**: Configurable system prompt
- **Idle Session TTL**: 600 seconds (10 minutes)
- **User Input**: Enabled

---

## Implementation Steps

### Step 1: Add Configuration Parameters to SAM Template

**What to do:**
Add new parameters for VetDocAgent configuration at the top of template.yaml.

**Update file: `apps/services/template.yaml`**

Add these parameters after the existing `BedrockAgentAliasId` parameter:

```yaml
  # VetDocAgent Configuration
  VetDocAgentName:
    Type: String
    Default: VetDocAgent
    Description: Name for the Veterinary Documentation Agent
  
  VetDocAgentFoundationModel:
    Type: String
    Default: anthropic.claude-3-5-sonnet-20241022-v2:0
    Description: Foundation model for VetDocAgent (Claude Sonnet 3.5)
    AllowedValues:
      - anthropic.claude-3-5-sonnet-20241022-v2:0
      - anthropic.claude-3-5-sonnet-20240620-v1:0
      - anthropic.claude-3-sonnet-20240229-v1:0
  
  VetDocAgentInstruction:
    Type: String
    Default: |
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
    Description: System instruction/prompt for VetDocAgent
  
  VetDocAgentIdleSessionTTL:
    Type: Number
    Default: 600
    MinValue: 60
    MaxValue: 3600
    Description: Idle session timeout in seconds (60-3600)
```

**Important notes:**
- Parameters allow changing model and prompt without code changes
- Default instruction provides context for veterinary documentation
- Model selection restricted to Claude Sonnet variants
- Session TTL configurable for cost optimization

---

### Step 2: Create IAM Role for VetDocAgent

**What to do:**
Create an IAM role that allows the Bedrock Agent to invoke foundation models.

**Update file: `apps/services/template.yaml`**

Add this resource in the Resources section:

```yaml
  VetDocAgentRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-VetDocAgentRole'
      Description: IAM role for VetDocAgent to invoke Bedrock foundation models
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
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Agent
          Value: VetDocAgent
```

**Important notes:**
- Role allows Bedrock service to assume it
- Grants permission to invoke Claude models
- Scoped to prevent unauthorized access
- Tagged for resource management

---

### Step 3: Create VetDocAgent Bedrock Agent

**What to do:**
Create the main Bedrock Agent resource with configurable parameters.

**Update file: `apps/services/template.yaml`**

Add this resource after VetDocAgentRole:

```yaml
  VetDocAgent:
    Type: AWS::Bedrock::Agent
    Properties:
      AgentName: !Ref VetDocAgentName
      Description: Veterinary documentation assistant for Purrsurance pet insurance
      AgentResourceRoleArn: !GetAtt VetDocAgentRole.Arn
      FoundationModel: !Ref VetDocAgentFoundationModel
      Instruction: !Ref VetDocAgentInstruction
      IdleSessionTTLInSeconds: !Ref VetDocAgentIdleSessionTTL
      AutoPrepare: true
      Tags:
        Environment: !Ref Environment
        Service: VetDocAgent
        ManagedBy: SAM
```

**Important notes:**
- `AutoPrepare: true` automatically prepares agent after changes
- All key properties (model, instruction, TTL) are parameterized
- Agent resource role allows model invocation
- Tags help with cost tracking and management

---

### Step 4: Create Agent Alias

**What to do:**
Create an alias for the agent to enable version management and deployment.

**Update file: `apps/services/template.yaml`**

Add this resource after VetDocAgent:

```yaml
  VetDocAgentAlias:
    Type: AWS::Bedrock::AgentAlias
    Properties:
      AgentId: !Ref VetDocAgent
      AgentAliasName: !Sub '${Environment}-alias'
      Description: !Sub 'Agent alias for ${Environment} environment'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Agent
          Value: VetDocAgent
```

**Important notes:**
- Alias name includes environment for easy identification
- Enables safe deployments with version rollback
- Required for invoking the agent
- Each environment gets its own alias

---

### Step 5: Add Outputs for VetDocAgent

**What to do:**
Add outputs to expose agent information for use in Lambda functions and documentation.

**Update file: `apps/services/template.yaml`**

Add these outputs at the end of the Outputs section:

```yaml
  VetDocAgentId:
    Description: "VetDocAgent Bedrock Agent ID"
    Value: !Ref VetDocAgent
    Export:
      Name: !Sub '${AWS::StackName}-VetDocAgentId'
  
  VetDocAgentAliasId:
    Description: "VetDocAgent Alias ID"
    Value: !GetAtt VetDocAgentAlias.AgentAliasId
    Export:
      Name: !Sub '${AWS::StackName}-VetDocAgentAliasId'
  
  VetDocAgentArn:
    Description: "VetDocAgent ARN"
    Value: !GetAtt VetDocAgent.AgentArn
    Export:
      Name: !Sub '${AWS::StackName}-VetDocAgentArn'
  
  VetDocAgentRoleArn:
    Description: "VetDocAgent IAM Role ARN"
    Value: !GetAtt VetDocAgentRole.Arn
```

**Important notes:**
- Exports allow cross-stack references
- Agent ID and Alias ID needed for Lambda invocations
- ARNs useful for IAM policies and monitoring
- Stack name prefix prevents naming conflicts

---

### Step 6: Update samconfig.toml with VetDocAgent Parameters

**What to do:**
Add VetDocAgent parameters to deployment configuration for different environments.

**Update file: `apps/services/samconfig.toml`**

Update the `parameter_overrides` in each environment section:

**For default environment (line 23):**
```toml
parameter_overrides = "Environment=\"dev\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"TSTALIASID\" VetDocAgentName=\"VetDocAgent\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\""
```

**For dev environment (line 48):**
```toml
parameter_overrides = "Environment=\"dev\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"TSTALIASID\" VetDocAgentName=\"VetDocAgent-Dev\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\""
```

**For staging environment (line 61):**
```toml
parameter_overrides = "Environment=\"staging\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"HCIMPAKGK2\" VetDocAgentName=\"VetDocAgent-Staging\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\""
```

**For prod environment (line 74):**
```toml
parameter_overrides = "Environment=\"prod\" BedrockAgentId=\"OLHUNALEOH\" BedrockAgentAliasId=\"HCIMPAKGK2\" VetDocAgentName=\"VetDocAgent-Prod\" VetDocAgentFoundationModel=\"anthropic.claude-3-5-sonnet-20241022-v2:0\" VetDocAgentIdleSessionTTL=\"600\""
```

**Important notes:**
- Each environment has unique agent name
- Can use different models per environment if needed
- Instruction can be overridden at deploy time
- Parameters on single line for TOML compatibility

---

### Step 7: Create Documentation

**What to do:**
Create comprehensive documentation for VetDocAgent configuration.

**Create new file: `apps/services/VetDocAgent-README.md`**

```markdown
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
- **Model ID**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Alternative**: `anthropic.claude-3-5-sonnet-20240620-v1:0`

To change the model, update the `VetDocAgentFoundationModel` parameter in samconfig.toml or at deployment.

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

**Option 1: Override at deployment time**

```bash
sam deploy --parameter-overrides VetDocAgentInstruction="Your custom instruction here"
```

**Option 2: Update samconfig.toml**

Add to parameter_overrides:
```toml
parameter_overrides = "... VetDocAgentInstruction=\"Your custom instruction\""
```

**Option 3: Update template.yaml default**

Change the Default value in the Parameters section.

### Session Configuration

- **Idle Session TTL**: 600 seconds (10 minutes) by default
- **Range**: 60-3600 seconds
- **Configure via**: `VetDocAgentIdleSessionTTL` parameter

## Deployment

### Prerequisites
- AWS SAM CLI installed
- AWS account with Bedrock access
- Appropriate IAM permissions
- Bedrock model access enabled for Claude models

### Deploy Agent

```bash
cd apps/services

# Build (no code to build, but validates template)
sam build

# Deploy to dev
sam deploy --config-env dev

# Deploy to staging
sam deploy --config-env staging

# Deploy to production
sam deploy --config-env prod
```

### Get Agent Information

After deployment, get the agent details:

```bash
# Get all outputs
sam list stack-outputs --stack-name agent-operator-dev

# Get specific output
aws cloudformation describe-stacks \
  --stack-name agent-operator-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`VetDocAgentId`].OutputValue' \
  --output text
```

## Using VetDocAgent

### From Lambda Function

To invoke VetDocAgent from a Lambda function, use the Agent ID and Alias ID from stack outputs:

```javascript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

const command = new InvokeAgentCommand({
  agentId: process.env.VETDOC_AGENT_ID,
  agentAliasId: process.env.VETDOC_AGENT_ALIAS_ID,
  sessionId: 'unique-session-id',
  inputText: 'What vaccinations are required for a puppy?'
});

const response = await client.send(command);
```

### Environment Variables for Lambda

Add to your Lambda function environment:

```yaml
Environment:
  Variables:
    VETDOC_AGENT_ID: !Ref VetDocAgent
    VETDOC_AGENT_ALIAS_ID: !GetAtt VetDocAgentAlias.AgentAliasId
```

### Required IAM Permissions for Lambda

Lambda function needs permission to invoke the agent:

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

## Environment-Specific Configuration

### Development
- **Name**: VetDocAgent-Dev
- **Purpose**: Testing and development
- **TTL**: 600 seconds
- **Model**: Latest Claude Sonnet 3.5

### Staging
- **Name**: VetDocAgent-Staging
- **Purpose**: Pre-production validation
- **TTL**: 600 seconds
- **Model**: Latest Claude Sonnet 3.5

### Production
- **Name**: VetDocAgent-Prod
- **Purpose**: Production workloads
- **TTL**: 600 seconds
- **Model**: Stable Claude Sonnet 3.5

## Cost Considerations

### Bedrock Pricing (us-east-1)
- **Claude 3.5 Sonnet**: ~$3.00 per 1M input tokens, ~$15.00 per 1M output tokens
- **Session Storage**: Included
- **Agent Runtime**: No additional charge

### Estimated Monthly Cost
- 10K requests/month: ~$5-20
- 100K requests/month: ~$50-200
- Depends on conversation length and complexity

### Cost Optimization
1. Set appropriate `IdleSessionTTL` (shorter = lower cost)
2. Use concise instructions to reduce token usage
3. Monitor usage via CloudWatch
4. Consider using Claude 3 Sonnet for non-critical workloads

## Monitoring

### CloudWatch Logs

Agent interactions are logged automatically:

```bash
# View logs
aws logs tail /aws/bedrock/agents/VetDocAgent --follow
```

### Metrics to Monitor
- Invocation count
- Response time
- Error rate
- Token usage
- Session duration

### Alarms

Set up CloudWatch alarms for:
- High error rate
- Unusual invocation patterns
- Token limit exceeded
- Response time degradation

## Troubleshooting

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

### Model Not Available
**Cause**: Bedrock model access not enabled
**Solution**: 
1. Go to AWS Bedrock console
2. Request model access for Claude models
3. Wait for approval (usually instant)

### Session Timeout
**Cause**: Idle session TTL too short
**Solution**: Increase `VetDocAgentIdleSessionTTL` parameter

## Updating the Agent

### Update Instruction Prompt

```bash
# Option 1: Via parameter override
sam deploy --parameter-overrides VetDocAgentInstruction="New instruction"

# Option 2: Update template.yaml default and redeploy
# Edit template.yaml, then:
sam build
sam deploy
```

### Change Foundation Model

```bash
sam deploy --parameter-overrides \
  VetDocAgentFoundationModel="anthropic.claude-3-5-sonnet-20240620-v1:0"
```

### Update Session TTL

```bash
sam deploy --parameter-overrides VetDocAgentIdleSessionTTL="900"
```

## Security Considerations

1. **IAM Roles**: Agent role follows least privilege
2. **Resource Scoping**: Agent only accesses allowed models
3. **Session Isolation**: Each session is isolated
4. **Audit Trail**: All interactions logged to CloudWatch
5. **Encryption**: Data encrypted at rest and in transit

## Future Enhancements

- [ ] Add knowledge base integration for RAG
- [ ] Configure action groups for Lambda functions
- [ ] Add prompt templates for common scenarios
- [ ] Implement agent guardrails
- [ ] Add memory/conversation history
- [ ] Create agent evaluation metrics

## References

- [AWS Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Claude 3.5 Sonnet Model Card](https://www.anthropic.com/claude/sonnet)
- [SAM Template Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html)
- [Bedrock Agent CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-agent.html)
```

---

## Acceptance Criteria

- [ ] VetDocAgent parameters added to template.yaml
- [ ] IAM role created with correct permissions
- [ ] Bedrock Agent resource created
- [ ] Agent Alias resource created
- [ ] Outputs added for Agent ID and Alias ID
- [ ] samconfig.toml updated with parameters
- [ ] Documentation created
- [ ] Template validates successfully
- [ ] Agent deploys to AWS without errors
- [ ] Agent can be invoked successfully
- [ ] All parameters are configurable
- [ ] Different names for dev/staging/prod environments

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
5. [ ] Correct foundation model configured
6. [ ] IAM role created successfully

### Functional Testing
1. [ ] Agent can be invoked via AWS CLI
2. [ ] Agent responds to test queries
3. [ ] Instruction prompt is followed
4. [ ] Session management works
5. [ ] Agent alias routing works

### Configuration Testing
1. [ ] Can update instruction via parameter
2. [ ] Can change model via parameter
3. [ ] Can adjust TTL via parameter
4. [ ] Parameters override defaults correctly
5. [ ] Environment-specific names work

### AWS Console Verification
1. [ ] Agent appears in Bedrock Agents console
2. [ ] Agent shows correct model
3. [ ] Agent instruction is correct
4. [ ] Alias is created and active
5. [ ] IAM role attached correctly

---

## Important Notes

### CloudFormation Resource Considerations

1. **Agent Preparation**: `AutoPrepare: true` automatically prepares agent
2. **Update Behavior**: Changes to instruction trigger agent update and re-prepare
3. **Deletion Protection**: Consider adding DeletionPolicy: Retain for production
4. **Resource Limits**: Check AWS quotas for agents per region

### Model Selection

1. **Latest Model**: Use `anthropic.claude-3-5-sonnet-20241022-v2:0` for best performance
2. **Fallback Model**: `anthropic.claude-3-5-sonnet-20240620-v1:0` for stability
3. **Model Access**: Ensure Bedrock model access is enabled
4. **Regional Availability**: Claude 3.5 Sonnet available in most regions

### Instruction Best Practices

1. **Clear Role Definition**: Specify what the agent does
2. **Scope Boundaries**: Define what it should/shouldn't do
3. **Tone and Style**: Set expected communication style
4. **Safety Guidelines**: Include disclaimers for medical advice
5. **Context Awareness**: Mention the Purrsurance domain

### Cost Management

1. **Session TTL**: Shorter = lower cost but worse UX
2. **Model Selection**: Sonnet 3.5 is premium priced
3. **Instruction Length**: Longer instructions = more tokens
4. **Monitoring**: Set up billing alarms
5. **Optimization**: Consider prompt optimization techniques

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
aws, bedrock, agent, claude, infrastructure, sam, cloudformation, ai

## Dependencies
- AWS SAM CLI installed
- AWS account with Bedrock access
- Bedrock model access enabled for Claude
- Appropriate IAM permissions

## Files to Modify

1. `apps/services/template.yaml` - Add VetDocAgent resources
2. `apps/services/samconfig.toml` - Add parameter overrides

## Files to Create

1. `apps/services/VetDocAgent-README.md` - Documentation

## External Resources

- [AWS::Bedrock::Agent](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-agent.html)
- [AWS::Bedrock::AgentAlias](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-agentalias.html)
- [Bedrock Agents User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Claude 3.5 Sonnet](https://www.anthropic.com/claude/sonnet)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

## Success Criteria Summary

**Infrastructure:**
1. VetDocAgent resource created in template.yaml
2. IAM role with correct permissions
3. Agent alias for version management
4. All parameters configurable

**Configuration:**
1. Model: Claude Sonnet 3.5
2. Instruction: Veterinary documentation prompt
3. Session TTL: Configurable
4. Environment-specific naming

**Deployment:**
1. Template validates successfully
2. Deploys to AWS without errors
3. Agent appears in Bedrock console
4. Outputs show Agent ID and Alias ID

**Documentation:**
1. Complete README with usage examples
2. Parameter reference documented
3. Cost considerations included
4. Troubleshooting guide provided

**No Lambda Functions:**
1. Pure infrastructure definition
2. No custom code required
3. Only template and configuration changes
4. Agent managed entirely by AWS Bedrock

