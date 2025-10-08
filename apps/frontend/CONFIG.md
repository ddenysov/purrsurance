# Configuration Guide

This guide explains how to configure the application with the correct API and SSE endpoints after deploying your CloudFormation stack.

## Environment Variables

The application uses environment variables to configure API endpoints. This ensures that URLs are not hardcoded and can be updated when you redeploy your stack.

### Required Environment Variables

Create a `.env` file in the `apps/chat/` directory with the following variables:

```bash
# API Configuration
# Base URL for API requests (Lambda/API Gateway endpoint)
NUXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/Prod

# SSE Stream URL (Lambda Function URL)
# This URL is output by CloudFormation stack as SSEStreamFunctionUrl
NUXT_PUBLIC_SSE_STREAM_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws/stream

# API timeout in milliseconds
NUXT_PUBLIC_API_TIMEOUT=10000

# Application environment (development, staging, production)
NUXT_PUBLIC_APP_ENV=development
```

## Getting URLs from CloudFormation

After deploying your CloudFormation stack (`apps/services/template.yaml`), you can get the required URLs from the stack outputs:

### Option 1: Using AWS Console

1. Go to AWS CloudFormation console
2. Select your stack
3. Go to "Outputs" tab
4. Copy the values:
   - `HelloWorldApi` → use as `NUXT_PUBLIC_API_BASE_URL`
   - `SSEStreamFunctionUrl` → use as `NUXT_PUBLIC_SSE_STREAM_URL`

### Option 2: Using AWS CLI

```bash
# Get SSE Stream URL
aws cloudformation describe-stacks \
  --stack-name your-stack-name \
  --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
  --output text

# Get API Base URL
aws cloudformation describe-stacks \
  --stack-name your-stack-name \
  --query 'Stacks[0].Outputs[?OutputKey==`HelloWorldApi`].OutputValue' \
  --output text
```

### Option 3: Using SAM CLI

```bash
# Get all outputs
sam list stack-outputs --stack-name your-stack-name
```

## Automated Setup Script

You can create a script to automatically update your `.env` file after deployment:

```bash
#!/bin/bash
# File: apps/chat/update-env.sh

STACK_NAME="your-stack-name"

# Get outputs from CloudFormation
SSE_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`HelloWorldApi`].OutputValue' \
  --output text)

# Update .env file
cat > .env << EOF
# Auto-generated from CloudFormation stack: $STACK_NAME
# Generated at: $(date)

NUXT_PUBLIC_API_BASE_URL=$API_URL
NUXT_PUBLIC_SSE_STREAM_URL=$SSE_URL
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_APP_ENV=development
EOF

echo "✅ Environment variables updated from CloudFormation stack"
echo "SSE URL: $SSE_URL"
echo "API URL: $API_URL"
```

Make it executable and run:

```bash
chmod +x apps/chat/update-env.sh
./apps/chat/update-env.sh
```

## Development vs Production

For different environments, you can create multiple `.env` files:

- `.env.development` - for local development
- `.env.staging` - for staging environment
- `.env.production` - for production environment

Nuxt will automatically load the appropriate file based on the `NODE_ENV` environment variable.

## Verifying Configuration

After setting up your environment variables, you can verify they're loaded correctly:

1. Start the development server:
   ```bash
   cd apps/chat
   npm run dev
   ```

2. Open the browser console
3. Look for the log message:
   ```
   [SSE] Connecting to: https://your-lambda-url.lambda-url.us-east-1.on.aws/stream
   ```

If you see your actual Lambda URL instead of a hardcoded one, configuration is working correctly!

## Troubleshooting

### Issue: Still seeing old hardcoded URL

**Solution:** Clear Nuxt cache and rebuild:
```bash
cd apps/chat
rm -rf .nuxt .output
npm run dev
```

### Issue: Environment variables not loading

**Solution:** Make sure your `.env` file is in the correct location (`apps/chat/.env`) and restart the dev server.

### Issue: CORS errors

**Solution:** Make sure your CloudFormation template has proper CORS configuration for the SSE Lambda function. Check the `SSEHttpApi` resource in `template.yaml`.

## CI/CD Integration

For CI/CD pipelines, you can pass environment variables directly:

```yaml
# Example for GitHub Actions
- name: Build application
  env:
    NUXT_PUBLIC_SSE_STREAM_URL: ${{ secrets.SSE_STREAM_URL }}
    NUXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
  run: |
    cd apps/chat
    npm run build
```

Or retrieve them from CloudFormation during the build:

```yaml
- name: Get CloudFormation outputs
  id: cfn-outputs
  run: |
    SSE_URL=$(aws cloudformation describe-stacks --stack-name ${{ env.STACK_NAME }} --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' --output text)
    echo "SSE_URL=$SSE_URL" >> $GITHUB_OUTPUT

- name: Build application
  env:
    NUXT_PUBLIC_SSE_STREAM_URL: ${{ steps.cfn-outputs.outputs.SSE_URL }}
  run: |
    cd apps/chat
    npm run build
```
