#!/bin/bash

# Test BookVetClinic service locally using SAM CLI
# This invokes the Lambda function with a test event

echo "🧪 Testing BookVetClinic service locally..."
echo "======================================"

# Check if env.json exists
if [ ! -f env.json ]; then
    echo "⚠️  Warning: env.json not found. Creating from example..."
    cp env.json.example env.json
    echo "✅ Created env.json from example"
    echo ""
fi

# Invoke the function using SAM
echo "Invoking BookVetClinicFunction with test event..."
echo ""

sam local invoke BookVetClinicFunction \
    -e events/bedrock-agent-event.json \
    --env-vars env.json

echo ""
echo "✅ Test complete!"

