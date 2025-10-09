#!/bin/bash

# Test GetPolicyDetails service by sending a request to the local HTTP server
# The server must be running (use ./start-local.sh)

echo "🧪 Testing GetPolicyDetails Service..."
echo "======================================"
echo ""

PORT=${PORT:-3003}
URL="http://localhost:${PORT}"

# Check if server is running
if ! curl -s --connect-timeout 2 "$URL" > /dev/null 2>&1 && [ $? -ne 52 ]; then
    echo "❌ Error: Server is not running on port ${PORT}"
    echo "Please start the server first with: ./start-local.sh"
    exit 1
fi

echo "✅ Server is running on ${URL}"
echo ""

# Send test request
echo "📤 Sending test request..."
echo ""

response=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d @events/bedrock-agent-event.json)

echo "📥 Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

echo "✅ Test completed!"

