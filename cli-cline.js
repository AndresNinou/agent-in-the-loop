#!/usr/bin/env node

const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('./lib/ClineController');

class ClineCLI {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.browser = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('\n🚀 Initializing Cline CLI...');
    console.log('============================\n');

    try {
      // Initialize VSBrowser instance
      console.log('🔧 Setting up VSBrowser...');
      this.browser = VSBrowser.instance;
      
      // Ensure VSBrowser is properly initialized
      if (!this.browser) {
        throw new Error('VSBrowser instance not available - make sure to run with proper test environment');
      }
      
      // Check for custom workspace path from environment variable
      const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
      
      console.log(`📁 Opening workspace: ${customWorkspace}`);
      await this.browser.openResources(customWorkspace);
      console.log('✅ VS Code browser ready');

      // Create a persistent session
      console.log('\n🔗 Creating Cline session...');
      this.session = await clineController.createSession();
      console.log(`✅ Session created: ${this.session}`);

      this.isInitialized = true;
      console.log('\n✅ Cline CLI ready for interaction!\n');
    } catch (error) {
      console.error('❌ Failed to initialize Cline CLI:', error.message);
      throw error;
    }
  }

  async sendMessage(message) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!message || message.trim() === '') {
      console.log('⚠️  Empty message provided');
      return;
    }

    try {
      console.log(`📤 Sending: "${message}"`);
      console.log('⏳ Waiting for Cline response...\n');

      // Send message and wait for completion
      const result = await clineController.sendMessage(this.session, message);

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

      return result;
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      throw error;
    }
  }

  async interactive() {
    await this.initialize();
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🎯 Interactive Mode Started');
    console.log('==========================');
    console.log('Type your messages and press Enter. Type "exit" to quit.\n');

    const askQuestion = () => {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase().trim() === 'exit') {
          console.log('\n👋 Goodbye!');
          await this.cleanup();
          rl.close();
          process.exit(0);
        }

        if (input.trim()) {
          try {
            await this.sendMessage(input);
          } catch (error) {
            console.error('❌ Error:', error.message);
          }
        }
        
        console.log(''); // Add spacing
        askQuestion(); // Ask for next input
      });
    };

    askQuestion();
  }

  async cleanup() {
    if (this.session) {
      console.log('\n🧼 Cleaning up session...');
      try {
        await clineController.closeSession(this.session);
        console.log('✅ Cleanup complete');
      } catch (error) {
        console.error('⚠️  Cleanup error:', error.message);
      }
      this.session = null;
    }
    this.isInitialized = false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cli = new ClineCLI();

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Interrupted by user');
    await cli.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Terminated');
    await cli.cleanup();
    process.exit(0);
  });

  try {
    if (args.length === 0) {
      // Interactive mode
      await cli.interactive();
    } else if (args[0] === '--interactive' || args[0] === '-i') {
      // Explicit interactive mode
      await cli.interactive();
    } else {
      // Single message mode
      const message = args.join(' ');
      await cli.sendMessage(message);
      await cli.cleanup();
    }
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    await cli.cleanup();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { ClineCLI };
