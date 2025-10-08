#!/bin/bash

# Local testing script for SSE Lambda function
# Usage: ./test-local.sh

echo "🧪 Testing SSE Lambda function locally..."
echo ""
echo "⚠️  Note: SAM local doesn't fully support response streaming yet."
echo "   This test will check DynamoDB connection and show sample data."
echo ""

# Build the function
echo "🔨 Building Lambda function..."
sam build

# Invoke locally
echo "🚀 Invoking Lambda function..."
sam local invoke SSEStreamFunction \
  --event events/test.json \
  --env-vars env.json

echo ""
echo "✅ Test completed!"
echo ""
echo "To test with real SSE streaming:"
echo "1. Deploy to AWS: make deploy"
echo "2. Get the Function URL from outputs"
echo "3. Test with: curl -N '<FUNCTION_URL>?sessionId=test-session-123'"
echo "4. In another terminal, publish events using service-event-publisher"

