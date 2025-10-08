#!/bin/bash
# Update environment variables from CloudFormation stack outputs
# Usage: ./update-env.sh [stack-name]

set -e

# Default stack name (can be overridden by first argument)
STACK_NAME="${1:-agent-operator-prod}"

echo "📦 Fetching outputs from CloudFormation stack: $STACK_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get outputs from CloudFormation
echo "🔍 Getting SSE Stream URL..."
SSE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -z "$SSE_URL" ]; then
    echo "⚠️  SSEStreamFunctionUrl not found, trying alternative..."
    SSE_URL=$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamHttpApiUrl`].OutputValue' \
      --output text 2>/dev/null || echo "")
fi

echo "🔍 Getting API Base URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`HelloWorldApi`].OutputValue' \
  --output text 2>/dev/null || echo "")

# Validate we got the URLs
if [ -z "$SSE_URL" ]; then
    echo "❌ Could not retrieve SSE Stream URL from stack outputs"
    echo "Available outputs:"
    aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' --output table
    exit 1
fi

if [ -z "$API_URL" ]; then
    echo "⚠️  Could not retrieve API URL from stack outputs (this might be ok if you don't use it yet)"
fi

# Create .env file
ENV_FILE="$(dirname "$0")/.env"

cat > "$ENV_FILE" << EOF
# Auto-generated from CloudFormation stack: $STACK_NAME
# Generated at: $(date)
# 
# To regenerate this file, run: ./update-env.sh

# API Configuration
NUXT_PUBLIC_API_BASE_URL=${API_URL:-https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/Prod}
NUXT_PUBLIC_SSE_STREAM_URL=$SSE_URL
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_APP_ENV=production
EOF

echo ""
echo "✅ Environment variables updated successfully!"
echo ""
echo "📝 Configuration written to: $ENV_FILE"
echo ""
echo "🔗 SSE Stream URL:"
echo "   $SSE_URL"
echo ""
if [ -n "$API_URL" ]; then
    echo "🔗 API Base URL:"
    echo "   $API_URL"
    echo ""
fi
echo "💡 Next steps:"
echo "   1. Review the .env file: cat $ENV_FILE"
echo "   2. Start the dev server: npm run dev"
echo "   3. Check browser console for '[SSE] Connecting to:' message"
echo ""
