# AI Observer Dashboard - Installation Guide

## Quick Install from Git

### Option 1: Global Installation (Recommended)
```bash
# Install globally from GitHub
npm install -g git+https://github.com/YOUR_USERNAME/ai-observer.git

# Then from ANY project directory:
cd /path/to/your/prisma-project
ai-observe

# Dashboard will be available at:
# http://localhost:3001/modular-fixed
```

### Option 2: Project Dev Dependency
Add to your project's `package.json`:
```json
{
  "devDependencies": {
    "ai-observer": "git+https://github.com/YOUR_USERNAME/ai-observer.git"
  }
}
```

Then:
```bash
npm install
npx ai-observe
```

## Usage

### Basic Usage
```bash
# Run dashboard for current directory
ai-observe

# Run on custom port
ai-observe 3002
```

### Multiple Projects
```bash
# Terminal 1: Project A
cd /project-a
ai-observe 3001

# Terminal 2: Project B  
cd /project-b
ai-observe 3002
```

## Remote Debugging

When running on a remote server, you can debug without SSH:

```bash
# Check health
curl http://SERVER_IP:3001/api/health

# Get diagnostics (tells you everything)
curl http://SERVER_IP:3001/api/diagnostics

# View recent logs
curl http://SERVER_IP:3001/api/logs

# View errors
curl http://SERVER_IP:3001/api/errors
```

## Requirements

Your project must have:
- ✅ Prisma ORM (`prisma/schema.prisma` file)
- ✅ Node.js 14+
- ✅ TypeScript (for ts-node)

## Troubleshooting

### No tables showing?
- Check `/api/diagnostics` - look for `"hasSchema": true`
- Ensure your project uses Prisma (not Drizzle or other ORMs)

### Port already in use?
```bash
ai-observe 3002  # Use different port
```

### Need to see what's happening?
```bash
curl http://localhost:3001/api/diagnostics | python3 -m json.tool
```

This will show:
- Project path
- Whether Prisma schema exists
- Number of tables found
- Recent activity logs
- Any errors

## Features

- 📊 **Dashboard** - Visual overview of your database architecture
- 🔍 **9 Rules Validation** - Code quality checks
- 📋 **Contract Validation** - API contract enforcement
- 🚨 **Real-time Monitoring** - Live error tracking
- 🔧 **Remote Debugging** - Debug without SSH access
- 💾 **In-memory Logging** - No file system pollution