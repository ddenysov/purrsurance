# Agent Booking Manager

Booking Manager Agent for Вет Експерт pet insurance system. Handles veterinary appointment scheduling and clinic finding for pets.

## Overview

The **AgentBookingManager** is a conversational AI agent powered by AWS Bedrock that helps pet owners:
- Schedule veterinary appointments
- Find suitable vet clinics based on location, specialty, and urgency
- Handle appointment changes (rescheduling, cancellations)
- Provide guidance on preparation for vet visits

## Features

- **Intelligent Appointment Scheduling**: Guides users through the appointment booking process
- **Clinic Finder**: Integrated with `tool-find-vet-clinic` to help users find appropriate veterinary clinics
- **Urgency Recognition**: Identifies emergency situations and prioritizes urgent care
- **Specialty Matching**: Helps users find specialized veterinary services (cardiology, dental, emergency, etc.)
- **Insurance Integration**: Confirms clinic acceptance of Вет Експерт pet insurance

## Architecture

- **Foundation Model**: Claude 3.5 Haiku (fast, efficient conversations)
- **Action Groups**: 
  - `VetClinicFinderActionGroup` - Uses the `FindVetClinic` tool to search for vet clinics
- **Tools**:
  - `FindVetClinic` - Searches for vet clinics based on location, specialty, and urgency

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed
- `tool-find-vet-clinic` Lambda function deployed

### Deploy the Agent

```bash
# Deploy the CloudFormation stack (reads instruction from instruction.txt)
make deploy

# Or for full deployment with action group setup
make deploy-full
```

The `deploy` command will:
1. Read the agent instruction from `instruction.txt`
2. Build and deploy the CloudFormation stack with the custom instruction
3. Update the agent with the latest instruction via AWS CLI

The `deploy-full` command will:
1. Do everything from `deploy`
2. Set up the action group connecting the agent to the `FindVetClinic` tool
3. Prepare the agent for use

### Update Instruction Only (Fast)

If you only need to update the agent's instruction without redeploying the stack:

```bash
make update-instruction
```

This is much faster than a full deployment and will:
- Read the instruction from `instruction.txt`
- Update the agent instruction via AWS CLI
- Prepare the agent

**Use this when you're iterating on the agent's behavior!**

### Setup Action Group Manually

If you need to setup or update the action group separately:

```bash
make setup-action-group
```

This will:
- Retrieve the Agent ID from CloudFormation outputs
- Retrieve the Lambda Function ARN for `tool-find-vet-clinic`
- Create or update the `VetClinicFinderActionGroup` action group
- Configure the `FindVetClinic` function with proper parameters
- Prepare the agent

## Configuration

### Agent Instruction

The agent's system instruction is stored in `instruction.txt`. This file contains the detailed workflow and guidelines for the agent.

To update the instruction:
1. Edit `instruction.txt`
2. Run `make update-instruction` for quick update (recommended for testing)
3. Or run `make deploy` for full deployment

### Parameters

- `BookingManagerAgentName`: Name of the agent (default: `AgentBookingManager`)
- `BookingManagerAgentFoundationModel`: Claude model to use
- `BookingManagerAgentInstruction`: System instructions for the agent (overridden by `instruction.txt` when using `deploy.sh`)
- `BookingManagerAgentIdleSessionTTL`: Session timeout in seconds (60-3600)

### Environment Variables

The agent automatically uses environment variables from CloudFormation parameters.

## Usage

### Testing in AWS Console

1. Navigate to AWS Bedrock Console → Agents
2. Select `AgentBookingManager`
3. Use the test interface to chat with the agent

### Example Conversations

**Routine appointment:**
```
User: I need to book an appointment for my cat
Agent: I'd be happy to help! What's your cat's name and what's the reason for the visit?
User: Whiskers needs a routine checkup
Agent: Let me find some vet clinics near you for Whiskers' routine checkup...
```

**Urgent care:**
```
User: My dog needs urgent care, he's vomiting
Agent: I understand this is urgent. Let me find clinics with urgent care availability...
```

**Specialty search:**
```
User: I need a veterinary cardiologist for my senior dog
Agent: I'll help you find a veterinary cardiology specialist...
```

## Tools

### FindVetClinic

Searches for veterinary clinics based on criteria.

**Parameters:**
- `location` (optional): City or area to search in
- `specialty` (optional): Type of veterinary specialty (emergency, general, dental, cardiology, etc.)
- `urgency` (optional): Urgency level (urgent, normal, routine)

**Returns:**
- List of clinics with contact information
- Ratings and distance
- Availability information
- Insurance acceptance status

## Makefile Commands

```bash
make help                # Show available commands
make build               # Build SAM application
make deploy              # Deploy to AWS (reads instruction.txt)
make deploy-full         # Deploy stack + setup action group
make update-instruction  # Update agent instruction only (fast, no full deploy)
make setup-action-group  # Setup action group for FindVetClinic
make get-agent-id        # Get Agent ID from stack
make validate            # Validate SAM template
make status              # Show stack status
make logs                # View stack events
make delete              # Delete CloudFormation stack
make clean               # Clean build artifacts
```

## Integration with Other Services

- **tool-find-vet-clinic**: Lambda function that searches for vet clinics
- **service-event-publisher**: Receives events about clinic searches
- **service-router**: Routes conversations to appropriate agents

## Troubleshooting

### Action Group Not Working

```bash
# Check if action group exists
aws bedrock-agent list-agent-action-groups \
  --agent-id $(make get-agent-id) \
  --agent-version DRAFT

# Re-run setup
make setup-action-group
```

### Check Agent Status

```bash
make status
```

### View Logs

```bash
make logs
```

## Development

### Update Agent Instructions

Edit `instruction.txt` with your changes, then:

```bash
# Fast update (recommended for testing)
make update-instruction

# Or full deploy (if you have other changes)
make deploy
```

The `update-instruction` command is much faster than a full deployment and is ideal for iterating on the agent's behavior.

### Update Action Group Schema

Edit `setup-action-group.sh` to modify the function schema, then run:

```bash
make setup-action-group
```

### Testing Changes

1. Edit `instruction.txt` with your changes
2. Run `make update-instruction` (takes ~10-15 seconds)
3. Test in AWS Console or via API
4. Repeat until satisfied
5. Commit changes to git

## Related Services

- [agent-vet-doctor](../agent-vet-doctor/) - Veterinary diagnostic assistant
- [agent-policy-manager](../agent-policy-manager/) - Insurance policy management
- [agent-intention-classifier](../agent-intention-classifier/) - User intent classification
- [tool-find-vet-clinic](../tool-find-vet-clinic/) - Vet clinic search tool
- [service-router](../service-router/) - Main conversation router

## License

Part of the Вет Експерт pet insurance system.
