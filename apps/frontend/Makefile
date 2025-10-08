# Makefile for Purrsurance Frontend Deployment

.PHONY: help install build dev deploy clean

# Stack name
BACKEND_STACK ?= agent-operator
FRONTEND_STACK = purrsurance-frontend

help: ## Show this help message
	@echo 'Usage: make [target] [BACKEND_STACK=stack-name]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	@echo "Installing dependencies..."
	pnpm install

build: ## Build the Nuxt application
	@echo "Building application..."
	pnpm build

generate: ## Generate the Nuxt application
	@echo "Building application..."
	pnpm generate


dev: ## Start development server
	@echo "Starting development server..."
	pnpm dev

deploy: ## Deploy to AWS (use BACKEND_STACK=stack-name)
	@echo "Deploying application..."
	@chmod +x deploy.sh
	./deploy.sh $(BACKEND_STACK)

sam-validate: ## Validate SAM template
	@echo "Validating SAM template..."
	sam validate

sam-deploy-only: ## Deploy only CloudFormation stack (no build)
	@echo "Deploying CloudFormation stack..."
	sam deploy

sync-s3: ## Sync built files to S3
	@echo "Syncing files to S3..."
	@BUCKET_NAME=$$(aws cloudformation describe-stacks \
		--stack-name $(FRONTEND_STACK) \
		--query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
		--output text) && \
	aws s3 sync .output/public s3://$$BUCKET_NAME/ --delete

upload: generate sync-s3

invalidate-cache: ## Invalidate CloudFront cache
	@echo "Invalidating CloudFront cache..."
	@DISTRIBUTION_ID=$$(aws cloudformation describe-stacks \
		--stack-name $(FRONTEND_STACK) \
		--query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
		--output text) && \
	aws cloudfront create-invalidation --distribution-id $$DISTRIBUTION_ID --paths "/*"

get-urls: ## Get deployment URLs
	@echo "Fetching deployment URLs..."
	@aws cloudformation describe-stacks \
		--stack-name $(FRONTEND_STACK) \
		--query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL` || OutputKey==`WebsiteURL`].[OutputKey,OutputValue]' \
		--output table

delete-stack: ## Delete CloudFormation stack (DANGEROUS!)
	@echo "WARNING: This will delete the stack $(FRONTEND_STACK)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		aws cloudformation delete-stack --stack-name $(FRONTEND_STACK); \
		echo "Stack deletion initiated..."; \
	fi

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf .nuxt .output node_modules/.cache
	rm -f .env

logs-cloudfront: ## View CloudFront access logs (if enabled)
	@echo "CloudFront logs not enabled by default"

status: ## Check stack status
	@aws cloudformation describe-stacks \
		--stack-name $(FRONTEND_STACK) \
		--query 'Stacks[0].[StackName,StackStatus]' \
		--output table

.DEFAULT_GOAL := help

