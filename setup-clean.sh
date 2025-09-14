#!/bin/bash

echo "🧹 Cleaning VS Code persistence state..."
echo "======================================="
echo ""

# Stop any running VS Code processes
echo "Stopping VS Code processes..."
pkill -f "VSCode-linux-x64" 2>/dev/null || true
pkill -f "chrome" 2>/dev/null || true
sleep 2

# Remove state files
STATE_DIR="vscode-test-persistent/settings/User/globalStorage"
STATE_FILE="$STATE_DIR/state.vscdb"
BACKUP_FILE="${STATE_FILE}.backup"

if [ -f "$STATE_FILE" ]; then
    echo "🗑️  Removing state file: $STATE_FILE"
    rm -f "$STATE_FILE"
fi

if [ -f "$BACKUP_FILE" ]; then
    echo "🗑️  Removing backup file: $BACKUP_FILE"
    rm -f "$BACKUP_FILE"
fi

# Remove lock files and other persistence artifacts
echo "🗑️  Cleaning persistence artifacts..."
rm -f "$STATE_DIR"/*.lock
rm -f "$STATE_DIR"/state.vscdb.*

echo ""
echo "✅ Clean complete! State files removed."
echo ""
echo "Next steps:"
echo "- Run: npm run setup:login (to create fresh login session)"
