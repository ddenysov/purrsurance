#!/bin/bash

# Local testing script for SSE Lambda function
# Usage: ./test-local.sh

echo "🧪 Testing SSE Lambda function locally..."
echo ""
echo "⚠️  Note: SAM local doesn't fully support response streaming yet."
echo "   This test will show sample events. Deploy to AWS for full SSE streaming."
echo ""

# Build the function
echo "🔨 Building Lambda function..."
cd .. && sam build && cd sse-stream || exit 1

# Invoke locally
echo "🚀 Invoking Lambda function..."
cd .. && sam local invoke SSEStreamFunction \
  --event sse-stream/events/test.json \
  --env-vars sse-stream/env.json

echo ""
echo "✅ Test completed!"
echo ""
echo "To test with real SSE streaming:"
echo "1. Deploy to AWS: sam deploy"
echo "2. Get the Function URL from outputs"
echo "3. Test with: curl -N <FUNCTION_URL>"

