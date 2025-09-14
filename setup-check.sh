#!/bin/bash

echo "🔍 Quick persistence check..."
echo "============================"
echo ""

# Check VS Code processes
VSCODE_PROCS=$(ps aux | grep -E "(chrome|vscode|VSCode)" | grep -v grep | wc -l)
echo "VS Code processes running: $VSCODE_PROCS"

# Check persistence processes  
PERSISTENCE_PROCS=$(ps aux | grep -E "improvedPersistence|injectPersistence" | grep -v grep | wc -l)
echo "Persistence processes: $PERSISTENCE_PROCS"

# Check state file
STATE_FILE="vscode-test-persistent/settings/User/globalStorage/state.vscdb"
if [ -f "$STATE_FILE" ]; then
    SIZE=$(stat -f%z "$STATE_FILE" 2>/dev/null || stat -c%s "$STATE_FILE" 2>/dev/null)
    AGE=$(stat -f%m "$STATE_FILE" 2>/dev/null || stat -c%Y "$STATE_FILE" 2>/dev/null)
    NOW=$(date +%s)
    AGE_HOURS=$(( ($NOW - $AGE) / 3600 ))
    
    echo "State file: EXISTS ($SIZE bytes, ${AGE_HOURS}h old)"
    
    if [ "$SIZE" -gt 100000 ]; then
        echo "Status: ✅ GOOD"
    else
        echo "Status: ⚠️  TOO SMALL"
    fi
else
    echo "State file: ❌ MISSING"
    echo "Status: ❌ NEEDS SETUP"
fi

# Check backup
BACKUP_FILE="${STATE_FILE}.backup"
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup: ✅ EXISTS"
else
    echo "Backup: ⚠️  MISSING"
fi

echo ""
if [ ! -f "$STATE_FILE" ] || [ "$SIZE" -lt 100000 ]; then
    echo "Recommendation: Run 'npm run setup:login'"
else
    echo "Status: Ready to use CLI!"
fi
