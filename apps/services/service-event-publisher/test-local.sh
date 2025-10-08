#!/bin/bash

# Test Event Publisher Lambda locally with SAM

echo "Testing Event Publisher Lambda locally..."
echo "========================================="

# Check if env.json exists
if [ ! -f env.json ]; then
    echo "Error: env.json not found. Creating from example..."
    cp env.json.example env.json
    echo "Please edit env.json with your configuration and run again."
    exit 1
fi

# Test with default event
echo ""
echo "Test 1: Publishing a PolicyUpdate event"
echo "----------------------------------------"
sam local invoke EventPublisherFunction \
    -e events/test.json \
    --env-vars env.json

echo ""
echo "Test 2: Publishing a ClaimSubmitted event"
echo "----------------------------------------"
sam local invoke EventPublisherFunction \
    -e events/test-claim.json \
    --env-vars env.json

echo ""
echo "========================================="
echo "Testing complete!"

