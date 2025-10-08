# Deployment Guide

This guide explains how to deploy the entire Purrsurance stack and configure the frontend application to use the deployed services.

## Overview

The Purrsurance application consists of two main parts:
1. **Backend Services** (AWS Lambda functions deployed via CloudFormation)
2. **Frontend Application** (Nuxt 3 app that connects to backend services)

## Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed
- Node.js 20+ installed
- Access to AWS account with necessary permissions

## Step 1: Deploy Backend Services

Navigate to the services directory and deploy the CloudFormation stack:

```bash
cd apps/services

# Build the services
sam build

# Deploy to AWS
sam deploy --guided
```

During the guided deployment, you'll be asked to provide:
- **Stack Name**: e.g., `agent-operator-prod`
- **Region**: e.g., `us-east-1`
- **Environment**: `prod`
- **BedrockAgentId**: Your AWS Bedrock Agent ID
- **BedrockAgentAliasId**: Your Bedrock Agent Alias ID (default: `TSTALIASID`)

After deployment completes, note down the stack name - you'll need it for the next step.

## Step 2: Configure Frontend Application

The frontend needs to know the URLs of your deployed backend services. Use the automated configuration script:

```bash
cd apps/chat

# Run the auto-configuration script
./update-env.sh your-stack-name
```

For example:
```bash
./update-env.sh agent-operator-prod
```

This script will:
1. Query your CloudFormation stack for service URLs
2. Create a `.env` file with the correct configuration
3. Display the URLs for verification

### What URLs are Retrieved?

The script retrieves these CloudFormation outputs:
- `SSEStreamFunctionUrl` - WebSocket/SSE endpoint for real-time updates
- `HelloWorldApi` - Main API Gateway endpoint for chat
- `GetPolicyDetailsApi` - Policy details endpoint
- `GetChatHistoryApi` - Chat history endpoint

## Step 3: Start the Frontend Application

```bash
cd apps/chat

# Install dependencies (if not done yet)
pnpm install

# Start development server
pnpm dev
```

Open your browser to `http://localhost:3000` and verify:
1. Browser console shows: `[SSE] Connecting to: https://your-lambda-url...`
2. SSE connection opens successfully
3. Chat functionality works

## Updating After Redeployment

When you redeploy your backend services and URLs change:

```bash
# 1. Redeploy backend
cd apps/services
sam build && sam deploy

# 2. Update frontend configuration
cd ../chat
./update-env.sh your-stack-name

# 3. Restart development server (or rebuild for production)
pnpm dev
```

## Manual Configuration (Alternative)

If you prefer to configure manually or the script doesn't work:

### Get URLs from AWS Console

1. Go to [CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. Select your stack
3. Click "Outputs" tab
4. Copy the URLs

### Get URLs via AWS CLI

```bash
# List all outputs
aws cloudformation describe-stacks \
  --stack-name your-stack-name \
  --query 'Stacks[0].Outputs' \
  --output table

# Get specific URL
aws cloudformation describe-stacks \
  --stack-name your-stack-name \
  --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
  --output text
```

### Create .env file manually

Create `apps/chat/.env` with:

```bash
NUXT_PUBLIC_SSE_STREAM_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws/stream
NUXT_PUBLIC_API_BASE_URL=https://your-api-gateway.execute-api.us-east-1.amazonaws.com/Prod
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_APP_ENV=production
```

## Production Deployment

### Backend (AWS)

```bash
cd apps/services

# Deploy to production
sam deploy \
  --stack-name agent-operator-prod \
  --parameter-overrides Environment=prod \
  --no-confirm-changeset
```

### Frontend (Static Hosting)

```bash
cd apps/chat

# Update configuration for production
./update-env.sh agent-operator-prod
NUXT_PUBLIC_APP_ENV=production pnpm build

# Deploy the .output directory to your hosting provider
# Examples:
# - Netlify: drag .output/public to Netlify
# - Vercel: vercel deploy
# - S3: aws s3 sync .output/public s3://your-bucket
```

## Production Configuration

The production `.env` file is generated automatically:

```bash
# Production
apps/chat/.env.production
```

Generate the production configuration file:

```bash
# Production
./update-env.sh agent-operator-prod
mv .env .env.production
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy backend services
        run: |
          cd apps/services
          sam build
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset

  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update frontend configuration
        run: |
          cd apps/chat
          chmod +x update-env.sh
          ./update-env.sh agent-operator-prod
      
      - name: Build frontend
        run: |
          cd apps/chat
          npm install
          npm run build
      
      - name: Deploy to hosting
        run: |
          # Add your deployment commands here
          # e.g., aws s3 sync, netlify deploy, vercel deploy, etc.
```

## Troubleshooting

### Issue: Script can't find CloudFormation stack

**Error**: `An error occurred (ValidationError) when calling the DescribeStacks operation`

**Solution**: 
- Verify stack name is correct
- Ensure you're in the correct AWS region
- Check AWS credentials are configured

```bash
# List all stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Verify your region
aws configure get region
```

### Issue: SSE connection fails in browser

**Possible causes**:
1. Wrong URL in `.env`
2. Lambda function not deployed
3. CORS configuration issues
4. Lambda function URL authentication enabled

**Solution**:
```bash
# Verify the URL is correct
cat apps/chat/.env

# Test the SSE endpoint directly
curl -v https://your-lambda-url.lambda-url.us-east-1.on.aws/stream

# Check Lambda logs
aws logs tail /aws/lambda/YourFunctionName --follow
```

### Issue: Environment variables not loading

**Solution**:
1. Ensure `.env` file is in `apps/chat/` directory
2. Restart development server
3. Clear Nuxt cache: `rm -rf apps/chat/.nuxt`

### Issue: CORS errors in browser

**Check CloudFormation template** (`apps/services/template.yaml`):
- `SSEHttpApi` resource has CORS configuration
- Lambda function URL has CORS settings
- API Gateway has CORS enabled

## Monitoring

### View Lambda Logs

```bash
# View SSE Stream function logs
aws logs tail /aws/lambda/your-stack-name-SSEStreamFunction --follow

# View Chat function logs
aws logs tail /aws/lambda/your-stack-name-HelloWorldFunction --follow
```

### View DynamoDB Tables

```bash
# List tables
aws dynamodb list-tables

# Scan chat history
aws dynamodb scan --table-name your-stack-name-ChatHistory --max-items 10
```

### Monitor Costs

```bash
# Get estimated costs for current month
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d "1 month ago" +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Rollback

If something goes wrong:

```bash
# Rollback CloudFormation stack to previous version
aws cloudformation rollback-stack --stack-name your-stack-name

# Restore previous frontend configuration
cd apps/chat
git checkout .env
```

## Best Practices

1. **Use separate stacks for each environment** (dev, staging, prod)
2. **Store stack names in documentation** or environment variables
3. **Automate configuration updates** in CI/CD pipelines
4. **Test in development** before deploying to production
5. **Monitor logs** after deployment
6. **Keep `.env` files out of git** (already in `.gitignore`)
7. **Document any manual configuration steps** for your team

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment)
- [CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Project CONFIG.md](./apps/chat/CONFIG.md) - Detailed configuration guide
