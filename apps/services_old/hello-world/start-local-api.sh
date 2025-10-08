#!/bin/bash

# Start local API Gateway for interactive testing
# Usage: ./start-local-api.sh [mock|real]

MODE=${1:-mock}

echo "🌐 Starting local API Gateway..."
echo "Mode: $MODE"

export AWS_SAM_LOCAL=true

if [ "$MODE" = "real" ]; then
    echo "📡 Using REAL Bedrock Agent"
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "false"' env.json > env.json.tmp && mv env.json.tmp env.json
else
    echo "🎭 Using MOCK Bedrock Agent"
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "true"' env.json > env.json.tmp && mv env.json.tmp env.json
fi

# Build first
echo "🔨 Building Lambda function..."
cd .. && sam build && cd hello-world || exit 1

# Start API
echo "🚀 Starting API on http://localhost:3000"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:3000/hello \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello from local API!\"}'"
echo ""

cd .. && sam local start-api \
  --env-vars hello-world/env.json \
  --host 0.0.0.0 \
  --port 3000

