#!/bin/bash

# Test GetPolicyDetails Lambda function locally
# This script simulates a Bedrock Agent invocation

echo "Testing GetPolicyDetails Lambda function..."
echo ""

# Run the Lambda function with sam local invoke
sam local invoke GetPolicyDetailsFunction \
  --event events/bedrock-agent-event.json \
  --env-vars env.json

echo ""
echo "Test completed!"

