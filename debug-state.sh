#!/bin/bash

echo "🔍 Debug: VS Code State Analysis..."
echo "=================================="
echo ""

# Check all processes
echo "📋 Process Analysis:"
echo "-------------------"
echo "VS Code processes:"
ps aux | grep -E "(chrome|vscode|VSCode)" | grep -v grep | head -10

echo ""
echo "Persistence processes:"
ps aux | grep -E "(improved|inject)Persistence" | grep -v grep

echo ""
echo "📁 File System Analysis:"
echo "------------------------"

STATE_DIR="vscode-test-persistent/settings/User/globalStorage"
STATE_FILE="$STATE_DIR/state.vscdb"
BACKUP_FILE="${STATE_FILE}.backup"

if [ -d "$STATE_DIR" ]; then
    echo "GlobalStorage directory contents:"
    ls -la "$STATE_DIR"
    echo ""
else
    echo "❌ GlobalStorage directory not found: $STATE_DIR"
fi

if [ -f "$STATE_FILE" ]; then
    SIZE=$(stat -f%z "$STATE_FILE" 2>/dev/null || stat -c%s "$STATE_FILE" 2>/dev/null)
    MODIFIED=$(stat -f%Sm "$STATE_FILE" 2>/dev/null || stat -c%y "$STATE_FILE" 2>/dev/null)
    
    echo "State file details:"
    echo "  Path: $STATE_FILE"
    echo "  Size: $SIZE bytes"
    echo "  Modified: $MODIFIED"
    
    # Check if file is locked
    if lsof "$STATE_FILE" >/dev/null 2>&1; then
        echo "  Status: 🔒 LOCKED (in use)"
        echo "  Processes using file:"
        lsof "$STATE_FILE"
    else
        echo "  Status: 🔓 UNLOCKED"
    fi
    
    # Sample some content (safely)
    echo ""
    echo "File signature check:"
    file "$STATE_FILE"
    
    if [ "$SIZE" -gt 1000000 ]; then
        echo "  Assessment: ✅ GOOD SIZE (likely valid login data)"
    elif [ "$SIZE" -gt 100000 ]; then
        echo "  Assessment: ⚠️  MODERATE SIZE (may be partial data)"
    else
        echo "  Assessment: ❌ TOO SMALL (likely corrupted or empty)"
    fi
else
    echo "❌ State file not found: $STATE_FILE"
fi

echo ""

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    BACKUP_MODIFIED=$(stat -f%Sm "$BACKUP_FILE" 2>/dev/null || stat -c%y "$BACKUP_FILE" 2>/dev/null)
    
    echo "Backup file details:"
    echo "  Path: $BACKUP_FILE" 
    echo "  Size: $BACKUP_SIZE bytes"
    echo "  Modified: $BACKUP_MODIFIED"
else
    echo "❌ Backup file not found: $BACKUP_FILE"
fi

echo ""
echo "🌐 Network & Chrome Analysis:"
echo "-----------------------------"

# Check Chrome user data directories
CHROME_DIRS=$(find /tmp -name "chrome_*" -type d 2>/dev/null | wc -l)
echo "Chrome temp directories: $CHROME_DIRS"

# Check for conflicting Chrome instances
CHROME_PROCS=$(ps aux | grep chrome | grep -v grep | wc -l)
echo "Chrome processes: $CHROME_PROCS"

echo ""
echo "📊 VS Code Test Environment:"
echo "----------------------------"

if [ -d "vscode-test-persistent" ]; then
    echo "Test directory size:"
    du -sh vscode-test-persistent
    
    echo ""
    echo "Key VS Code files:"
    find vscode-test-persistent -name "*.json" -o -name "*.log" -o -name "*.vscdb*" | head -10
else
    echo "❌ VS Code test directory not found"
fi

echo ""
echo "🔧 Suggested Actions:"
echo "-------------------"

if [ ! -f "$STATE_FILE" ]; then
    echo "1. ❌ No state file - run: npm run setup:login"
elif [ "$SIZE" -lt 100000 ]; then
    echo "1. ⚠️  Small state file - run: npm run setup:refresh"
else
    echo "1. ✅ State file looks good"
fi

if [ "$CHROME_PROCS" -gt 5 ]; then
    echo "2. ⚠️  Many Chrome processes - consider: pkill chrome"
else
    echo "2. ✅ Chrome process count normal"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "3. ⚠️  No backup file - will be created on next successful login"
else
    echo "3. ✅ Backup file exists"
fi
