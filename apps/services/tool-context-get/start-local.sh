#!/bin/bash

# Script to start the Lambda function locally for development
# This allows you to test the function without deploying to AWS

set -e

echo "Starting GetContext Lambda function locally..."
echo ""

# Check if env.json exists
if [ ! -f "env.json" ]; then
  echo "Error: env.json not found!"
  echo "Please copy env.json.example to env.json and configure it:"
  echo "  cp env.json.example env.json"
  echo ""
  exit 1
fi

# Build the function
echo "Building function..."
sam build

echo ""
echo "Function built successfully!"
echo ""
echo "To invoke the function, run:"
echo "  sam local invoke GetContextFunction -e events/bedrock-agent-event.json --env-vars env.json"
echo ""
echo "Available test events:"
echo "  - events/bedrock-agent-event.json (get specific context key)"
echo "  - events/get-all-context-event.json (get all context)"
echo "  - events/list-keys-event.json (list available keys)"
echo ""

