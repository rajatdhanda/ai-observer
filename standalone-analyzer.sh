#!/bin/bash

# Simple standalone analyzer that downloads and runs AI Observer without cloning

echo "🤖 AI Observer Quick Analyzer"
echo "----------------------------"

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

echo "📦 Downloading AI Observer..."
git clone --depth 1 https://github.com/rajatdhanda/ai-observer.git > /dev/null 2>&1

cd ai-observer
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1

echo "🔍 Analyzing your project..."
npm run smart-analyze "$OLDPWD"

echo "✅ Analysis complete! Check src/contracts/fixes.json"

# Cleanup
cd $OLDPWD
rm -rf $TEMP_DIR