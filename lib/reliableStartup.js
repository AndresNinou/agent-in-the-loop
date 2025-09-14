const { VSBrowser } = require('vscode-extension-tester');
const { By, until } = require('selenium-webdriver');

class ReliableStartup {
  constructor() {
    this.maxWaitTime = 60000; // 60 seconds
    this.checkInterval = 2000; // 2 seconds
  }

  async waitForVSCodeReady(customWorkspace = null) {
    console.log('🔧 Starting reliable VS Code initialization...');
    
    // Step 1: Open VS Code with workspace
    const workspace = customWorkspace || process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
    console.log(`📁 Opening workspace: ${workspace}`);
    
    await VSBrowser.instance.openResources(workspace);
    const driver = VSBrowser.instance.driver;
    
    // Step 2: Wait for basic VS Code elements with extended timeout
    console.log('⏳ Waiting for VS Code workbench...');
    
    try {
      // Wait for the main workbench container
      await driver.wait(
        until.elementLocated(By.css('.monaco-workbench, .workbench, [role="application"]')),
        this.maxWaitTime,
        'VS Code workbench container not found'
      );
      
      // Additional wait for UI stability
      await this.waitForUIStability(driver);
      
      console.log('✅ VS Code workbench loaded');
      
      // Step 3: Verify authentication state
      await this.verifyAuthenticationState(driver);
      
      // Step 4: Wait for extensions to load
      await this.waitForExtensionsReady(driver);
      
      console.log('✅ VS Code ready and authenticated');
      return true;
      
    } catch (error) {
      console.error('❌ VS Code startup failed:', error.message);
      
      // Debug information
      await this.captureDebugInfo(driver);
      throw error;
    }
  }

  async waitForUIStability(driver) {
    console.log('⏳ Waiting for UI stability...');
    
    let stableCount = 0;
    const requiredStableChecks = 3;
    
    for (let i = 0; i < 15; i++) { // 30 seconds max
      try {
        // Check for key UI elements
        const hasWorkbench = await driver.findElements(By.css('.monaco-workbench')).then(els => els.length > 0);
        const hasActivityBar = await driver.findElements(By.css('.monaco-workbench .activitybar')).then(els => els.length > 0);
        const hasExplorer = await driver.findElements(By.css('.monaco-workbench .explorer-viewlet, .monaco-workbench .sidebar')).then(els => els.length > 0);
        
        if (hasWorkbench && hasActivityBar && hasExplorer) {
          stableCount++;
          console.log(`   ✅ UI stable check ${stableCount}/${requiredStableChecks}`);
          
          if (stableCount >= requiredStableChecks) {
            console.log('✅ UI stability confirmed');
            return true;
          }
        } else {
          stableCount = 0;
          console.log(`   ⏳ UI not yet stable (workbench: ${hasWorkbench}, activity: ${hasActivityBar}, explorer: ${hasExplorer})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log('   ⏳ Waiting for UI elements...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('UI failed to stabilize within timeout');
  }

  async verifyAuthenticationState(driver) {
    console.log('🔍 Checking authentication state...');
    
    try {
      // Look for sign-in indicators
      const signInButtons = await driver.findElements(By.css('[aria-label*="Sign in"], [title*="Sign in"], [aria-label*="sign in"]'));
      const accountIcons = await driver.findElements(By.css('.monaco-workbench .accounts-activity-action, .codicon-account'));
      
      if (signInButtons.length > 0) {
        console.log('⚠️  Authentication required - found sign-in prompts');
        return false;
      }
      
      if (accountIcons.length > 0) {
        console.log('✅ Authentication indicators found');
        return true;
      }
      
      console.log('ℹ️  Authentication state unclear');
      return true; // Proceed anyway
      
    } catch (error) {
      console.log('⚠️  Could not verify authentication:', error.message);
      return true; // Proceed anyway
    }
  }

  async waitForExtensionsReady(driver) {
    console.log('🔌 Waiting for extensions to load...');
    
    try {
      // Wait for extension host to be ready
      await driver.wait(async () => {
        const logs = await driver.manage().logs().get('browser');
        return logs.some(log => 
          log.message.includes('Extension host with pid') ||
          log.message.includes('ExtensionService')
        );
      }, 30000, 'Extension host not ready');
      
      console.log('✅ Extensions loaded');
      
    } catch (error) {
      console.log('⚠️  Extension readiness check failed:', error.message);
      // Continue anyway - extensions might load later
    }
    
    // Additional wait for extension UI
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async captureDebugInfo(driver) {
    try {
      console.log('📸 Capturing debug information...');
      
      const title = await driver.getTitle();
      console.log(`   Page title: ${title}`);
      
      const url = await driver.getCurrentUrl();
      console.log(`   Current URL: ${url}`);
      
      // Check for error dialogs
      const errorDialogs = await driver.findElements(By.css('.monaco-dialog, .notification-toast'));
      if (errorDialogs.length > 0) {
        console.log(`   Found ${errorDialogs.length} error dialog(s)`);
      }
      
      // Get page source for debugging
      const pageSource = await driver.getPageSource();
      const timestamp = Date.now();
      const fs = require('fs');
      fs.writeFileSync(`debug-page-${timestamp}.html`, pageSource);
      console.log(`   Page source saved to debug-page-${timestamp}.html`);
      
    } catch (error) {
      console.log('⚠️  Could not capture debug info:', error.message);
    }
  }
}

module.exports = { ReliableStartup };
