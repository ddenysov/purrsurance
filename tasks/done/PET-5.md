# PET-5: Deploy Website to AWS S3 Static Hosting

## Description
Set up and deploy the Purrsurance chat application to AWS S3 as a static website. This includes configuring S3 buckets, setting up CloudFront CDN for better performance and SSL support, and implementing a deployment pipeline for easy updates.

## Business Logic
1. **Static Site Generation**: Configure Nuxt to generate a fully static version of the application
2. **S3 Hosting**: Set up S3 bucket with static website hosting enabled
3. **CloudFront CDN**: Configure CDN for faster global access and HTTPS support
4. **Deployment Automation**: Create deployment scripts for easy updates

## Technical Overview

### Infrastructure Components
1. **S3 Bucket** - Primary hosting for static files
2. **CloudFront Distribution** - CDN for performance and SSL
3. **Route 53** (optional) - DNS management for custom domain
4. **Build Configuration** - Nuxt static site generation setup

### Deployment Flow
```
Local Build → Generate Static Files → Upload to S3 → Invalidate CloudFront Cache → Site Updated
```

---

## Implementation Steps

### Step 1: Configure Nuxt for Static Site Generation

**What to do:**
Update Nuxt configuration to support static site generation and optimize for production.

**Code changes in `apps/chat/nuxt.config.ts`:**

Update the export configuration:
```typescript
export default defineNuxtConfig({
  // Existing config...
  
  ssr: false, // Disable SSR for pure static generation
  
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },
  
  app: {
    baseURL: '/', // Update if deploying to subdirectory
    buildAssetsDir: '/_nuxt/',
    cdnURL: '', // Add CloudFront URL after setup
  },
  
  // Optimize for production
  experimental: {
    payloadExtraction: false,
  },
  
  // Existing modules, devtools, etc...
})
```

**Important notes:**
- `ssr: false` ensures client-side only rendering
- `nitro.preset: 'static'` generates static HTML files
- `prerender.routes` lists all routes to generate (add more if needed)
- Update `cdnURL` after CloudFront is configured

---

### Step 2: Add Build Scripts

**What to do:**
Add npm scripts for building and deploying the static site.

**Code changes in `apps/chat/package.json`:**

Add to the `scripts` section:
```json
{
  "scripts": {
    // ... existing scripts
    "generate": "nuxt generate",
    "deploy:build": "nuxt generate",
    "deploy:upload": "aws s3 sync .output/public s3://purrsurance-app --delete",
    "deploy:invalidate": "aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths '/*'",
    "deploy": "pnpm deploy:build && pnpm deploy:upload && pnpm deploy:invalidate"
  }
}
```

**Important notes:**
- `generate` creates static files in `.output/public`
- `deploy:upload` syncs files to S3 (requires AWS CLI)
- `deploy:invalidate` clears CloudFront cache
- `deploy` runs all steps in sequence

---

### Step 3: Create AWS Infrastructure Setup Script

**What to do:**
Create a script to set up S3 bucket with proper configuration.

**Create new file: `apps/chat/scripts/setup-s3.sh`**

```bash
#!/bin/bash

# Configuration
BUCKET_NAME="purrsurance-app"
REGION="us-east-1"
CLOUDFRONT_ORIGIN_ID="purrsurance-s3-origin"

echo "Setting up S3 bucket for static hosting..."

# Create S3 bucket
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION \
  --create-bucket-configuration LocationConstraint=$REGION 2>/dev/null || echo "Bucket already exists"

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME/ \
  --index-document index.html \
  --error-document index.html

# Create bucket policy for public read access
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json

# Enable CORS
cat > /tmp/cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file:///tmp/cors-config.json

echo "S3 bucket configured successfully!"
echo "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

# Clean up temp files
rm /tmp/bucket-policy.json /tmp/cors-config.json
```

Make the script executable:
```bash
chmod +x apps/chat/scripts/setup-s3.sh
```

**Important notes:**
- Update `BUCKET_NAME` to your desired bucket name
- Update `REGION` if deploying to different region
- Error document is also `index.html` for SPA routing support
- Script is idempotent (safe to run multiple times)

---

### Step 4: Create CloudFront Distribution Setup Script

**What to do:**
Create a script to set up CloudFront CDN with SSL support.

**Create new file: `apps/chat/scripts/setup-cloudfront.sh`**

