#!/bin/bash

echo "🔍 Verifying VS Code login persistence setup..."
echo "=============================================="
echo ""

# Check state file existence and size
STATE_FILE="vscode-test-persistent/settings/User/globalStorage/state.vscdb"
BACKUP_FILE="${STATE_FILE}.backup"

echo "Checking persistence files..."

if [ -f "$STATE_FILE" ]; then
    SIZE=$(stat -f%z "$STATE_FILE" 2>/dev/null || stat -c%s "$STATE_FILE" 2>/dev/null)
    echo "✅ State file exists: $STATE_FILE"
    echo "📊 Size: $SIZE bytes"
    
    if [ "$SIZE" -gt 100000 ]; then
        echo "✅ State file size looks good (likely contains login data)"
    else
        echo "⚠️  State file seems small - may not contain full login state"
    fi
else
    echo "❌ State file not found: $STATE_FILE"
    echo "   Run: npm run setup:login"
fi

echo ""

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    echo "✅ Backup file exists: $BACKUP_FILE"
    echo "📊 Backup size: $BACKUP_SIZE bytes"
else
    echo "⚠️  No backup file found"
fi

echo ""
echo "🧪 Testing quick CLI session..."

# Test a simple CLI command
export CUSTOM_WORKSPACE="/home/newton/cline_hackathon/workspaces/workspace-1"

# Start persistence system briefly
./lib/improvedPersistence.sh &
INJECTOR_PID=$!

echo "Started persistence system (PID: $INJECTOR_PID)"

# Wait a moment
sleep 3

# Try a quick test
timeout 60s npm run mocha ui-tests/cli-runner.test.js --timeout 45000 || echo "Test timed out or failed"

# Stop persistence
kill $INJECTOR_PID 2>/dev/null

echo ""
echo "📋 Verification Summary:"
echo "======================="

if [ -f "$STATE_FILE" ] && [ "$SIZE" -gt 100000 ]; then
    echo "✅ State file: GOOD"
else
    echo "❌ State file: NEEDS SETUP"
fi

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup file: PRESENT"
else
    echo "⚠️  Backup file: MISSING"
fi

echo ""
echo "Next steps:"
if [ ! -f "$STATE_FILE" ] || [ "$SIZE" -lt 100000 ]; then
    echo "- Run: npm run setup:login"
else
    echo "- Setup looks good! Try: npm run cli 'Hello, can you help me?'"
fi
