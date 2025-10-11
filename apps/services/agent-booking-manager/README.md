# Agent Booking Manager

## Overview

The **AgentBookingManager** is a specialized Bedrock AI agent responsible for managing veterinary appointment bookings for pets in the Purrsurance pet insurance system. It handles scheduling, rescheduling, cancellations, and provides guidance on appointment preparation.

## Features

- **Appointment Scheduling**: Helps users book routine checkups, urgent care, specialist visits, and follow-ups
- **Information Gathering**: Intelligently collects necessary details (pet info, visit reason, preferred time)
- **Urgency Recognition**: Identifies emergency situations and recommends immediate care
- **Confirmation Management**: Confirms appointment details before finalizing
- **Appointment Changes**: Handles rescheduling and cancellation requests
- **Preparation Guidance**: Provides information on what to bring and how to prepare

## Architecture

This agent uses:
- **AWS Bedrock Agent**: Claude 3.5 Haiku for efficient conversational interactions
- **IAM Role**: Permissions to invoke Bedrock foundation models
- **Agent Alias**: For version management and deployment

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed
- Access to AWS Bedrock in us-east-1 region
- Appropriate IAM permissions to create Bedrock agents and related resources

### Quick Deploy

```bash
# Deploy the agent
make deploy

# Or use full deployment (same as deploy for this agent)
make deploy-full
```

### Manual Deployment

```bash
# Validate template
make validate

# Build
make build

# Deploy
sam deploy --no-confirm-changeset
```

## Usage

### Commands

- `make help` - Show available commands
- `make build` - Build SAM application
- `make deploy` - Deploy to AWS
- `make validate` - Validate CloudFormation template
- `make status` - Check deployment status
- `make logs` - View recent stack events
- `make clean` - Remove build artifacts
- `make delete` - Delete the stack from AWS

## Agent Capabilities

### Appointment Types
- Routine checkups
- Urgent care visits
- Specialist consultations
- Follow-up appointments
- Vaccinations
- Diagnostic procedures

### Information Collected
- Pet details (name, species, breed)
- Visit type and reason
- Preferred date/time
- Owner contact information
- Special requirements or preparations

### Emergency Handling
If severe symptoms are detected (difficulty breathing, severe bleeding, seizures, suspected poisoning), the agent will:
1. Acknowledge the urgency
2. Recommend immediate emergency care
3. Skip regular appointment booking process
4. Provide emergency guidance

## Configuration

Key configuration parameters in `template.yaml`:

- **BookingManagerAgentName**: Name of the agent (default: `AgentBookingManager`)
- **BookingManagerAgentFoundationModel**: LLM model (default: Claude 3.5 Haiku)
- **BookingManagerAgentIdleSessionTTL**: Session timeout in seconds (default: 900)
- **Environment**: Deployment environment (default: `prod`)

## Future Enhancements

Potential future additions:
- Lambda function for checking real appointment availability
- Integration with calendar systems
- Automated confirmation emails/SMS
- Appointment reminder system
- Integration with veterinary clinic management systems

## Stack Outputs

After deployment, the stack exports:

- `BookingManagerAgentId` - The Bedrock Agent ID
- `BookingManagerAgentAliasId` - The Agent Alias ID
- `BookingManagerAgentArn` - The Agent ARN
- `BookingManagerAgentRoleArn` - IAM Role ARN

## Notes

- This agent currently operates conversationally without external tools
- For production use, consider adding Lambda functions to check real availability
- The agent is designed to integrate with the Purrsurance multi-agent system
- Session timeout is configurable (60-3600 seconds)

## Related Services

- `agent-vet-doctor` - Provides preliminary diagnostic assessments
- `agent-policy-manager` - Manages insurance policy information
- `service-router` - Routes requests to appropriate agents

## Support

For issues or questions, refer to the main Purrsurance documentation or contact the development team.

