.PHONY: help install build deploy clean logs test

help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make build    - Build the Lambda function"
	@echo "  make deploy   - Deploy to AWS"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make logs     - Tail CloudWatch logs"
	@echo "  make test     - Test the function locally"

install:
	npm install

build:
	sam build

deploy: build
	sam deploy

clean:
	rm -rf .aws-sam
	rm -rf node_modules

logs:
	sam logs --stack-name service-backend --tail

test:
	@echo "Testing endpoint locally..."
	@echo "Start local API with: sam local start-api"

