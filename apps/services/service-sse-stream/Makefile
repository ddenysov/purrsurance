.PHONY: help install build deploy clean test logs

help:
	@echo "Available commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make build     - Build the SAM application"
	@echo "  make deploy    - Deploy the SAM application"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make test      - Test locally with SAM"
	@echo "  make logs      - Tail CloudWatch logs"

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

