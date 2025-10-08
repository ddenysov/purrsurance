# Purrsurance - Quick Deployment Guide

Complete deployment guide for the Purrsurance application (Backend + Frontend) on AWS.

## 🚀 One-Time Setup

Install prerequisites:

```bash
# AWS CLI
brew install awscli
aws configure

# SAM CLI
brew install aws-sam-cli

# pnpm (if not installed)
npm install -g pnpm
```

## 📦 Deploy Everything

### Step 1: Deploy Backend Services

```bash
cd apps/services_old

# First time deployment (interactive)
sam build
sam deploy --guided

# Or subsequent deployments
sam build && sam deploy
```

**Note the stack name** (e.g., `agent-operator-prod`) - you'll need it for frontend deployment.

### Step 2: Deploy Frontend Application

```bash
cd apps/frontend

# One-line deployment
./deploy.sh prod agent-operator-prod

# Or using Makefile
make deploy-prod BACKEND_STACK=agent-operator-prod
```

That's it! Your application is now live.

## 🌐 Get Your URLs

After deployment:

```bash
# Frontend URL
cd apps/frontend
make get-urls ENV=prod

# Backend URLs
cd apps/services_old
aws cloudformation describe-stacks \
  --stack-name agent-operator-prod \
  --query 'Stacks[0].Outputs' \
  --output table
```

## 🔄 Update Deployments

### Update Backend

```bash
cd apps/services_old
sam build && sam deploy
```

### Update Frontend

```bash
cd apps/frontend

# Full redeploy (if backend URLs changed)
./deploy.sh prod agent-operator-prod

# Quick update (only frontend code changed)
pnpm build
make sync-s3 ENV=prod
make invalidate-cache ENV=prod
```

### Update Both

```bash
# Backend
cd apps/services_old
sam build && sam deploy

# Frontend
cd ../frontend
./deploy.sh prod agent-operator-prod
```

## 🏗️ What Gets Deployed

### Backend (apps/services_old)
- Lambda Functions (Chat, SSE Stream, Policy Details, etc.)
- DynamoDB Tables (Chat History, Events)
- API Gateway Endpoints
- SNS Topics for events
- Bedrock Agent integration

### Frontend (apps/frontend)
- S3 Bucket with static website hosting
- CloudFront Distribution (global CDN)
- Automatic HTTPS
- SPA routing support

## 💰 Estimated Costs

For typical usage (< 10,000 requests/month):
- **Backend**: $5-15/month (Lambda, DynamoDB, API Gateway)
- **Frontend**: $1-5/month (S3, CloudFront)
- **Total**: < $20/month

## 🐛 Troubleshooting

### "Stack already exists"

```bash
# Update existing stack
sam deploy --no-confirm-changeset
```

### "Permission denied: ./deploy.sh"

```bash
chmod +x apps/frontend/deploy.sh
```

### Old content showing on frontend

```bash
cd apps/frontend
make invalidate-cache ENV=prod
```

Wait 5-10 minutes for cache to clear.

### Backend stack not found

Make sure you deployed backend first and use correct stack name:

```bash
# List all stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

### AWS credentials not configured

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1)
```

## 📚 Documentation

- **Complete Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Frontend Details**: [apps/frontend/README.md](apps/frontend/README.md)
- **Frontend Quick Start**: [apps/frontend/QUICKSTART.md](apps/frontend/QUICKSTART.md)

## 🎯 Different Environments

### Production

```bash
# Backend
cd apps/services_old
sam deploy --config-env prod

# Frontend
cd apps/frontend
make deploy-prod BACKEND_STACK=agent-operator-prod
```

### Staging

```bash
# Backend
cd apps/services_old
sam deploy --config-env staging

# Frontend
cd apps/frontend
make deploy-staging BACKEND_STACK=agent-operator-staging
```

### Development

```bash
# Backend
cd apps/services_old
sam deploy --config-env dev

# Frontend
cd apps/frontend
make deploy-dev BACKEND_STACK=agent-operator-dev
```

## 🔐 Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use AWS Secrets Manager for sensitive data
3. ✅ Enable CloudWatch logging
4. ✅ Review IAM permissions regularly
5. ✅ Enable MFA for AWS account
6. ✅ Use different stacks for different environments

## 📊 Monitoring

### View Logs

```bash
# Lambda function logs
aws logs tail /aws/lambda/agent-operator-prod-HelloWorldFunction --follow

# All log groups
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `agent-operator-prod`)].logGroupName'
```

### Check Stack Status

```bash
# Backend
aws cloudformation describe-stacks \
  --stack-name agent-operator-prod \
  --query 'Stacks[0].StackStatus'

# Frontend
aws cloudformation describe-stacks \
  --stack-name purrsurance-frontend-prod \
  --query 'Stacks[0].StackStatus'
```

## 🗑️ Delete Everything (Cleanup)

**Warning**: This will delete all resources!

```bash
# Delete frontend
aws cloudformation delete-stack --stack-name purrsurance-frontend-prod

# Delete backend
aws cloudformation delete-stack --stack-name agent-operator-prod

# Empty S3 buckets first if needed
aws s3 rm s3://purrsurance-frontend-prod-website-prod --recursive
```

## ✨ Next Steps

1. ✅ Deploy backend: `cd apps/services_old && sam deploy --guided`
2. ✅ Deploy frontend: `cd apps/frontend && ./deploy.sh prod agent-operator-prod`
3. ✅ Get CloudFront URL: `make get-urls ENV=prod`
4. ✅ Test application in browser
5. ✅ Configure custom domain (optional)
6. ✅ Set up monitoring and alerts
7. ✅ Configure CI/CD pipeline

## 🆘 Need Help?

- Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed information
- Check [apps/frontend/README.md](apps/frontend/README.md) for frontend specifics
- Review AWS CloudFormation console for stack events
- Check CloudWatch logs for errors