```bash
#!/bin/bash

# Configuration
BUCKET_NAME="purrsurance-app"
REGION="us-east-1"
DOMAIN_NAME="$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "Setting up CloudFront distribution..."

# Create CloudFront distribution config
cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "purrsurance-$(date +%s)",
  "Comment": "Purrsurance Chat App CDN",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "purrsurance-s3-origin",
        "DomainName": "$DOMAIN_NAME",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "purrsurance-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

# Create distribution
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cloudfront-config.json \
  --query 'Distribution.Id' \
  --output text)

echo "CloudFront distribution created!"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "Getting CloudFront domain name..."

# Wait a moment for distribution to be created
sleep 5

CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text)

echo ""
echo "=== DEPLOYMENT INFO ==="
echo "CloudFront Domain: https://$CLOUDFRONT_DOMAIN"
echo "Distribution ID: $DISTRIBUTION_ID"
echo ""
echo "Add this to your environment:"
echo "export CLOUDFRONT_DIST_ID=$DISTRIBUTION_ID"
echo ""
echo "Note: Distribution deployment takes 15-20 minutes to complete globally"

# Clean up
rm /tmp/cloudfront-config.json
```

Make the script executable:
```bash
chmod +x apps/chat/scripts/setup-cloudfront.sh
```

**Important notes:**
- Creates CloudFront distribution with HTTPS redirect
- Custom error response routes 404s to index.html (for SPA routing)
- Compression enabled for better performance
- Save the Distribution ID for cache invalidation

---

### Step 5: Create Deployment Documentation

**What to do:**
Create comprehensive deployment documentation.

**Create new file: `apps/chat/DEPLOYMENT.md`**

```markdown
# Deployment Guide - Purrsurance Chat App

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **Node.js and pnpm installed**
   ```bash
   node --version
   pnpm --version
   ```

3. **AWS Credentials** with permissions for:
   - S3 (create bucket, upload files, set policies)
   - CloudFront (create distribution, invalidate cache)

## Initial Setup (One-time)

### Step 1: Create S3 Bucket
```bash
cd apps/chat
./scripts/setup-s3.sh
```

This creates and configures the S3 bucket for static hosting.

### Step 2: Create CloudFront Distribution
```bash
./scripts/setup-cloudfront.sh
```

**Important:** Save the Distribution ID from the output!

### Step 3: Set Environment Variable
```bash
# Add to your ~/.zshrc or ~/.bashrc
export CLOUDFRONT_DIST_ID="YOUR_DISTRIBUTION_ID"
```

### Step 4: Update Nuxt Config (Optional)
If you want to use CloudFront URL for assets:
```typescript
// apps/chat/nuxt.config.ts
export default defineNuxtConfig({
  app: {
    cdnURL: 'https://YOUR_CLOUDFRONT_DOMAIN',
  },
})
```

## Deployment Process

### Deploy to Production
```bash
cd apps/chat
pnpm deploy
```

This will:
1. Generate static files (`nuxt generate`)
2. Upload to S3 (`aws s3 sync`)
3. Invalidate CloudFront cache

### Manual Steps

**Build only:**
```bash
pnpm deploy:build
```

**Upload to S3:**
```bash
pnpm deploy:upload
```

**Invalidate cache:**
```bash
pnpm deploy:invalidate
```

## Troubleshooting

### Issue: AWS CLI not found
```bash
# Install AWS CLI
brew install awscli  # macOS
# or follow: https://aws.amazon.com/cli/
```

### Issue: Access Denied
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions for S3 and CloudFront

### Issue: CloudFront distribution not found
- Verify Distribution ID: `echo $CLOUDFRONT_DIST_ID`
- Check if distribution exists: `aws cloudfront list-distributions`

### Issue: Files not updating
- Force cache invalidation: `pnpm deploy:invalidate`
- Wait 1-2 minutes for invalidation to complete
- Clear browser cache

### Issue: 404 errors on refresh
- Verify CloudFront custom error response is set (404 → /index.html)
- Check S3 error document setting

## Custom Domain Setup (Optional)

### Prerequisites
- Domain registered in Route 53 or external registrar
- SSL certificate in AWS Certificate Manager (must be in us-east-1)

### Steps
1. Request SSL certificate in ACM (us-east-1 region)
2. Update CloudFront distribution to use custom domain and certificate
3. Create Route 53 alias record pointing to CloudFront
4. Wait for DNS propagation (up to 48 hours)

## Cost Estimation

- **S3 Storage:** ~$0.023 per GB/month
- **S3 Requests:** ~$0.0004 per 1000 GET requests
- **CloudFront:** $0.085 per GB data transfer (first 10TB)
- **Route 53:** $0.50 per hosted zone/month

**Estimated monthly cost:** $1-5 for low traffic site

## Monitoring

### Check CloudFront Distribution Status
```bash
aws cloudfront get-distribution --id $CLOUDFRONT_DIST_ID
```

### Check S3 Bucket Size
```bash
aws s3 ls s3://purrsurance-app --recursive --human-readable --summarize
```

### View CloudFront Logs (if enabled)
```bash
aws s3 ls s3://purrsurance-app-logs/
```

## Security Best Practices

1. Enable S3 bucket versioning for rollback capability
2. Enable CloudFront access logging
3. Use CloudFront geo-restrictions if needed
4. Regularly update dependencies: `pnpm update`
5. Monitor AWS billing alerts

## Rollback Procedure

If deployment causes issues:

1. Restore previous S3 version (if versioning enabled)
2. Or redeploy previous working version
3. Invalidate CloudFront cache

## CI/CD Integration (Future)

This setup can be integrated with:
- GitHub Actions
- GitLab CI
- AWS CodePipeline
- Netlify/Vercel (alternative platforms)
```

