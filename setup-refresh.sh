#!/bin/bash

echo "🔄 Refreshing persistence setup..."
echo "================================="
echo ""

STATE_FILE="vscode-test-persistent/settings/User/globalStorage/state.vscdb"
BACKUP_FILE="${STATE_FILE}.backup"

# Check if we have a good backup to restore from
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    if [ "$BACKUP_SIZE" -gt 100000 ]; then
        echo "📦 Found good backup file (${BACKUP_SIZE} bytes)"
        echo "🔄 Restoring from backup..."
        
        # Stop processes first
        pkill -f "VSCode-linux-x64" 2>/dev/null || true
        sleep 2
        
        # Restore from backup
        cp "$BACKUP_FILE" "$STATE_FILE"
        echo "✅ Restored state from backup"
        
        # Verify
        ./setup-verify.sh
        exit 0
    fi
fi

echo "⚠️  No good backup found - running fresh setup..."
./setup-fresh.sh
