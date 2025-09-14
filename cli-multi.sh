#!/bin/bash

# CLI Cline Multi-Message Runner
# Sends multiple messages in the same session

echo "🚀 CLINE CLI - MULTI-MESSAGE MODE"
echo "================================="
echo ""

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 \"message1\" \"message2\" \"message3\" ..."
    echo "Example: $0 \"What is Python?\" \"Show me a simple example\" \"Explain functions\""
    echo ""
    echo "Or use separator: $0 \"What is Python?|||Show me example|||Explain functions\""
    exit 1
fi

# Combine all arguments
ALL_MESSAGES="$*"

# If using separator format, convert it
if [[ "$ALL_MESSAGES" == *"|||"* ]]; then
    CLI_MESSAGES="$ALL_MESSAGES"
else
    # Convert individual arguments to separator format
    CLI_MESSAGES=""
    for arg in "$@"; do
        if [[ -n "$CLI_MESSAGES" ]]; then
            CLI_MESSAGES="$CLI_MESSAGES|||$arg"
        else
            CLI_MESSAGES="$arg"
        fi
    done
fi

echo "📝 Messages to process:"
IFS='|||' read -ra ADDR <<< "$CLI_MESSAGES"
for i in "${!ADDR[@]}"; do
    echo "   $((i+1)). ${ADDR[i]}"
done
echo ""

# Start persistence injector
echo "Starting persistence injector..."
./lib/injectPersistence.sh &
INJECTOR_PID=$!

cleanup() {
    echo ""
    echo "Stopping persistence injector..."
    kill $INJECTOR_PID 2>/dev/null
    echo "✅ Cleanup complete"
}

trap cleanup EXIT INT TERM

sleep 2

echo "🔐 PERSISTENCE INJECTOR ACTIVE"
echo "Running multi-message CLI..."
echo "=============================="
echo ""

# Set environment variables
export VSCODE_TEST_WORKSPACE="/home/newton/coding_playground"
export CUSTOM_WORKSPACE="/home/newton/coding_playground"
export CLI_MESSAGES="$CLI_MESSAGES"

# Run the interactive test with multiple messages
npx extest run-tests "ui-tests/cli-interactive.test.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json

echo ""
echo "✨ Multi-message session complete!"
