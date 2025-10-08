# Agent Collaboration Lambda Function

This Lambda function serves as a CloudFormation Custom Resource to manage Bedrock Agent collaborations.

## Purpose

Since `AWS::Bedrock::AgentCollaboratorAssociation` is not available in CloudFormation for all regions, this custom resource provides a workaround using the Bedrock Agent API to:
- Associate agent collaborators (Create)
- Update collaborator associations (Update)
- Disassociate collaborators (Delete)

## How It Works

1. **Create**: Calls `bedrock:AssociateAgentCollaborator` to establish a collaboration between a supervisor agent and a collaborator agent
2. **Update**: Disassociates the old collaboration and creates a new one with updated parameters
3. **Delete**: Calls `bedrock:DisassociateAgentCollaborator` to remove the collaboration

## Properties

The custom resource accepts the following properties:

- `AgentId`: The ID of the supervisor agent
- `AgentVersion`: The version of the agent (default: DRAFT)
- `CollaboratorName`: Name for the collaborator
- `CollaborationInstruction`: Instructions for how to route to this collaborator
- `RelayConversationHistory`: Whether to relay conversation history (ENABLED/DISABLED)
- `CollaboratorAliasArn`: ARN of the collaborator agent's alias

## Usage in CloudFormation

```yaml
SupervisorVetDocCollaboration:
  Type: Custom::AgentCollaboration
  Properties:
    ServiceToken: !GetAtt AgentCollaborationFunction.Arn
    AgentId: !Ref SupervisorAgent
    AgentVersion: DRAFT
    CollaborationInstruction: |
      Route veterinary questions to this agent
    CollaboratorName: VetDocAgent
    RelayConversationHistory: ENABLED
    CollaboratorAliasArn: !Sub 'arn:aws:bedrock:...'
```

## IAM Permissions Required

The Lambda function requires:
- `bedrock:AssociateAgentCollaborator`
- `bedrock:DisassociateAgentCollaborator`
- `bedrock:GetAgentCollaborator`

## Dependencies

- boto3 >= 1.34.0
- urllib3 >= 2.0.0

