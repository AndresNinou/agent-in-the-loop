#!/bin/bash

echo "☢️  NUCLEAR OPTION - Complete clean slate..."
echo "==========================================="
echo ""

# Warning
echo "⚠️  WARNING: This will completely reset everything!"
echo "   - All VS Code test data"
echo "   - All login sessions" 
echo "   - All cached extensions"
echo ""

read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping all processes..."

# Kill everything related to VS Code and Chrome
pkill -f "VSCode-linux-x64" 2>/dev/null || true
pkill -f "chrome" 2>/dev/null || true
pkill -f "extester" 2>/dev/null || true

# Wait for processes to die
sleep 5

echo "🗑️  Removing all VS Code test data..."

# Remove the entire test directory
if [ -d "vscode-test-persistent" ]; then
    rm -rf vscode-test-persistent
    echo "   Deleted: vscode-test-persistent/"
fi

# Remove any other test artifacts
rm -f *.log
rm -f debug-*.html
rm -f debug-*.png

echo ""
echo "🔧 Reinstalling VS Code and dependencies..."

# Reinstall everything
npm run ui:prep

echo ""
echo "✅ Nuclear clean complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run setup:login"
echo "2. Run: npm run setup:verify"
echo "3. Try: npm run cli 'Hello world'"
