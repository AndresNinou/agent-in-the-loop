#!/usr/bin/env node

/**
 * Example usage of the Cline API
 * This demonstrates how to use the new API-ready Cline controller
 */

const { clineController } = require('./lib/ClineController');

async function exampleUsage() {
  try {
    console.log('🚀 Cline API Example Usage\n');

    // Initialize VS Code browser first
    console.log('1. Initializing VS Code browser...');
    const { VSBrowser } = require('vscode-extension-tester');
    await VSBrowser.instance.openResources();
    console.log('✅ VS Code browser ready\n');

    // Create a new session
    console.log('2. Creating Cline session...');
    const sessionId = await clineController.createSession();
    console.log(`✅ Session created: ${sessionId}\n`);

    // Send a message and get response
    console.log('2. Sending message...');
    const result = await clineController.sendMessage(sessionId, 'Hello Cline! What can you help me with?');

    console.log('📝 Response received:');
    result.messages.forEach((message, index) => {
      console.log(`   ${index + 1}. ${message}`);
    });
    console.log('');

    // Send another message
    console.log('3. Sending follow-up message...');
    const result2 = await clineController.sendMessage(sessionId, 'Can you show me a simple example?');

    console.log('📝 Follow-up response:');
    result2.messages.forEach((message, index) => {
      console.log(`   ${index + 1}. ${message}`);
    });
    console.log('');

    // Get session statistics
    console.log('4. Session statistics:');
    const stats = await clineController.getSessionStats(sessionId);
    console.log(`   Messages: ${stats.totalMessages}`);
    console.log(`   Cost: $${stats.cost}`);
    console.log(`   Duration: ${Math.round(stats.duration / 1000)}s`);
    console.log('');

    // Clean up
    console.log('5. Cleaning up...');
    await clineController.closeSession(sessionId);
    console.log('✅ Session closed\n');

    console.log('🎉 Example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}

module.exports = { exampleUsage };
