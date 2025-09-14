const { VSBrowser } = require('vscode-extension-tester');
const fs = require('fs');
const path = require('path');

describe('Manual Persistence Verification', function () {
  this.timeout(10 * 60 * 1000); // 10 minutes timeout

  it('should open VS Code and wait for manual verification', async () => {
    console.log('\n========================================');
    console.log('🔍 MANUAL PERSISTENCE VERIFICATION TEST');
    console.log('========================================\n');
    
    // Check for state.vscdb
    const stateFile = path.join(__dirname, '..', 'vscode-test-persistent', 'settings', 'User', 'globalStorage', 'state.vscdb');
    
    if (fs.existsSync(stateFile)) {
      const stats = fs.statSync(stateFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Found state.vscdb (${sizeMB} MB)`);
    } else {
      console.log('❌ No state.vscdb found');
    }
    
    await VSBrowser.instance.openResources();
    
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. VS Code should now be open');
    console.log('2. Check if you are logged in (GitHub, Microsoft, etc.)');
    console.log('3. If not logged in:');
    console.log('   - Log in to your accounts now');
    console.log('   - Install any extensions you need');
    console.log('   - Configure any settings');
    console.log('4. The test will wait for 5 minutes');
    console.log('5. Your login state will be preserved for next run\n');
    
    console.log('⏰ Waiting 5 minutes for manual verification...');
    console.log('   (You can press Ctrl+C to stop early)\n');
    
    // Wait 5 minutes for manual verification
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    console.log('✅ Test complete - state should be preserved');
  });
});
