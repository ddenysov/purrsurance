import json
import boto3
import logging
import urllib3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()
bedrock_agent = boto3.client('bedrock-agent')

def send_response(event, context, response_status, response_data, physical_resource_id=None, reason=None):
    """Send CloudFormation custom resource response"""
    response_url = event['ResponseURL']
    
    response_body = {
        'Status': response_status,
        'Reason': reason or f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_resource_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': response_data
    }
    
    json_response_body = json.dumps(response_body)
    
    logger.info(f"Response body: {json_response_body}")
    
    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }
    
    try:
        response = http.request(
            'PUT',
            response_url,
            body=json_response_body,
            headers=headers
        )
        logger.info(f"Status code: {response.status}")
    except Exception as e:
        logger.error(f"Failed to send response: {e}")

def handler(event, context):
    """
    Custom Resource handler for Bedrock Agent Collaboration
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    request_type = event['RequestType']
    properties = event['ResourceProperties']
    
    agent_id = properties.get('AgentId')
    agent_version = properties.get('AgentVersion', 'DRAFT')
    collaborator_name = properties.get('CollaboratorName')
    collaboration_instruction = properties.get('CollaborationInstruction')
    relay_conversation_history = properties.get('RelayConversationHistory', 'ENABLED')
    collaborator_alias_arn = properties.get('CollaboratorAliasArn')
    
    physical_resource_id = f"{agent_id}-{collaborator_name}"
    
    try:
        if request_type == 'Create':
            logger.info(f"Creating agent collaboration: {agent_id} -> {collaborator_name}")
            
            response = bedrock_agent.associate_agent_collaborator(
                agentId=agent_id,
                agentVersion=agent_version,
                collaboratorName=collaborator_name,
                collaborationInstruction=collaboration_instruction,
                relayConversationHistory=relay_conversation_history,
                agentDescriptor={
                    'aliasArn': collaborator_alias_arn
                }
            )
            
            logger.info(f"Collaboration created: {json.dumps(response, default=str)}")
            
            send_response(
                event, 
                context, 
                'SUCCESS', 
                {'CollaboratorId': collaborator_name},
                physical_resource_id
            )
            
        elif request_type == 'Update':
            logger.info(f"Updating agent collaboration: {agent_id} -> {collaborator_name}")
            
            # For updates, we disassociate and re-associate
            try:
                bedrock_agent.disassociate_agent_collaborator(
                    agentId=agent_id,
                    agentVersion=agent_version,
                    collaboratorId=collaborator_name
                )
            except bedrock_agent.exceptions.ResourceNotFoundException:
                logger.info("Collaboration not found, creating new one")
            
            response = bedrock_agent.associate_agent_collaborator(
                agentId=agent_id,
                agentVersion=agent_version,
                collaboratorName=collaborator_name,
                collaborationInstruction=collaboration_instruction,
                relayConversationHistory=relay_conversation_history,
                agentDescriptor={
                    'aliasArn': collaborator_alias_arn
                }
            )
            
            logger.info(f"Collaboration updated: {json.dumps(response, default=str)}")
            
            send_response(
                event,
                context,
                'SUCCESS',
                {'CollaboratorId': collaborator_name},
                physical_resource_id
            )
            
        elif request_type == 'Delete':
            logger.info(f"Deleting agent collaboration: {agent_id} -> {collaborator_name}")
            
            try:
                bedrock_agent.disassociate_agent_collaborator(
                    agentId=agent_id,
                    agentVersion=agent_version,
                    collaboratorId=collaborator_name
                )
                logger.info("Collaboration deleted successfully")
            except bedrock_agent.exceptions.ResourceNotFoundException:
                logger.info("Collaboration not found, skipping deletion")
            
            send_response(
                event,
                context,
                'SUCCESS',
                {},
                physical_resource_id
            )
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        send_response(
            event,
            context,
            'FAILED',
            {},
            physical_resource_id,
            str(e)
        )

