const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('../lib/ClineController');

describe('Cline CLI Runner', function () {
  this.timeout(10 * 60 * 1000); // 10 minutes

  let session;

  before(async function() {
    console.log('\n🚀 CLINE CLI RUNNER');
    console.log('===================\n');

    console.log('🔧 Initializing VS Code browser...');
    
    // Check for custom workspace path from environment variable
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
    
    console.log(`📁 Opening workspace: ${customWorkspace}`);
    await VSBrowser.instance.openResources(customWorkspace);
    console.log('✅ VS Code browser ready\n');

    // Create a persistent session
    console.log('🔗 Creating Cline session...');
    session = await clineController.createSession();
    console.log(`✅ Session created: ${session}\n`);
  });

  it('should send CLI message', async () => {
    if (!session) {
      throw new Error('Session was not created successfully');
    }
    
    // Get the message from environment variable
    const message = process.env.CLI_MESSAGE || 'Hello, can you tell me what you can do?';
    
    console.log(`📤 Sending: "${message}"`);
    console.log('⏳ Waiting for Cline response...\n');

    // Send message and wait for completion
    const result = await clineController.sendMessage(session, message);

    // Display the response messages
    if (result.messages && result.messages.length > 0) {
      console.log('🤖 Cline Response:');
      console.log('==================');
      
      result.messages.forEach((msg, idx) => {
        // Clean up and format the message
        const cleanMsg = msg.trim();
        if (cleanMsg) {
          if (result.messages.length > 1) {
            console.log(`\n--- Response ${idx + 1} ---`);
          }
          console.log(cleanMsg);
        }
      });
      
      console.log('\n✅ Response complete');
    } else {
      console.log('ℹ️  No response messages received');
    }
  });

  after(async function() {
    // Close the session
    if (session) {
      console.log('\n🧼 Cleaning up session...');
      await clineController.closeSession(session);
      console.log('✅ Cleanup complete');
    }
  });
});
