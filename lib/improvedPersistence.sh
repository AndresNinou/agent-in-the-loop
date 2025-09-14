#!/bin/bash

# Improved Persistence System
# Monitors and maintains VS Code state files for better authentication persistence

# Use STORAGE_DIR environment variable if provided, otherwise default to vscode-test-persistent
STORAGE_PATH="${STORAGE_DIR:-./vscode-test-persistent}"
STATE_FILE="$STORAGE_PATH/settings/User/globalStorage/state.vscdb"
BACKUP_FILE="$STORAGE_PATH/state.vscdb.backup"
LOCK_FILE="/tmp/vscode-persistence.lock"

echo "🔐 IMPROVED PERSISTENCE SYSTEM ACTIVE"
echo "📦 Backup: $BACKUP_FILE"  
echo "📍 Target: $STATE_FILE"
echo ""

# Function to check if VS Code is actively writing
is_vscode_active() {
    # Check if any VS Code processes are running
    if pgrep -f "VSCode-linux-x64/code" > /dev/null; then
        # Check if the file was modified in the last 5 seconds
        if [ -f "$STATE_FILE" ]; then
            local file_age=$(($(date +%s) - $(stat -c %Y "$STATE_FILE" 2>/dev/null || echo 0)))
            if [ $file_age -lt 5 ]; then
                return 0  # VS Code is actively writing
            fi
        fi
    fi
    return 1  # VS Code not actively writing
}

# Function to restore state safely
restore_state() {
    if [ -f "$BACKUP_FILE" ]; then
        # Don't restore if VS Code is actively writing
        if is_vscode_active; then
            echo "⏳ VS Code active, delaying restore..."
            return
        fi
        
        mkdir -p "$STATE_DIR"
        cp "$BACKUP_FILE" "$STATE_FILE" 2>/dev/null
        if [ $? -eq 0 ]; then
            SIZE=$(du -h "$STATE_FILE" 2>/dev/null | cut -f1 || echo "unknown")
            echo "✅ Restored state file ($SIZE)"
        else
            echo "❌ Failed to restore state file"
        fi
    else
        echo "⚠️  No backup file found at $BACKUP_FILE"
    fi
}

# Function to backup current state
backup_state() {
    if [ -f "$STATE_FILE" ] && [ $(stat -c%s "$STATE_FILE" 2>/dev/null || echo 0) -gt 100000 ]; then
        cp "$STATE_FILE" "$BACKUP_FILE" 2>/dev/null
        if [ $? -eq 0 ]; then
            SIZE=$(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1 || echo "unknown")
            echo "💾 Backed up state file ($SIZE)"
        fi
    fi
}

# Create lock file
echo $$ > "$LOCK_FILE"

# Cleanup function
cleanup() {
    echo "🧼 Cleaning up persistence system..."
    rm -f "$LOCK_FILE"
    exit 0
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Initial restore with delay
echo "⏳ Waiting 3 seconds before initial restore..."
sleep 3
restore_state

# Backup any existing good state
backup_state

echo "👁️  Monitoring state file (intelligent mode)..."
last_restore_time=0
last_backup_time=0
current_time=$(date +%s)

while true; do
    current_time=$(date +%s)
    
    # Check if state file is missing or too small
    if [ ! -f "$STATE_FILE" ] || [ $(stat -c%s "$STATE_FILE" 2>/dev/null || echo 0) -lt 50000 ]; then
        # Only restore if we haven't done so recently and VS Code isn't active
        if [ $((current_time - last_restore_time)) -gt 10 ]; then
            if ! is_vscode_active; then
                echo "⚠️  State file missing/small, restoring..."
                restore_state
                last_restore_time=$current_time
            fi
        fi
    else
        # Backup good state periodically
        if [ $((current_time - last_backup_time)) -gt 30 ]; then
            backup_state
            last_backup_time=$current_time
        fi
    fi
    
    # Less frequent checking
    sleep 2
done
