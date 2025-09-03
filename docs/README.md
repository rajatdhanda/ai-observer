# AI Observer

A tool to validate AI-generated code against your schemas and prevent type drift.

## What It Does
- ✅ Detects when AI creates new interfaces/types instead of importing from schemas
- ✅ Validates types match your Zod schemas
- ✅ Watch mode for real-time validation
- ✅ Database structure validation (ready to use)

## Usage

### Check a file
```bash
npm run check test-project/example.tsx