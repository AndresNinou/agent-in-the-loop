#!/bin/bash

echo "🔐 Setting up VS Code login session for persistence..."
echo "=================================================="
echo ""

# Set workspace
export CUSTOM_WORKSPACE="/home/newton/cline_hackathon/workspaces/workspace-1"

echo "Workspace: $CUSTOM_WORKSPACE"
echo ""

# Start the improved persistence system
echo "Starting persistence system..."
./lib/improvedPersistence.sh &
INJECTOR_PID=$!

echo "Persistence PID: $INJECTOR_PID"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Cleaning up..."
    if [ ! -z "$INJECTOR_PID" ]; then
        kill $INJECTOR_PID 2>/dev/null
        echo "Stopped persistence injector (PID: $INJECTOR_PID)"
    fi
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

echo "🚨 IMPORTANT INSTRUCTIONS:"
echo "========================="
echo "VS Code will open for 5 minutes. During this time you MUST:"
echo ""
echo "1. 🔑 Sign in to your GitHub/Microsoft accounts"
echo "2. 🔌 Verify Cline extension is installed and activated"
echo "3. ⚙️  Configure any necessary extension settings"
echo "4. 📁 Let VS Code fully load the workspace"
echo ""
echo "⏰ Do NOT close VS Code early - wait the full 5 minutes!"
echo "   This ensures the login state is properly saved."
echo ""

# Wait for user confirmation
read -p "Press Enter when ready to start the login session..."

echo ""
echo "🚀 Starting VS Code login session..."
echo ""

# Run the manual verification test which opens VS Code for 5 minutes
npm run mocha ui-tests/manual-verify-persistence.test.js

echo ""
echo "✅ Login session complete!"
echo ""

# Check state file
STATE_FILE="vscode-test-persistent/settings/User/globalStorage/state.vscdb"
if [ -f "$STATE_FILE" ]; then
    SIZE=$(stat -f%z "$STATE_FILE" 2>/dev/null || stat -c%s "$STATE_FILE" 2>/dev/null)
    echo "📊 State file size: $SIZE bytes"
    if [ "$SIZE" -gt 100000 ]; then
        echo "✅ State file looks good (contains login data)"
        
        # Create backup
        cp "$STATE_FILE" "${STATE_FILE}.backup"
        echo "💾 Created backup: ${STATE_FILE}.backup"
    else
        echo "⚠️  State file seems too small - login may not have been saved properly"
    fi
else
    echo "❌ State file not found - login setup failed"
fi

# Stop persistence
cleanup
