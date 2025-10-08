#!/bin/bash

# Deployment script for Purrsurance Frontend to AWS S3 + CloudFront
# Usage: ./deploy.sh [backend-stack-name]
# Example: ./deploy.sh agent-operator

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKEND_STACK_NAME="${1:-}"
FRONTEND_STACK_NAME="purrsurance-frontend"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  Purrsurance Frontend Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "${GREEN}Frontend Stack:${NC} ${FRONTEND_STACK_NAME}"
echo -e "${GREEN}Backend Stack:${NC} ${BACKEND_STACK_NAME:-Not specified}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}Error: SAM CLI is not installed${NC}"
    exit 1
fi

# Step 1: Fetch backend URLs from service stacks
SSE_STREAM_URL=""
API_BASE_URL=""
CHAT_API_URL=""
SERVICE_ROUTER_STACK_NAME="purrsurance-service-router"
SSE_STREAM_STACK_NAME="purrsurance-sse-stream"
BACKEND_CONFIG_SUCCESS=false

echo -e "${YELLOW}Step 1: Fetching backend service URLs...${NC}"

# Get Service Router (Chat) API URL
if aws cloudformation describe-stacks --stack-name "$SERVICE_ROUTER_STACK_NAME" &> /dev/null; then
    CHAT_API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$SERVICE_ROUTER_STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`ServiceRouterApi`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$CHAT_API_URL" ]; then
        echo -e "${GREEN}✓ Chat API URL (ServiceRouter):${NC} ${CHAT_API_URL}"
        BACKEND_CONFIG_SUCCESS=true
    else
        echo -e "${YELLOW}⚠ Warning: Could not retrieve Chat API URL from ServiceRouter stack${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Warning: ServiceRouter stack '${SERVICE_ROUTER_STACK_NAME}' not found${NC}"
fi

# Get SSE Stream URL from service-sse-stream stack
if aws cloudformation describe-stacks --stack-name "$SSE_STREAM_STACK_NAME" &> /dev/null; then
    SSE_STREAM_URL=$(aws cloudformation describe-stacks \
        --stack-name "$SSE_STREAM_STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$SSE_STREAM_URL" ]; then
        echo -e "${GREEN}✓ SSE Stream URL:${NC} ${SSE_STREAM_URL}"
    else
        echo -e "${YELLOW}⚠ Warning: Could not retrieve SSE Stream URL from stack${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Warning: SSE Stream stack '${SSE_STREAM_STACK_NAME}' not found${NC}"
fi

# Get other backend URLs if backend stack name is provided (legacy support)
if [ -n "$BACKEND_STACK_NAME" ]; then
    if aws cloudformation describe-stacks --stack-name "$BACKEND_STACK_NAME" &> /dev/null; then
        # Get API Base URL (if needed from legacy stack)
        API_BASE_URL=$(aws cloudformation describe-stacks \
            --stack-name "$BACKEND_STACK_NAME" \
            --query 'Stacks[0].Outputs[?OutputKey==`HelloWorldApi`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$API_BASE_URL" ]; then
            echo -e "${GREEN}✓ API Base URL (legacy):${NC} ${API_BASE_URL}"
        fi
    else
        echo -e "${YELLOW}⚠ Warning: Backend stack '${BACKEND_STACK_NAME}' not found${NC}"
    fi
fi

if [ -n "$CHAT_API_URL" ] && [ -n "$SSE_STREAM_URL" ]; then
    BACKEND_CONFIG_SUCCESS=true
else
    echo -e "${YELLOW}  Will continue with fallback configuration${NC}"
    BACKEND_CONFIG_SUCCESS=false
fi

# Create .env file with fallback values if needed
if [ "$BACKEND_CONFIG_SUCCESS" = true ]; then
    cat > .env << EOF
NUXT_PUBLIC_CHAT_API_URL=${CHAT_API_URL}
NUXT_PUBLIC_SSE_STREAM_URL=${SSE_STREAM_URL:-https://placeholder.example.com/stream}
NUXT_PUBLIC_API_BASE_URL=${API_BASE_URL:-https://placeholder.example.com/api}
NUXT_PUBLIC_API_TIMEOUT=10000
EOF
    echo -e "${GREEN}✓ Created .env file with backend configuration${NC}"
else
    # Use fallback/placeholder values
    cat > .env << EOF
NUXT_PUBLIC_CHAT_API_URL=https://placeholder.example.com/chat
NUXT_PUBLIC_SSE_STREAM_URL=https://placeholder.example.com/stream
NUXT_PUBLIC_API_BASE_URL=https://placeholder.example.com/api
NUXT_PUBLIC_API_TIMEOUT=10000
EOF
    echo -e "${YELLOW}✓ Created .env file with fallback configuration${NC}"
    echo -e "${YELLOW}  Note: Update backend URLs manually after deployment if needed${NC}"
fi
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Generate static site
echo -e "${YELLOW}Step 3: Generating static Nuxt site...${NC}"
pnpm generate
echo -e "${GREEN}✓ Static site generated successfully${NC}"
echo ""

# Step 4: Deploy CloudFormation stack
echo -e "${YELLOW}Step 4: Deploying CloudFormation stack...${NC}"
sam deploy --no-confirm-changeset
echo -e "${GREEN}✓ CloudFormation stack deployed${NC}"
echo ""

# Step 5: Get S3 bucket name from CloudFormation outputs
echo -e "${YELLOW}Step 5: Getting S3 bucket name...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$FRONTEND_STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: Could not retrieve S3 bucket name${NC}"
    exit 1
fi

echo -e "${GREEN}✓ S3 Bucket:${NC} ${BUCKET_NAME}"
echo ""

# Step 6: Sync built files to S3
echo -e "${YELLOW}Step 6: Uploading files to S3...${NC}"
aws s3 sync dist s3://${BUCKET_NAME}/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with shorter cache
aws s3 sync dist s3://${BUCKET_NAME}/ \
    --exclude "*" \
    --include "*.html" \
    --include "*.json" \
    --cache-control "public, max-age=0, must-revalidate"

echo -e "${GREEN}✓ Files uploaded to S3${NC}"
echo ""

# Step 7: Invalidate CloudFront cache
echo -e "${YELLOW}Step 7: Invalidating CloudFront cache...${NC}"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$FRONTEND_STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" > /dev/null
    echo -e "${GREEN}✓ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}! Could not get CloudFront Distribution ID, skipping cache invalidation${NC}"
fi
echo ""

# Step 8: Display deployment URLs
echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$FRONTEND_STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
    --output text)

S3_WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$FRONTEND_STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

echo -e "${GREEN}CloudFront URL:${NC} ${CLOUDFRONT_URL}"
echo -e "${GREEN}S3 Website URL:${NC} ${S3_WEBSITE_URL}"
echo ""
echo -e "${BLUE}Access your application at:${NC} ${CLOUDFRONT_URL}"
echo ""

