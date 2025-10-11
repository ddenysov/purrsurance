#!/bin/bash
# Start the Lambda function locally using SAM CLI

echo "Starting local Lambda function..."
echo "Test with: curl or use sam local invoke"

sam local start-lambda --env-vars env.json

