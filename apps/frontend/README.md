# Purrsurance Chat Application

AI-powered pet insurance assistant built with Nuxt 3, featuring real-time SSE updates and AWS Bedrock integration.

## Prerequisites

- Node.js 20+
- AWS CLI configured (for CloudFormation integration)
- Access to deployed AWS CloudFormation stack

## Setup

### 1. Install Dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 2. Configure Environment Variables

The application needs to know the URLs of your deployed AWS services. You have two options:

#### Option A: Automatic Configuration (Recommended)

Run the automated script to fetch URLs from your CloudFormation stack:

```bash
# Using default stack name (purrsurance-dev)
./update-env.sh

# Or specify your stack name
./update-env.sh your-stack-name
```

This will create a `.env` file with the correct URLs from your CloudFormation outputs.

#### Option B: Manual Configuration

Create a `.env` file in this directory with the following content:

```bash
# Get these URLs from CloudFormation stack outputs
NUXT_PUBLIC_SSE_STREAM_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws/stream
NUXT_PUBLIC_API_BASE_URL=https://your-api-gateway.execute-api.us-east-1.amazonaws.com/Prod
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_APP_ENV=development
```

To get the URLs manually:
- Go to AWS CloudFormation console
- Select your stack
- Go to "Outputs" tab
- Copy `SSEStreamFunctionUrl` and `HelloWorldApi` values

📖 See [CONFIG.md](./CONFIG.md) for detailed configuration instructions.

### 3. Verify Configuration

After setting up environment variables, verify they're correct:

```bash
# Check your .env file
cat .env

# Make sure the URLs match your CloudFormation outputs
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

When the server starts, open your browser and check the console. You should see:
```
[SSE] Connecting to: https://your-lambda-url.lambda-url.us-east-1.on.aws/stream
[SSE] connection opened
```

If you see a hardcoded URL or connection errors, check your `.env` file configuration.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Configuration Management

### Updating After Redeployment

When you redeploy your CloudFormation stack and URLs change:

```bash
# Simply run the update script again
./update-env.sh your-stack-name

# Restart the dev server
npm run dev
```

### Environment-Specific Configuration

For different environments, create separate `.env` files:

- `.env.development` - local development
- `.env.staging` - staging environment  
- `.env.production` - production environment

Nuxt will automatically load the correct file based on `NODE_ENV`.

### Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NUXT_PUBLIC_SSE_STREAM_URL` | SSE stream endpoint for real-time updates | `http://localhost:3002/stream` |
| `NUXT_PUBLIC_API_BASE_URL` | Base URL for API requests | `http://localhost:3001/api` |
| `NUXT_PUBLIC_API_TIMEOUT` | API request timeout in milliseconds | `10000` |
| `NUXT_PUBLIC_APP_ENV` | Application environment | `development` |

## Architecture

- **Framework**: Nuxt 3
- **UI**: Tailwind CSS with custom pet-themed design system
- **State Management**: Pinia
- **Real-time Updates**: Server-Sent Events (SSE)
- **AI Backend**: AWS Bedrock Agents
- **Session Management**: UUID-based sessions with DynamoDB

## Project Structure

```
app/
├── components/      # Vue components
│   ├── chat/       # Chat-related components
│   ├── pet/        # Pet profile components
│   └── modals/     # Modal dialogs
├── composables/    # Reusable composition functions
├── pages/          # Application pages
├── stores/         # Pinia stores
├── types/          # TypeScript type definitions
└── utils/          # Utility functions and configs
```

## Key Features

- 🐾 Pet profile management with vaccination tracking
- 💬 Real-time AI chat powered by AWS Bedrock
- 📊 Policy details and coverage information
- 🔔 Real-time event notifications via SSE
- 📱 Responsive design for mobile and desktop
- 🔒 Session-based user isolation

## Troubleshooting

### Issue: Hardcoded URLs still appearing

**Solution**: Clear Nuxt cache and rebuild
```bash
rm -rf .nuxt .output
npm run dev
```

### Issue: SSE connection fails

**Possible causes**:
1. Wrong URL in `.env` file
2. Lambda function not deployed
3. CORS issues

**Solution**: 
```bash
# Verify your configuration
cat .env

# Check CloudFormation outputs match
aws cloudformation describe-stacks --stack-name your-stack-name --query 'Stacks[0].Outputs'

# Re-run the update script
./update-env.sh your-stack-name
```

### Issue: Environment variables not loading

**Solution**: Make sure `.env` file is in the correct location (`apps/chat/.env`) and restart dev server

## Documentation

- [CONFIG.md](./CONFIG.md) - Detailed configuration guide
- [Nuxt Documentation](https://nuxt.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Development Tips

1. **Use the browser console** - All SSE events and API calls are logged
2. **Check session ID** - Each session gets a unique ID, visible in console
3. **Monitor CloudWatch** - Lambda logs show backend activity
4. **Test with different pets** - Profile data updates based on events

## License

Proprietary - Purrsurance Project
