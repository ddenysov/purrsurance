# Quick Start Guide

Get Purrsurance up and running in 3 simple steps!

## 🚀 Quick Setup (5 minutes)

### 1️⃣ Deploy Backend

```bash
cd apps/services
sam build && sam deploy --guided
```

**Note**: Write down your stack name (e.g., `purrsurance-dev`)

### 2️⃣ Configure Frontend

```bash
cd ../chat
./update-env.sh your-stack-name
```

This automatically fetches your deployed service URLs and creates the `.env` file.

### 3️⃣ Start Application

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` - you're done! 🎉

## ✅ Verify It Works

Open browser console and look for:
```
[SSE] Connecting to: https://...lambda-url...
[SSE] connection opened
```

## 🔄 After Redeployment

When you redeploy backend and URLs change:

```bash
cd apps/chat
./update-env.sh your-stack-name
pnpm dev
```

That's it! The app will use the new URLs automatically.

## 📚 More Info

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [apps/chat/CONFIG.md](./apps/chat/CONFIG.md) - Configuration details
- [apps/chat/README.md](./apps/chat/README.md) - Frontend documentation

## 💡 Pro Tips

1. **Multiple environments?** Use different stack names:
   ```bash
   sam deploy --stack-name purrsurance-dev
   sam deploy --stack-name purrsurance-prod
   ```

2. **Need manual config?** Get URLs with:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name your-stack-name \
     --query 'Stacks[0].Outputs'
   ```

3. **Troubleshooting?** Check CloudFormation outputs match your `.env`:
   ```bash
   cat apps/chat/.env
   ```
