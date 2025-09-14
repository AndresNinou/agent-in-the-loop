#!/bin/bash

# CLI CodeRabbit with Persistence
# This script runs the CodeRabbit CLI with the same persistence system as your tests

echo "🚀 STARTING CODERABBIT CLI WITH PERSISTENCE"
echo "==========================================="
echo ""

# Get the command from command line arguments
COMMAND="$1"
shift
ARGS="$*"

# Check what command is requested
if [[ "$COMMAND" == "--interactive" || "$COMMAND" == "-i" ]]; then
    INTERACTIVE_MODE=true
    echo "🎯 Interactive mode enabled"
elif [[ "$COMMAND" == "review" || -z "$COMMAND" ]]; then
    INTERACTIVE_MODE=false
    echo "🔍 Review mode: Starting code review"
elif [[ "$COMMAND" == "fix" ]]; then
    INTERACTIVE_MODE=false
    echo "🛠️  Fix mode: Fixing all issues"
else
    INTERACTIVE_MODE=false
    echo "📝 Command mode: $COMMAND $ARGS"
fi

echo ""

# Start the improved persistence system in the background
echo "Starting improved persistence system..."
./lib/improvedPersistence.sh &
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

echo "Running CodeRabbit CLI with persistence..."
echo "=========================================="
echo ""

# Set environment variables for VS Code test setup
export VSCODE_TEST_WORKSPACE="/home/newton/coding_playground"
export CUSTOM_WORKSPACE="/home/newton/coding_playground"
export CODERABBIT_COMMAND="$COMMAND"
export CODERABBIT_ARGS="$ARGS"

# Create test file that will run the CodeRabbit CLI
cat > ui-tests/cli-coderabbit-runner.test.js << 'EOF'
const { VSBrowser } = require('vscode-extension-tester');

describe('CodeRabbit CLI Runner', () => {
  let browser;
  
  before(async function() {
    this.timeout(60000);
    browser = VSBrowser.instance;
    await browser.waitForWorkbench();
  });

  it('should run CodeRabbit CLI', async function() {
    this.timeout(300000); // 5 minutes timeout
    
    const { CodeRabbitCLI } = require('../cli-coderabbit');
    const cli = new CodeRabbitCLI();
    
    const command = process.env.CODERABBIT_COMMAND;
    const args = process.env.CODERABBIT_ARGS;
    
    try {
      if (command === '--interactive' || command === '-i') {
        console.log('🎯 Starting CodeRabbit interactive mode...');
        await cli.interactive();
      } else if (command === 'review' || !command) {
        console.log('🔍 Starting CodeRabbit review...');
        await cli.startReview();
      } else if (command === 'fix') {
        console.log('🛠️  Starting CodeRabbit fix...');
        await cli.initialize();
        await cli.fixAllIssues();
      }
      
      await cli.cleanup();
      console.log('✅ CodeRabbit CLI completed successfully');
    } catch (error) {
      console.error('❌ CodeRabbit CLI error:', error.message);
      await cli.cleanup();
      throw error;
    }
  });

  after(async () => {
    // Cleanup
    if (browser) {
      try {
        await browser.quit();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
EOF

# Run the CLI using the test framework (required for VSBrowser)
if [[ "$INTERACTIVE_MODE" == "true" ]]; then
    echo "🎯 Starting CodeRabbit interactive session..."
    echo "You'll be able to run review commands interactively."
    echo ""
fi

npx extest run-tests "ui-tests/cli-coderabbit-runner.test.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json

# Clean up the temporary test file
rm -f ui-tests/cli-coderabbit-runner.test.js

echo ""
echo "✨ CodeRabbit CLI session complete!"
