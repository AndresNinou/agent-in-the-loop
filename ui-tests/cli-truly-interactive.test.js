const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('../lib/ClineController');

describe('Cline True Interactive CLI', function () {
  this.timeout(60 * 60 * 1000); // 1 hour for long interactive sessions

  let session;

  before(async function() {
    console.log('\n🎯 CLINE TRUE INTERACTIVE CLI');
    console.log('=============================\n');

    console.log('🔧 Initializing VS Code browser...');
    
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
    
    console.log(`📁 Opening workspace: ${customWorkspace}`);
    await VSBrowser.instance.openResources(customWorkspace);
    console.log('✅ VS Code browser ready\n');

    // Create a persistent session
    console.log('🔗 Creating Cline session...');
    session = await clineController.createSession();
    console.log(`✅ Session created: ${session}\n`);
    
    console.log('🎯 Interactive Session Started');
    console.log('==============================');
    console.log('💡 Type your messages below. Type "exit" or "quit" to end the session.');
    console.log('📝 Each message will be sent to the same Cline session for continuity.\n');
  });

  it('should run interactive session', async function() {
    if (!session) {
      throw new Error('Session was not created successfully');
    }

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let messageCount = 0;

    const askQuestion = () => {
      return new Promise((resolve) => {
        rl.question(`\n💬 You [${messageCount + 1}]: `, async (input) => {
          const message = input.trim();
          
          if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
            console.log('\n👋 Goodbye! Ending interactive session...');
            rl.close();
            resolve(false); // Signal to end
            return;
          }

          if (message === '') {
            console.log('⚠️  Empty message. Try again or type "exit" to quit.');
            resolve(true); // Continue asking
            return;
          }

          try {
            messageCount++;
            console.log(`\n📤 Sending message ${messageCount}...`);
            console.log('⏳ Waiting for Cline response...\n');

            // Send message and wait for completion
            const result = await clineController.sendMessage(session, message);

            // Display the response messages
            if (result.messages && result.messages.length > 0) {
              console.log(`🤖 Cline [${messageCount}]:`);
              console.log('==================');
              
              result.messages.forEach((msg, idx) => {
                const cleanMsg = msg.trim();
                if (cleanMsg) {
                  if (result.messages.length > 1 && idx > 0) {
                    console.log(`\n--- Additional Response ---`);
                  }
                  console.log(cleanMsg);
                }
              });
              
              console.log('\n✅ Response complete');
            } else {
              console.log('ℹ️  No response messages received');
            }

            resolve(true); // Continue asking
          } catch (error) {
            console.error('❌ Error sending message:', error.message);
            console.log('⚠️  Try again or type "exit" to quit.');
            resolve(true); // Continue asking despite error
          }
        });
      });
    };

    // Interactive loop
    let shouldContinue = true;
    while (shouldContinue) {
      shouldContinue = await askQuestion();
    }

    console.log(`\n🏁 Interactive session completed with ${messageCount} message(s)`);
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
