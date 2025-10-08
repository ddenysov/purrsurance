.PHONY: help build deploy clean test logs

help:
	@echo "Available commands:"
	@echo "  make build     - Build the SAM application"
	@echo "  make deploy    - Deploy the SAM application"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make test      - Test locally with SAM"
	@echo "  make logs      - Tail CloudWatch logs"

build:
	sam build

deploy: build
	sam deploy

clean:
	rm -rf .aws-sam
	rm -rf node_modules

test:
	./test-local.sh

logs:
	sam logs --stack-name purrsurance-event-publisher --tail

