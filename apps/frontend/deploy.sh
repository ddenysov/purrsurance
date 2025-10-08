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

# Step 1: Fetch backend URLs if backend stack name is provided
SSE_STREAM_URL=""
API_BASE_URL=""
BACKEND_CONFIG_SUCCESS=false

if [ -n "$BACKEND_STACK_NAME" ]; then
    echo -e "${YELLOW}Step 1: Fetching backend service URLs...${NC}"
    
    # Check if backend stack exists
    if ! aws cloudformation describe-stacks --stack-name "$BACKEND_STACK_NAME" &> /dev/null; then
        echo -e "${YELLOW}⚠ Warning: Backend stack '${BACKEND_STACK_NAME}' not found${NC}"
        echo -e "${YELLOW}  Will continue with fallback configuration${NC}"
    else
        # Get SSE Stream URL
        SSE_STREAM_URL=$(aws cloudformation describe-stacks \
            --stack-name "$BACKEND_STACK_NAME" \
            --query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        # Get API Base URL
        API_BASE_URL=$(aws cloudformation describe-stacks \
            --stack-name "$BACKEND_STACK_NAME" \
            --query 'Stacks[0].Outputs[?OutputKey==`HelloWorldApi`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [ -z "$SSE_STREAM_URL" ] || [ -z "$API_BASE_URL" ]; then
            echo -e "${YELLOW}⚠ Warning: Could not retrieve all backend URLs from stack${NC}"
            echo -e "${YELLOW}  Will continue with fallback configuration${NC}"
        else
            echo -e "${GREEN}✓ SSE Stream URL:${NC} ${SSE_STREAM_URL}"
            echo -e "${GREEN}✓ API Base URL:${NC} ${API_BASE_URL}"
            BACKEND_CONFIG_SUCCESS=true
        fi
    fi
fi

# Create .env file with fallback values if needed
if [ "$BACKEND_CONFIG_SUCCESS" = true ]; then
    cat > .env << EOF
NUXT_PUBLIC_SSE_STREAM_URL=${SSE_STREAM_URL}
NUXT_PUBLIC_API_BASE_URL=${API_BASE_URL}
NUXT_PUBLIC_API_TIMEOUT=10000
EOF
    echo -e "${GREEN}✓ Created .env file with backend configuration${NC}"
else
    # Use fallback/placeholder values
    cat > .env << EOF
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

