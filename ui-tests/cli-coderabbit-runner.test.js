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
