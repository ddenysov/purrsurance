#!/bin/bash

# Deploy service-backend to AWS

set -e

echo "======================================"
echo "Deploying service-backend to AWS"
echo "======================================"
echo ""

echo "Step 1: Building Lambda function..."
sam build

echo ""
echo "Step 2: Deploying to AWS..."
sam deploy

echo ""
echo "======================================"
echo "Deployment complete!"
echo "======================================"
echo ""
echo "To get the API endpoint URL, run:"
echo "  aws cloudformation describe-stacks --stack-name service-backend --query 'Stacks[0].Outputs[?OutputKey==\`BackendApiUrl\`].OutputValue' --output text"

