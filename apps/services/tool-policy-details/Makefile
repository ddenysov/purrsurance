.PHONY: build deploy invoke clean help

help:
	@echo "Available targets:"
	@echo "  build   - Build the Lambda function"
	@echo "  deploy  - Deploy the Lambda function to AWS"
	@echo "  invoke  - Invoke the Lambda function locally with test event"
	@echo "  clean   - Clean build artifacts"

build:
	sam build

deploy: build
	sam deploy --no-confirm-changeset

invoke:
	sam local invoke GetPolicyDetailsFunction -e events/bedrock-agent-event.json --env-vars env.json

clean:
	rm -rf .aws-sam

