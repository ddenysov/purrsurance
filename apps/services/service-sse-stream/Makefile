.PHONY: help install build deploy clean test logs get-urls update-env

help:
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make build       - Build the SAM application"
	@echo "  make deploy      - Deploy the SAM application"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make test        - Test locally with SAM"
	@echo "  make logs        - Tail CloudWatch logs"
	@echo "  make get-urls    - Get deployed Function URL"
	@echo "  make update-env  - Update env.json with deployed Function URL"

install:
	pnpm install

build:
	sam build

deploy: build
	sam deploy --no-confirm-changeset

clean:
	rm -rf .aws-sam
	rm -rf node_modules

test:
	@echo "Testing SSE Stream service locally"
	@echo "Note: Full streaming is not supported in SAM local"
	sam local invoke SSEStreamFunction --env-vars env.json

logs:
	sam logs --stack-name purrsurance-sse-stream --tail

# Delete the CloudFormation stack
delete:
	@echo "Deleting stack..."
	sam delete

# Get deployed Function URL
get-urls:
	@echo "Fetching deployment URLs..."
	@aws cloudformation describe-stacks \
		--stack-name purrsurance-sse-stream \
		--query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].[OutputKey,OutputValue]' \
		--output table

# Update env.json with deployed Function URL
update-env:
	@echo "Updating env.json with deployed Function URL..."
	@FUNCTION_URL=$$(aws cloudformation describe-stacks \
		--stack-name purrsurance-sse-stream \
		--query 'Stacks[0].Outputs[?OutputKey==`SSEStreamFunctionUrl`].OutputValue' \
		--output text 2>/dev/null || echo ""); \
	if [ -z "$$FUNCTION_URL" ]; then \
		echo "Error: Could not fetch Function URL. Is the stack deployed?"; \
		exit 1; \
	fi; \
	echo "Function URL: $$FUNCTION_URL"; \
	if [ -f env.json ]; then \
		jq --arg url "$$FUNCTION_URL" '.SSEStreamFunction.FUNCTION_URL = $$url' env.json > env.json.tmp && mv env.json.tmp env.json; \
		echo "env.json updated successfully!"; \
	else \
		echo "Error: env.json not found"; \
		exit 1; \
	fi

