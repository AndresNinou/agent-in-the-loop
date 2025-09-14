const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('../lib/ClineController');

describe('Cline Interactive CLI', function () {
  this.timeout(30 * 60 * 1000); // 30 minutes for interactive session

  let session;

  before(async function() {
    console.log('\n🎯 CLINE INTERACTIVE CLI');
    console.log('========================\n');

    console.log('🔧 Initializing VS Code browser...');
    
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
    
    console.log(`📁 Opening workspace: ${customWorkspace}`);
    await VSBrowser.instance.openResources(customWorkspace);
    console.log('✅ VS Code browser ready\n');

    // Create a persistent session
    console.log('🔗 Creating Cline session...');
    session = await clineController.createSession();
    console.log(`✅ Session created: ${session}\n`);
  });

  it('should handle multiple messages in session', async function() {
    if (!session) {
      throw new Error('Session was not created successfully');
    }

    // Get messages from environment - support multiple messages separated by "|||"
    const messagesInput = process.env.CLI_MESSAGES || process.env.CLI_MESSAGE || 'Hello, what can you help me with?';
    const messages = messagesInput.split('|||').map(msg => msg.trim()).filter(msg => msg.length > 0);
    
    console.log(`📝 Processing ${messages.length} message(s):\n`);

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      console.log(`📤 Message ${i + 1}/${messages.length}: "${message}"`);
      console.log('⏳ Waiting for Cline response...\n');

      // Send message and wait for completion
      const result = await clineController.sendMessage(session, message);

      // Display the response messages
      if (result.messages && result.messages.length > 0) {
        console.log(`🤖 Cline Response ${i + 1}:`);
        console.log('==================');
        
        result.messages.forEach((msg, idx) => {
          const cleanMsg = msg.trim();
          if (cleanMsg) {
            if (result.messages.length > 1) {
              console.log(`\n--- Response Part ${idx + 1} ---`);
            }
            console.log(cleanMsg);
          }
        });
        
        console.log('\n✅ Response complete\n');
      } else {
        console.log('ℹ️  No response messages received\n');
      }

      // Add a small delay between messages to ensure proper processing
      if (i < messages.length - 1) {
        console.log('⏳ Preparing for next message...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🏁 Completed ${messages.length} message(s) successfully`);
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
