#!/bin/bash

# Test script for chat history functionality
# Usage: ./test-chat-history.sh

echo "🧪 Testing Chat History Functionality..."
echo ""

# Generate a test session ID
SESSION_ID="test-session-$(date +%s)"
echo "📝 Using test session ID: $SESSION_ID"
echo ""

# Test 1: Send first message
echo "Test 1: Sending first message..."
RESPONSE1=$(curl -s -X POST \
  http://localhost:3000/hello \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Hello, this is a test message\",
    \"globalSessionId\": \"$SESSION_ID\"
  }")

echo "Response: $RESPONSE1"
echo ""

# Wait a bit
sleep 2

# Test 2: Send second message
echo "Test 2: Sending second message..."
RESPONSE2=$(curl -s -X POST \
  http://localhost:3000/hello \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What is my policy coverage?\",
    \"globalSessionId\": \"$SESSION_ID\"
  }")

echo "Response: $RESPONSE2"
echo ""

echo "✅ Tests completed!"
echo ""
echo "To verify messages were saved to DynamoDB:"
echo "1. Open AWS Console"
echo "2. Navigate to DynamoDB"
echo "3. Open ChatHistoryTable"
echo "4. Query with sessionId: $SESSION_ID"
