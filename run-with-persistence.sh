#!/bin/bash

echo "🚀 STARTING PERSISTENT VS CODE TESTS"
echo "===================================="
echo ""

# Default test file if none provided
TEST_FILE=${1:-"ui-tests/**/*.test.js"}

echo "Test file(s): $TEST_FILE"
echo ""

# Start the improved persistence injector in background
echo "Starting improved persistence system..."
./lib/improvedPersistence.sh &
INJECTOR_PID=$!
echo "Injector PID: $INJECTOR_PID"
echo ""

# Give it a moment to start
sleep 2

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping persistence injector..."
    kill $INJECTOR_PID 2>/dev/null
    wait $INJECTOR_PID 2>/dev/null
    echo "✅ Cleanup complete"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Run the tests
echo "Running tests with persistence..."
echo "===================================="
npx extest run-tests "$TEST_FILE" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json

echo ""
echo "✨ Test complete!"