---

### Step 6: Update .gitignore

**What to do:**
Ensure generated files are not committed to git.

**Add to `apps/chat/.gitignore`:**
```
# Nuxt build output
.output
.nuxt
dist
.nitro

# Deployment
.env.local
.env.production

# Scripts output
*.log
```

**Important notes:**
- `.output` contains generated static files
- Don't commit AWS credentials or distribution IDs
- Deployment scripts should be committed

---

## Acceptance Criteria

- [ ] Nuxt configured for static site generation
- [ ] S3 bucket created and configured for static hosting
- [ ] CloudFront distribution set up with HTTPS
- [ ] Deployment scripts working correctly
- [ ] Documentation complete with troubleshooting guide
- [ ] SPA routing works (no 404 on page refresh)
- [ ] Assets load correctly from CDN
- [ ] Cache invalidation works after deployment
- [ ] Site accessible via CloudFront HTTPS URL
- [ ] Build completes without errors

---

## Testing Checklist

After deployment, verify:

1. **Home page loads:** https://YOUR_CLOUDFRONT_DOMAIN
2. **Chat functionality works:** Send messages, receive responses
3. **Pet profile displays:** All components render correctly
4. **Assets load:** Images, CSS, JavaScript files
5. **SPA routing:** Refresh page doesn't cause 404
6. **Mobile responsive:** Test on mobile devices
7. **HTTPS works:** No mixed content warnings
8. **Performance:** Fast load times globally
9. **Console errors:** No JavaScript errors in browser console
10. **Network requests:** Check all API calls work (if any)

---

## Important Notes for AI Agent

### DO:
✅ Test the build locally before deploying: `pnpm generate`
✅ Verify AWS CLI is installed and configured
✅ Save CloudFront Distribution ID in secure location
✅ Test deployment to ensure all files upload correctly
✅ Verify SPA routing works after deployment
✅ Check for console errors after deployment
✅ Document any custom configuration changes

### DON'T:
❌ Don't commit AWS credentials to git
❌ Don't skip CloudFront cache invalidation
❌ Don't use root AWS account for deployment
❌ Don't forget to make scripts executable (chmod +x)
❌ Don't deploy without testing build locally first
❌ Don't modify S3 bucket policy to private after setup
❌ Don't forget to update DNS if using custom domain

### Security Considerations:
- Use IAM user with minimal required permissions
- Enable S3 bucket versioning for rollback capability
- Consider enabling CloudFront access logs
- Regularly review AWS billing for unexpected charges
- Use environment variables for sensitive configuration

### Performance Optimization:
- Enable compression in CloudFront (already in config)
- Set appropriate cache headers
- Optimize images before deployment
- Consider using WebP format for images
- Enable HTTP/2 in CloudFront (default)

### Cost Optimization:
- Use CloudFront PriceClass_100 (North America & Europe)
- Set appropriate cache TTLs to reduce S3 requests
- Enable S3 intelligent tiering for large sites
- Monitor CloudFront data transfer costs

---

## Priority
Medium

## Estimated Time
3-4 hours (including testing and documentation)

## Created
2025-10-05

## Assignee
DevOps / AI Agent

## Labels
deployment, infrastructure, aws, s3, cloudfront, devops

## Dependencies
- All application features completed (PET-1, PET-2, PET-3, PET-4)
- AWS account with appropriate permissions
- AWS CLI installed and configured

## Files to Create/Modify
1. `apps/chat/nuxt.config.ts` (modify)
2. `apps/chat/package.json` (modify)
3. `apps/chat/scripts/setup-s3.sh` (create)
4. `apps/chat/scripts/setup-cloudfront.sh` (create)
5. `apps/chat/DEPLOYMENT.md` (create)
6. `apps/chat/.gitignore` (modify)

## External Resources
- [AWS S3 Static Hosting Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Nuxt Static Site Generation](https://nuxt.com/docs/getting-started/deployment#static-hosting)
- [AWS CLI Installation](https://aws.amazon.com/cli/)

---

## Success Criteria Summary

**Infrastructure Setup:**
1. S3 bucket configured for static hosting
2. CloudFront distribution with HTTPS enabled
3. Proper error handling for SPA routing
4. Cache invalidation working

**Deployment Process:**
1. One-command deployment (`pnpm deploy`)
2. Automatic build and upload
3. Cache invalidation after upload
4. Clear documentation for future deployments

**Verification:**
1. Site accessible via HTTPS
2. All features working in production
3. Fast load times globally
4. No console errors or broken links
