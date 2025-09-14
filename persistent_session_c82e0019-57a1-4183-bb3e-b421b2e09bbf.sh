#!/bin/bash

# Persistent Cline CLI Session
echo "Starting persistent Cline session c82e0019-57a1-4183-bb3e-b421b2e09bbf..."

# Set environment
export CUSTOM_WORKSPACE="/home/newton/coding_playground"
export SESSION_INPUT_FILE="/tmp/cline_session_c82e0019-57a1-4183-bb3e-b421b2e09bbf_xnax0kdl/input.txt"
export SESSION_OUTPUT_FILE="/tmp/cline_session_c82e0019-57a1-4183-bb3e-b421b2e09bbf_xnax0kdl/output.txt"

# Start persistence system
./lib/improvedPersistence.sh &
PERSISTENCE_PID=$!

# Wait for persistence to start
sleep 5

# Signal that we're ready
echo "READY" > "$SESSION_OUTPUT_FILE"

# Create a modified interactive test that reads from input file
cat > temp_persistent_test_c82e0019-57a1-4183-bb3e-b421b2e09bbf.js << 'EOF'
const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('./lib/ClineController');
const fs = require('fs');
const path = require('path');

describe('Persistent Cline Session', function () {
  this.timeout(60 * 60 * 1000); // 1 hour timeout
  
  let session;
  const inputFile = process.env.SESSION_INPUT_FILE;
  const outputFile = process.env.SESSION_OUTPUT_FILE;
  
  before(async function() {
    console.log('Initializing persistent Cline session...');
    
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/coding_playground';
    console.log(`Opening workspace: ${customWorkspace}`);
    
    await VSBrowser.instance.openResources(customWorkspace);
    
    // Create persistent Cline session
    session = await clineController.createSession();
    console.log(`Persistent session created: ${session}`);
    
    // Write ready signal
    fs.writeFileSync(outputFile, 'SESSION_READY\n');
  });
  
  it('should handle persistent messages', async function() {
    let messageCounter = 0;
    
    while (true) {
      try {
        // Check for new message in input file
        if (fs.existsSync(inputFile)) {
          const content = fs.readFileSync(inputFile, 'utf8').trim();
          
          if (content && content !== 'STOP_SESSION') {
            messageCounter++;
            console.log(`Processing message ${messageCounter}: ${content.substring(0, 50)}...`);
            
            // Clear input file
            fs.writeFileSync(inputFile, '');
            
            // Send message to Cline
            const result = await clineController.sendMessage(session, content);
            
            // Write response to output file
            const responseData = {
              success: true,
              messageId: messageCounter,
              response: result.messages.join('\n\n'),
              timestamp: new Date().toISOString()
            };
            
            fs.writeFileSync(outputFile, JSON.stringify(responseData) + '\n');
            
          } else if (content === 'STOP_SESSION') {
            console.log('Stopping session...');
            break;
          }
        }
        
        // Small delay to prevent busy waiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error processing message:', error);
        const errorData = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        fs.writeFileSync(outputFile, JSON.stringify(errorData) + '\n');
      }
    }
  });
  
  after(async function() {
    if (session) {
      await clineController.closeSession(session);
    }
  });
});
EOF

# Run the persistent test
npx extest run-tests "temp_persistent_test_c82e0019-57a1-4183-bb3e-b421b2e09bbf.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json

# Cleanup
rm -f "temp_persistent_test_c82e0019-57a1-4183-bb3e-b421b2e09bbf.js"
kill $PERSISTENCE_PID 2>/dev/null || true
