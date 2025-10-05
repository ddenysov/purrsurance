S3_BUCKET = purrsurance
BUILD_DIR = dist

deploy:
	@echo ">>> Step 1/2: Full bucket cleanup s3://$(S3_BUCKET)..."
	@aws s3 rm s3://$(S3_BUCKET) --recursive
	@echo ">>> Шаг 2/2: Uploading files from folder '$(BUILD_DIR)' into bucket..."
	@aws s3 sync $(BUILD_DIR) s3://$(S3_BUCKET)
	@echo "\n✅ Deployment successfully finished!"
	@echo "Website updated in bucket s3://$(S3_BUCKET)"

.PHONY: deploy
