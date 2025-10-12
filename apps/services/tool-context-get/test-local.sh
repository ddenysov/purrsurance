#!/bin/bash

# Script to test the Lambda function locally with different scenarios

set -e

echo "Testing GetContext Lambda function locally..."
echo ""

# Check if env.json exists
if [ ! -f "env.json" ]; then
  echo "Error: env.json not found!"
  echo "Please copy env.json.example to env.json and configure it:"
  echo "  cp env.json.example env.json"
  exit 1
fi

# Build first
echo "Building function..."
sam build
echo ""

# Test 1: Get specific context key
echo "======================================"
echo "Test 1: Get specific context key (diagnosis)"
echo "======================================"
sam local invoke GetContextFunction -e events/bedrock-agent-event.json --env-vars env.json
echo ""

# Test 2: Get all context
echo "======================================"
echo "Test 2: Get all context"
echo "======================================"
sam local invoke GetContextFunction -e events/get-all-context-event.json --env-vars env.json
echo ""

# Test 3: List available keys
echo "======================================"
echo "Test 3: List available keys"
echo "======================================"
sam local invoke GetContextFunction -e events/list-keys-event.json --env-vars env.json
echo ""

echo "✅ All tests completed!"

