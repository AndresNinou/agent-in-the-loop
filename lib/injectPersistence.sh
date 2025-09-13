#!/bin/bash

# This script continuously monitors and restores the state.vscdb file
# to ensure persistence even when ExTester tries to clear it

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PROJECT_DIR/vscode-test-persistent/settings/User/globalStorage/state.vscdb"
BACKUP_FILE="$PROJECT_DIR/vscode-test-persistent/state.vscdb.backup"

echo "🔐 PERSISTENCE INJECTOR ACTIVE"
echo "📦 Backup: $BACKUP_FILE"
echo "📍 Target: $STATE_FILE"
echo ""

# Function to restore state
restore_state() {
    if [ -f "$BACKUP_FILE" ]; then
        mkdir -p "$(dirname "$STATE_FILE")"
        cp "$BACKUP_FILE" "$STATE_FILE"
        SIZE=$(du -h "$STATE_FILE" | cut -f1)
        echo "✅ Restored state file ($SIZE)"
    fi
}

# Initial restore
restore_state

# Monitor and restore continuously
echo "👁️  Monitoring for state file deletion..."
while true; do
    if [ ! -f "$STATE_FILE" ] || [ $(stat -c%s "$STATE_FILE") -lt 100000 ]; then
        echo "⚠️  State file missing or too small, restoring..."
        restore_state
    fi
    sleep 1
done
