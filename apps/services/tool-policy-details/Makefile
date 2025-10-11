.PHONY: build deploy invoke clean help sync-packages

PACKAGES_DIR = ../../../packages
VENDOR_DIR = ./vendor


help:
	@echo "Available targets:"
	@echo "  build   - Build the Lambda function"
	@echo "  deploy  - Deploy the Lambda function to AWS"
	@echo "  invoke  - Invoke the Lambda function locally with test event"
	@echo "  clean   - Clean build artifacts"

build:
	sam build

deploy: sync-packages build
	sam deploy --no-confirm-changeset

invoke:
	sam local invoke GetPolicyDetailsFunction -e events/bedrock-agent-event.json --env-vars env.json

clean:
	rm -rf .aws-sam


sync-packages:
	@echo "Syncing packages from $(PACKAGES_DIR) to $(VENDOR_DIR)..."
	@mkdir -p $(VENDOR_DIR)
	@for package_dir in $(PACKAGES_DIR)/*/; do \
		if [ -d "$$package_dir/dist" ]; then \
			package_name=$$(basename $$package_dir); \
			echo "  Copying $$package_name..."; \
			mkdir -p $(VENDOR_DIR)/$$package_name; \
			cp -r $$package_dir/dist/* $(VENDOR_DIR)/$$package_name/; \
		fi \
	done
	@echo "Package sync complete!"