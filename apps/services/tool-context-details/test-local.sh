#!/bin/bash

# Test GetContextDetails Lambda function locally
# This script simulates a Bedrock Agent invocation

echo "Testing GetContextDetails Lambda function..."
echo ""

# Run the Lambda function with sam local invoke
sam local invoke GetContextDetailsFunction \
  --event events/bedrock-agent-event.json \
  --env-vars env.json

echo ""
echo "Test completed!"

