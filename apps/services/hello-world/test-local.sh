#!/bin/bash

# Local testing script for Bedrock Agent Lambda function
# Usage: ./test-local.sh [mock|real]

MODE=${1:-mock}

echo "🧪 Testing Lambda function locally..."
echo "Mode: $MODE"

# Set environment for testing
export AWS_SAM_LOCAL=true

if [ "$MODE" = "real" ]; then
    echo "📡 Using REAL Bedrock Agent (requires AWS credentials)"
    # Update env.json to use real agent
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "false"' env.json > env.json.tmp && mv env.json.tmp env.json
else
    echo "🎭 Using MOCK Bedrock Agent"
    # Update env.json to use mock
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "true"' env.json > env.json.tmp && mv env.json.tmp env.json
fi

# Build the function
echo "🔨 Building Lambda function..."
cd .. && sam build && cd hello-world || exit 1

# Invoke locally
echo "🚀 Invoking Lambda function..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Capture output to a temporary file
TEMP_OUTPUT=$(mktemp)
cd .. && sam local invoke HelloWorldFunction \
  --event hello-world/events/bedrock-test.json \
  --env-vars hello-world/env.json > "$TEMP_OUTPUT" 2>&1

# Display logs (everything before the last line which is the JSON result)
head -n -1 "$TEMP_OUTPUT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Lambda Response (formatted):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract and format the JSON result (last line)
tail -n 1 "$TEMP_OUTPUT" | jq '.'

# Clean up
rm "$TEMP_OUTPUT"

echo ""
echo "✅ Test completed!"

