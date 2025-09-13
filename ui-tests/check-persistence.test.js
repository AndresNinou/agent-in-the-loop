const { VSBrowser } = require('vscode-extension-tester');
const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

describe('Check Persistence Status', function () {
  this.timeout(2 * 60 * 1000); // 2 minutes timeout

  it('should check if logins are persisted', async () => {
    console.log('\n========================================');
    console.log('🔍 CHECKING PERSISTENCE STATUS');
    console.log('========================================\n');
    
    // Check state file before test
    const stateFile = path.join(__dirname, '..', 'vscode-test-persistent', 'settings', 'User', 'globalStorage', 'state.vscdb');
    
    if (fs.existsSync(stateFile)) {
      const stats = fs.statSync(stateFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ State file exists: ${sizeMB} MB`);
      
      // Read first few bytes to check if it's a valid SQLite database
      const buffer = fs.readFileSync(stateFile, { encoding: null }).slice(0, 16);
      const header = buffer.toString('utf8');
      if (header.startsWith('SQLite')) {
        console.log('✅ Valid SQLite database file');
      } else {
        console.log('❌ File exists but may be corrupted');
      }
    } else {
      console.log('❌ No state file found');
    }
    
    // Open VS Code
    await VSBrowser.instance.openResources();
    const driver = VSBrowser.instance.driver;
    
    console.log('\n📋 CHECKING LOGIN STATUS:');
    console.log('Please check the VS Code window that opened:');
    console.log('1. Look at the Accounts icon in the Activity Bar (bottom left)');
    console.log('2. Check if you see your profile picture or initials');
    console.log('3. Click on it to see if you\'re logged in');
    console.log('4. Check the Extensions view for any logged-in extensions');
    
    // Wait 30 seconds for manual inspection
    console.log('\n⏰ Waiting 30 seconds for manual inspection...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Try to check for account status programmatically
    try {
      // Look for account badge or profile in the UI
      const accountElements = await driver.findElements(By.css('.monaco-workbench .activitybar .accounts-badge'));
      if (accountElements.length > 0) {
        console.log('✅ Found account badge in UI');
      }
      
      // Check for any authentication-related elements
      const authElements = await driver.findElements(By.css('[aria-label*="Account"]'));
      if (authElements.length > 0) {
        console.log('✅ Found account-related UI elements');
      }
    } catch (e) {
      console.log('Could not automatically detect account status');
    }
    
    console.log('\n📊 PERSISTENCE CHECK COMPLETE');
    console.log('If you were logged in, persistence is working!');
    console.log('If not, we need to troubleshoot further.');
  });
});
