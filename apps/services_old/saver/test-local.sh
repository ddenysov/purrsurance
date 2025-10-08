#!/bin/bash

# Test Event Saver Lambda function locally

echo "Testing Event Saver Lambda function..."
echo "======================================="

# Set environment variables
export EVENTS_TABLE_NAME="EventsTable-Test"

# Run the Lambda function with test event
sam local invoke EventSaverFunction \
  --event events/test-sns-event.json \
  --template ../template.yaml

echo ""
echo "Test completed!"

