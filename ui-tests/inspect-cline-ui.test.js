const { VSBrowser } = require('vscode-extension-tester');
const fs = require('fs');
const path = require('path');

describe('Inspect Cline UI', function () {
  this.timeout(5 * 60 * 1000); // 5 minutes

  it('should inspect Cline UI and dump HTML', async () => {
    console.log('\n🔍 INSPECTING CLINE UI');
    console.log('=======================\n');

    await VSBrowser.instance.openResources();

    // Try to open Cline using the existing method
    const { openAndAttach } = require('../lib/openAttach');
    const cfg = require('../selectors/cline.json');

    try {
      console.log('📋 Opening Cline extension...');
      const { frame } = await openAndAttach(cfg);
      console.log('✅ Cline opened successfully');

      // Wait for the extension to fully load - this can take time
      console.log('⏳ Waiting for Cline extension to fully load...');
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds

      // Additional wait for UI elements to appear
      const driver = frame.getDriver();
      await driver.wait(async () => {
        const inputs = await driver.findElements({ css: 'input, textarea, [contenteditable], [role="textbox"]' });
        const buttons = await driver.findElements({ css: 'button, [role="button"], vscode-button' });
        // Also check for Cline-specific elements
        const clineElements = await driver.findElements({ css: '[data-testid*="chat"], [data-testid*="cline"], .sc-gkCgsS, .sc-ienWRC' });
        return inputs.length > 0 || buttons.length > 0 || clineElements.length > 0;
      }, 20000, 'Timeout waiting for Cline UI elements to appear');

      // Get the page source to inspect the HTML structure
      // driver is already declared above
      const html = await driver.getPageSource();

      // Save the HTML for inspection
      const htmlPath = path.join(__dirname, '..', 'cline-ui-inspection.html');
      fs.writeFileSync(htmlPath, html);
      console.log(`📄 HTML saved to: ${htmlPath}`);

      // Try to find input elements
      console.log('\n🔍 Looking for input elements...');
      const inputs = await driver.findElements({ css: 'input, textarea, [contenteditable], [role="textbox"]' });
      console.log(`Found ${inputs.length} potential input elements`);

      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        try {
          const tagName = await inputs[i].getTagName();
          const attributes = await driver.executeScript(`
            const el = arguments[0];
            const attrs = {};
            for (let attr of el.attributes) {
              attrs[attr.name] = attr.value;
            }
            return attrs;
          `, inputs[i]);

          console.log(`Input ${i + 1}: <${tagName}> with attributes:`, JSON.stringify(attributes, null, 2));
        } catch (e) {
          console.log(`Input ${i + 1}: Could not inspect - ${e.message}`);
        }
      }

      // Look for buttons
      console.log('\n🔍 Looking for button elements...');
      const buttons = await driver.findElements({ css: 'button, [role="button"], vscode-button' });
      console.log(`Found ${buttons.length} potential button elements`);

      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        try {
          const text = await buttons[i].getText();
          const tagName = await buttons[i].getTagName();
          console.log(`Button ${i + 1}: <${tagName}> "${text}"`);
        } catch (e) {
          console.log(`Button ${i + 1}: Could not inspect - ${e.message}`);
        }
      }

      await frame.switchBack();
      console.log('\n✅ UI inspection complete! Check the HTML file for detailed structure.');

    } catch (error) {
      console.error('❌ Failed to inspect Cline UI:', error.message);

      // Try to get some basic page info even if Cline opening failed
      try {
        const driver = VSBrowser.instance.driver;
        const title = await driver.getTitle();
        console.log('Current page title:', title);

        const url = await driver.getCurrentUrl();
        console.log('Current URL:', url);
      } catch (e) {
        console.log('Could not get basic page info:', e.message);
      }
    }
  });
});
