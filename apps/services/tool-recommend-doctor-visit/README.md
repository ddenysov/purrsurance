# Tool: Recommend Doctor Visit

Lambda function that recommends veterinary doctor visits and publishes events to the Event Publisher service.

## Overview

This tool is designed to be used by the AgentVetDoctor Bedrock Agent. When invoked, it:
1. Processes the recommendation request with reason, urgency, and symptoms
2. Publishes a `ReccomendDoctorVisit` event to the Event Publisher
3. Returns a structured response to the Bedrock Agent

## Architecture

```
AgentVetDoctor → RecommendDoctorVisit Function → Event Publisher → DynamoDB
```

## Parameters

The function accepts the following parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | Yes | Primary reason for recommending the visit |
| `urgency` | string | No | Urgency level: `emergency`, `urgent`, `normal`, `routine` |
| `symptoms` | string | No | Comma-separated list of symptoms |

## Event Format

The function publishes events with the following structure:

```json
{
  "sessionId": "session-id",
  "eventType": "ReccomendDoctorVisit",
  "data": {
    "recommendation": {
      "type": "doctor_visit",
      "reason": "Pet showing unusual symptoms",
      "urgency": "normal",
      "symptoms": "Coughing, lethargy",
      "timestamp": "2025-10-11T12:00:00.000Z",
      "message": "We recommend scheduling a vet visit. Reason: Pet showing unusual symptoms"
    },
    "nextSteps": [
      "Contact your veterinarian to schedule an appointment",
      "Prepare information about symptoms and pet behavior",
      "Bring your pet's medical records if available"
    ]
  }
}
```

## Deployment

### Prerequisites

1. Event Publisher stack must be deployed first
2. AWS SAM CLI installed
3. AWS credentials configured

### Deploy the Tool

```bash
# Build and deploy
make deploy

# Or manually
sam build
sam deploy --guided
```

### Configure Environment Variables

Update `samconfig.toml` with your Event Publisher URL:

```toml
parameter_overrides = [
    "Environment=prod",
    "LogLevel=info",
    "EventPublisherStackName=purrsurance-event-publisher",
    "EventPublisherUrl=https://YOUR-API-URL/Prod/publish"
]
```

### Connect to AgentVetDoctor

After deployment, connect the tool to the AgentVetDoctor:

```bash
cd ../agent-vet-doctor
./setup-action-group.sh
```

This script will:
1. Retrieve the Agent ID from the CloudFormation stack
2. Retrieve the Lambda ARN from the tool stack
3. Create/update the Action Group with the `RecommendDoctorVisit` function
4. Prepare the agent

## Local Testing

### Test with SAM

```bash
# Using make
make invoke

# Or directly
sam local invoke RecommendDoctorVisitFunction \
  -e events/bedrock-agent-event.json \
  --env-vars env.json
```

### Test Event

Example test event is provided in `events/bedrock-agent-event.json`:

```json
{
  "messageVersion": "1.0",
  "sessionId": "test-session-123",
  "function": "recommendDoctorVisit",
  "parameters": [
    {
      "name": "reason",
      "value": "Pet showing unusual symptoms"
    },
    {
      "name": "urgency",
      "value": "normal"
    },
    {
      "name": "symptoms",
      "value": "Coughing, lethargy"
    }
  ]
}
```

## Usage Examples

### Emergency Case

```javascript
{
  "reason": "Severe breathing difficulty",
  "urgency": "emergency",
  "symptoms": "Gasping, blue gums, collapse"
}
```

### Routine Checkup

```javascript
{
  "reason": "Annual wellness exam",
  "urgency": "routine",
  "symptoms": ""
}
```

### Urgent Concern

```javascript
{
  "reason": "Persistent vomiting",
  "urgency": "urgent",
  "symptoms": "Vomiting, dehydration, weakness"
}
```

## Monitoring

View logs in CloudWatch:

```bash
aws logs tail /aws/lambda/purrsurance-tool-recommend-doctor-visit-RecommendDoctorVisitFunction --follow
```

## Stack Outputs

After deployment, the stack exports:

- `RecommendDoctorVisitFunction`: Lambda function ARN
- `RecommendDoctorVisitFunctionIamRole`: IAM Role ARN
- `DoctorVisitEventsTopicArn`: SNS Topic ARN
- `DoctorVisitEventsTopicName`: SNS Topic Name

## Related Services

- **agent-vet-doctor**: Uses this tool to recommend visits
- **service-event-publisher**: Receives and stores events
- **service-sse-stream**: Streams events to frontend

## Troubleshooting

### Lambda not receiving events

Check that the Action Group is properly configured:

```bash
aws bedrock-agent list-agent-action-groups \
  --agent-id YOUR_AGENT_ID \
  --agent-version DRAFT \
  --region us-east-1
```

### Events not publishing

1. Check Event Publisher URL in environment variables
2. Verify Lambda has permissions to publish to SNS
3. Check CloudWatch logs for errors

### Function timeout

Increase timeout in `template.yaml`:

```yaml
Globals:
  Function:
    Timeout: 60  # Increase from 30
```

