#!/bin/bash

# CLI Cline with Persistence
# This script runs the Cline CLI with the same persistence system as your tests

echo "🚀 STARTING CLINE CLI WITH PERSISTENCE"
echo "======================================"
echo ""

# Get the message from command line arguments
MESSAGE="$*"

# Check if interactive mode is requested
if [[ "$1" == "--interactive" || "$1" == "-i" || -z "$MESSAGE" ]]; then
    INTERACTIVE_MODE=true
    echo "🎯 Interactive mode enabled"
else
    INTERACTIVE_MODE=false
    echo "📝 Single message mode: $MESSAGE"
fi

echo ""

# Start the persistence injector in the background
echo "Starting persistence injector..."
./lib/injectPersistence.sh &
INJECTOR_PID=$!

echo "Injector PID: $INJECTOR_PID"
echo ""

# Wait a moment for the injector to start
sleep 2

# Display persistence status
echo "🔐 PERSISTENCE INJECTOR ACTIVE"
echo "📦 Backup: $(pwd)/vscode-test-persistent/state.vscdb.backup"
echo "📍 Target: $(pwd)/vscode-test-persistent/settings/User/globalStorage/state.vscdb"
echo ""

# Restore the state file
echo "✅ Restored state file ($(du -h vscode-test-persistent/state.vscdb.backup 2>/dev/null | cut -f1 || echo 'N/A'))"
echo "👁️  Monitoring for state file deletion..."

# Function to cleanup
cleanup() {
    echo ""
    echo "Stopping persistence injector..."
    if kill $INJECTOR_PID 2>/dev/null; then
        echo "✅ Cleanup complete"
    else
        echo "⚠️  Injector may have already stopped"
    fi
}

# Set trap for cleanup on script exit
trap cleanup EXIT INT TERM

echo "Running CLI with persistence..."
echo "======================================"
echo ""

# Set environment variables for VS Code test setup
export VSCODE_TEST_WORKSPACE="/home/newton/coding_playground"
export CUSTOM_WORKSPACE="/home/newton/coding_playground"
export CLI_MESSAGE="$MESSAGE"

# Run the CLI using the test framework (required for VSBrowser)
if [[ "$INTERACTIVE_MODE" == "true" ]]; then
    echo "🎯 Starting truly interactive session..."
    echo "You'll be able to chat directly with Cline in a conversation."
    echo ""
    
    # Use the truly interactive test runner that prompts for input
    npx extest run-tests "ui-tests/cli-truly-interactive.test.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json
else
    # Single message mode
    npx extest run-tests "ui-tests/cli-runner.test.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json
fi

echo ""
echo "✨ CLI session complete!"
