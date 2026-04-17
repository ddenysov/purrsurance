# Agent Vet Doctor

Veterinary Doctor Agent for Вет Експерт pet insurance system. This agent provides preliminary diagnostic assessments for pets by gathering symptom information and providing educated recommendations.

## Overview

The Vet Doctor Agent is an AI-powered veterinary assistant that:
- Gathers comprehensive information about pet symptoms
- Asks clarifying questions when information is incomplete
- Provides preliminary diagnostic assessments
- Recommends appropriate actions (monitor, schedule vet visit, emergency care)
- Always emphasizes the importance of professional veterinary examination

## Architecture

This agent uses AWS Bedrock with Claude 3.5 Haiku for conversational AI capabilities:

- **Foundation Model**: Claude 3.5 Haiku (fast responses, good for diagnostic conversations)
- **Session Management**: 900 seconds (15 minutes) idle timeout
- **Action Groups**: Uses the `RecommendDoctorVisit` tool to record and publish visit recommendations

## Project Structure

```
agent-vet-doctor/
├── template.yaml           # CloudFormation/SAM template
├── samconfig.toml          # SAM deployment configuration
├── instruction.txt         # Agent system prompt (can be large, no size limit)
├── deploy.sh               # Deployment script that reads instruction.txt
├── update-instruction.sh   # Fast instruction-only update via AWS CLI
├── Makefile                # Build and deployment commands
└── README.md               # This file
```

**Key files:**
- `instruction.txt` - Contains the full agent prompt. Edit this to change agent behavior.
- `deploy.sh` - Full deployment: reads `instruction.txt`, deploys CloudFormation, updates instruction via AWS CLI.
- `update-instruction.sh` - Fast update: only updates instruction via AWS CLI (no CloudFormation).
- `template.yaml` - Infrastructure as Code for the Bedrock Agent.

## Features

### Information Gathering

The agent systematically collects:
- Pet type, breed, and age
- Observed symptoms (detailed)
- Duration and severity
- Behavioral changes
- Previous health issues
- Current medications

### Intelligent Questioning

- Asks clarifying questions for missing information
- Adapts questions based on symptoms described
- Efficient but thorough information collection

### Preliminary Assessment

Provides:
- 2-3 most likely conditions
- Severity assessment (emergency/urgent/routine)
- Recommended immediate actions
- Important disclaimers about professional care

### Emergency Recognition

Identifies critical symptoms requiring immediate care:
- Difficulty breathing
- Seizures
- Severe bleeding
- Inability to urinate/defecate
- Extreme lethargy
- Suspected poisoning

## Deployment

### Prerequisites

- AWS CLI configured
- AWS SAM CLI installed
- Appropriate AWS permissions for Bedrock and CloudFormation

### Agent Instruction Configuration

The agent's system prompt is stored in `instruction.txt`. This allows you to:
- Use prompts longer than CloudFormation's 4096 character parameter limit
- Easily edit and version control the prompt
- Keep the CloudFormation template clean and readable

**To modify the agent's behavior:**
1. Edit `instruction.txt` with your desired prompt
2. Run `make deploy` - the script will automatically read the file

### Deploy

```bash
# Validate template
make validate

# Build and deploy (automatically reads instruction.txt)
make deploy

# Or deploy everything at once
make deploy-full
```

The `deploy.sh` script automatically:
1. Checks that `instruction.txt` exists
2. Reads the instruction from the file
3. Builds the SAM application
4. Deploys with the instruction as a parameter
5. Updates the agent instruction via AWS CLI (ensures latest instruction is applied)
6. Prepares the agent for use

### Update Instruction Only (Fast)

If you only want to update the agent instruction without a full CloudFormation deployment:

```bash
# Update instruction only (reads from instruction.txt)
make update-instruction

# Or use the script directly
./update-instruction.sh
```

This method:
- **Much faster** than full deployment (seconds vs minutes)
- Only updates the instruction text
- Uses AWS Bedrock API directly
- Automatically prepares the agent after update
- Perfect for iterating on agent behavior

**Use this when:**
- You're testing different instruction variations
- Only the instruction text changed (no infrastructure changes)
- You need quick feedback on agent behavior changes

**Note**: For changes to agent configuration (model, timeout, etc.), use full `make deploy`

### Check Status

```bash
# View stack status
make status

# View deployment logs
make logs

# Get Agent ID
make get-agent-id
```

### Delete

```bash
make delete
```

## Configuration

Key parameters in `template.yaml`:

- **VetDoctorAgentName**: Name of the agent (default: `AgentVetDoctor`)
- **VetDoctorAgentFoundationModel**: Claude model to use (default: Claude 3.5 Haiku)
- **VetDoctorAgentInstruction**: System prompt with agent behavior guidelines
- **VetDoctorAgentIdleSessionTTL**: Session timeout (default: 900 seconds)

## Integration with Service Router

After deployment, the agent needs to be registered with the service router:

1. Get the Agent ID and Alias ID from CloudFormation outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name vet-expert-agent-vet-doctor \
     --query 'Stacks[0].Outputs'
   ```

2. Update the service-router configuration to include the VetDoc agent mapping.

## Example Interactions

### User provides partial information

**User**: "My cat is vomiting and not eating"

**Agent**: Asks clarifying questions about:
- Cat's age
- When symptoms started
- Frequency of vomiting
- Water intake
- Other symptoms
- Recent changes

### User provides complete information

**User**: "My 5-year-old cat started vomiting yesterday morning, happened 3 times. She's drinking but less than usual. She seems tired."

**Agent**: Provides assessment:
- Possible conditions (gastroenteritis, hairballs, etc.)
- Severity level (moderate concern)
- Recommended actions (monitor, schedule vet visit if no improvement)
- Disclaimer about professional examination

### Emergency situation

**User**: "My dog is having trouble breathing and his gums look blue"

**Agent**: Immediately identifies emergency and recommends:
- Seek emergency veterinary care NOW
- Transport safely
- Call ahead to emergency vet
- This is a life-threatening situation

## Important Notes

- This agent provides PRELIMINARY assessments only
- Always recommends professional veterinary examination
- Does not prescribe medications or specific treatments
- Prioritizes pet owner's peace of mind while encouraging proper care
- Recognizes emergencies and recommends immediate action

## Stack Outputs

- **VetDoctorAgentId**: The Bedrock Agent ID
- **VetDoctorAgentAliasId**: The Agent Alias ID (used for invocations)
- **VetDoctorAgentArn**: The Agent ARN
- **VetDoctorAgentRoleArn**: The IAM Role ARN

## Support

For issues or questions, check:
- CloudFormation stack events: `make logs`
- Stack status: `make status`
- AWS Bedrock Agent console for agent details

## License

Part of the Вет Експерт pet insurance system.

