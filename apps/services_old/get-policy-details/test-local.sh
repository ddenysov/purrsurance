#!/bin/bash

# Test GetPolicyDetails Lambda function locally
# This script simulates a Bedrock Agent invocation

echo "Testing GetPolicyDetails Lambda function..."
echo ""

# Set environment variables for local testing
export EVENTS_TOPIC_ARN="arn:aws:sns:us-east-1:123456789012:test-topic"

# Run the Lambda function with sam local invoke
sam local invoke GetPolicyDetailsFunction \
  --event events/bedrock-agent-event.json \
  --template ../template.yaml \
  --env-vars env.json

echo ""
echo "Test completed!"

