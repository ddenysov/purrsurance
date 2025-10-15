# Quick Start Guide

Get Purrsurance up and running with automated setup!

## 🚀 Full Automated Setup

### One Command Setup

From the project root, run:

```bash
make setup
```

This single command will:
1. Install all dependencies (root, data, services)
2. Deploy all backend services to AWS
3. Configure action groups for all agents
4. Sync agent IDs in service-router

**Note**: Make sure you have:
- AWS CLI configured with appropriate credentials
- SAM CLI installed
- `jq` installed (`brew install jq` on macOS)

### Setup Database (if needed)

```bash
# Run migrations
make migrate

# Seed with test data
make seed
```

### Start Frontend Application

```bash
cd apps/frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000` - you're done! 🎉

## ✅ Verify It Works

1. Check all services are deployed:
   ```bash
   aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
   ```

2. Check agent IDs are synced:
   ```bash
   cat apps/services/service-router/env.json
   ```

## 🔄 Useful Commands

### Development

```bash
# Install all dependencies
make install

# Test database connection
make test-db

# Run migrations
make migrate

# Seed database
make seed
```

### Deployment

```bash
# Deploy all services only
make deploy-services

# Setup action groups only
make setup-action-groups

# Sync agent IDs only
make sync-agents

# Full setup (install + deploy + configure)
make setup
```

### Maintenance

```bash
# Clean all node_modules
make clean

# Rollback migrations
make migrate-down
```

### Get Help

```bash
# View all available commands
make help
```

## 📚 More Info

### Documentation

- [README.md](./README.md) - Main project documentation
- [MIGRATIONS.md](./MIGRATIONS.md) - Database migrations guide
- [Makefile](./Makefile) - All available automation commands

### Database

- [data/README.md](./data/README.md) - Database setup and management
- [data/SCHEMA.md](./data/SCHEMA.md) - Database schema documentation
- [data/APPOINTMENTS-SCHEMA.md](./data/APPOINTMENTS-SCHEMA.md) - Appointments table schema

### Services

- [service-router](./apps/services/service-router/README.md) - Main routing service
- [service-backend](./apps/services/service-backend/README.md) - Backend API service
- [agent-vet-doctor](./apps/services/agent-vet-doctor/README.md) - Vet Doctor AI agent
- [packages/agent-tools](./packages/agent-tools/README.md) - Shared agent tools package

## 💡 Pro Tips

1. **Deploy specific service manually:**
   ```bash
   cd apps/services/service-backend
   make deploy
   ```

2. **View deployed stack outputs:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name purrsurance-service-backend \
     --query 'Stacks[0].Outputs'
   ```

3. **List all agents:**
   ```bash
   cd apps/services/service-router
   make list-agents
   ```

4. **View service logs:**
   ```bash
   cd apps/services/service-backend
   make logs
   ```

## 🐛 Troubleshooting

- **AWS credentials not configured?** Run `aws configure`
- **SAM CLI not installed?** Visit https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
- **Database connection issues?** Check your `data/env.json` configuration
- **Agent sync issues?** Manually run `cd apps/services/service-router && make sync-agents`
