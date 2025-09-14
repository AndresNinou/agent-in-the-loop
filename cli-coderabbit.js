#!/usr/bin/env node

const { VSBrowser } = require('vscode-extension-tester');
const { codeRabbitController } = require('./lib/CodeRabbitController');

class CodeRabbitCLI {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.browser = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('\n🚀 Initializing CodeRabbit CLI...');
    console.log('===============================\n');

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

      // Brief delay for VS Code to fully load
      console.log('\n🚀 Starting CodeRabbit automation...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create a persistent session
      console.log('\n🔗 Creating CodeRabbit session...');
      this.session = await codeRabbitController.createSession();
      console.log(`✅ Session created: ${this.session}`);

      this.isInitialized = true;
      console.log('\n✅ CodeRabbit CLI ready for code reviews!\n');
    } catch (error) {
      console.error('❌ Failed to initialize CodeRabbit CLI:', error.message);
      throw error;
    }
  }

  async startReview() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Starting code review...`);
      console.log('⏳ CodeRabbit is analyzing your code...\n');

      // Start review and wait for completion
      const result = await codeRabbitController.startReview(this.session);

      // Display the review results
      if (result.comments && result.comments.length > 0) {
        console.log('🤖 CodeRabbit Review Results:');
        console.log('=============================');
        
        result.comments.forEach((comment, idx) => {
          console.log(`\n--- Issue ${idx + 1} ---`);
          console.log(`📁 File: ${comment.filePath}`);
          console.log(`📍 Range: ${comment.range}`);
          console.log(`👤 By: ${comment.user}`);
          console.log(`📝 Comment:\n${comment.text}`);
        });
        
        console.log(`\n✅ Review complete - Found ${result.comments.length} issue(s)`);
        
        // Ask if user wants to fix all issues
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        return new Promise((resolve) => {
          rl.question('\n🛠️  Would you like to fix all issues automatically? (y/n): ', async (answer) => {
            if (answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes') {
              try {
                console.log('\n🔧 Applying fixes...');
                await this.fixAllIssues();
                console.log('✅ All issues have been fixed!');
              } catch (error) {
                console.error('❌ Error fixing issues:', error.message);
              }
            } else {
              console.log('ℹ️  Skipping auto-fix. You can review the issues manually.');
            }
            rl.close();
            resolve(result);
          });
        });
      } else {
        console.log('🎉 No issues found! Your code looks great.');
        return result;
      }

    } catch (error) {
      console.error('❌ Error during code review:', error.message);
      throw error;
    }
  }

  async fixAllIssues() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🛠️  Fixing all issues...');
      
      const result = await codeRabbitController.fixAllIssues(this.session);
      
      if (result.success) {
        console.log('✅ All issues have been fixed successfully!');
        return result;
      }
    } catch (error) {
      console.error('❌ Error fixing issues:', error.message);
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

    console.log('🎯 CodeRabbit Interactive Mode');
    console.log('===============================');
    console.log('Commands:');
    console.log('  review  - Start a code review');
    console.log('  fix     - Fix all issues');
    console.log('  stats   - Show session statistics');
    console.log('  exit    - Quit');
    console.log('');

    const askQuestion = () => {
      rl.question('CodeRabbit> ', async (input) => {
        const command = input.toLowerCase().trim();
        
        if (command === 'exit') {
          console.log('\n👋 Goodbye!');
          await this.cleanup();
          rl.close();
          process.exit(0);
        }

        try {
          switch (command) {
            case 'review':
              await this.startReview();
              break;
            case 'fix':
              await this.fixAllIssues();
              break;
            case 'stats':
              const stats = await codeRabbitController.getSessionStats(this.session);
              console.log('\n📊 Session Statistics:');
              console.log(`   Total Comments: ${stats.totalComments}`);
              console.log(`   Reviews Completed: ${stats.reviewCount}`);
              console.log(`   Session Duration: ${Math.round(stats.duration / 1000)}s`);
              break;
            default:
              console.log('❓ Unknown command. Try: review, fix, stats, or exit');
          }
        } catch (error) {
          console.error('❌ Error:', error.message);
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
        await codeRabbitController.closeSession(this.session);
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
  const cli = new CodeRabbitCLI();

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
      // Default: start a review
      await cli.startReview();
      await cli.cleanup();
    } else if (args[0] === '--interactive' || args[0] === '-i') {
      // Interactive mode
      await cli.interactive();
    } else if (args[0] === 'review') {
      // Explicit review command
      await cli.startReview();
      await cli.cleanup();
    } else if (args[0] === 'fix') {
      // Fix all issues command
      await cli.initialize();
      await cli.fixAllIssues();
      await cli.cleanup();
    } else {
      console.log('Usage: node cli-coderabbit.js [command]');
      console.log('Commands:');
      console.log('  (no args)        - Start code review');
      console.log('  review           - Start code review');
      console.log('  fix              - Fix all issues');
      console.log('  --interactive    - Interactive mode');
      process.exit(0);
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

module.exports = { CodeRabbitCLI };
