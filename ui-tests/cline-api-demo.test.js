const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('../lib/ClineController');

describe('Cline API Demo - Single Session', function () {
  this.timeout(10 * 60 * 1000); // 10 minutes

  let session1;

  before(async function() {
    // Initialize VS Code browser before any tests
    console.log('\n🎯 CLINE API DEMO - SINGLE SESSION');
    console.log('===================================\n');

    console.log('🚀 Initializing VS Code browser...');

    // Check for custom workspace path from environment variable
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';

    console.log(`📁 Opening workspace: ${customWorkspace}`);
    await VSBrowser.instance.openResources(customWorkspace);
    console.log('✅ VS Code browser ready\n');
  });

  it('should create a Cline session', async () => {
    // Create first session
    console.log('📋 Creating Session 1...');
    session1 = await clineController.createSession();

    console.log(`\n✅ Created session: ${session1}`);
  });

  it('should send messages to the session', async () => {
    if (!session1) {
      throw new Error('Session was not created successfully - cannot send messages');
    }
    
    // Send message to Session 1
    console.log('\n📤 Session 1: Sending first message...');
    const result1 = await clineController.sendMessage(session1, 'Can you create a simple Python function to calculate factorial?');

    // Log results
    console.log(`\n📊 Session Results:`);
    console.log(`   Messages received: ${result1.messages.length}`);
    console.log(`   Total messages in session: ${result1.totalMessages}`);
  });

  it('should track session state and messages', async () => {
    if (!session1) {
      throw new Error('Session was not created successfully - cannot check state');
    }
    
    // Check session state
    const state1 = await clineController.getSessionState(session1);

    console.log(`\n🔍 Session State:`);
    console.log(`   ${session1}: ${state1}`);

    // Get all messages from the session
    const messages1 = await clineController.getSessionMessages(session1);

    console.log(`\n📝 Session Message Count:`);
    console.log(`   ${session1}: ${messages1.length} messages`);
  });

  it('should demonstrate session management', async () => {
    if (!session1) {
      throw new Error('Session was not created successfully - cannot get stats');
    }
    
    // Get session statistics
    const stats1 = await clineController.getSessionStats(session1);

    console.log(`\n📈 Session Statistics:`);
    console.log(`   ${session1}: ${stats1.totalMessages} messages, $${stats1.cost} cost`);

    // Get overall controller stats
    const controllerStats = clineController.getStats();
    console.log(`\n🎛️  Controller Overview:`);
    console.log(`   Total sessions: ${controllerStats.totalSessions}`);
    console.log(`   Total messages: ${controllerStats.totalMessages}`);
    console.log(`   Total cost: $${controllerStats.totalCost}`);
  });

  it('should send follow-up messages', async () => {
    if (!session1) {
      throw new Error('Session was not created successfully - cannot send follow-up');
    }
    
    // Send follow-up to Session 1
    console.log('\n📤 Session 1: Sending follow-up...');
    const result1 = await clineController.sendMessage(session1, 'Can you show me an example of creating a React component?');

    console.log(`\n📊 Follow-up Results:`);
    console.log(`   Session 1: +${result1.messages.length} new messages`);
  });

  it('should demonstrate proper cleanup', async () => {
    console.log('\n🧼 Cleaning up sessions...');

    // Close the session (if it exists)
    if (session1) {
      await clineController.closeSession(session1);
    }

    // Verify cleanup
    const remainingSessions = clineController.getAllSessions();
    console.log(`\n✅ Cleanup complete. Remaining sessions: ${remainingSessions.length}`);

    // Final stats
    const finalStats = clineController.getStats();
    console.log(`\n🏁 Final Statistics:`);
    console.log(`   Sessions processed: ${finalStats.totalSessions}`);
    console.log(`   Total messages exchanged: ${finalStats.totalMessages}`);
    console.log(`   Total API cost: $${finalStats.totalCost}`);
  });
});
