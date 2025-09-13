const { ActivityBar, EditorView, WebView, WebviewView } = require('vscode-extension-tester');
const { Key } = require('selenium-webdriver');

async function tryPalette(driver, commandIdOrLabel) {
  if (!commandIdOrLabel) return false;
  const chord = process.platform === 'darwin'
    ? Key.chord(Key.META, Key.SHIFT, 'p')
    : Key.chord(Key.CONTROL, Key.SHIFT, 'p');
  await driver.actions().sendKeys(chord).perform();
  await driver.sleep(150);
  await driver.actions().sendKeys(commandIdOrLabel).perform();
  await driver.sleep(120);
  await driver.actions().sendKeys(Key.ENTER).perform();
  return true;
}

async function openAndAttach(config) {
  const { open } = config;
  const driver = require('vscode-extension-tester').VSBrowser.instance.driver;

  // 1) Command Palette (best)
  if (open.commandPalette) await tryPalette(driver, open.commandPalette);

  // 2) Editor tab path
  try {
    if (open.editorTabTitle) {
      await new EditorView().openEditor(open.editorTabTitle);
      const wv = new WebView();
      await wv.switchToFrame(15000);
      return { frame: wv, kind: 'editor' };
    }
  } catch { /* fall through */ }

  // 3) Activity Bar sidebar path
  if (open.activityBarTitle) {
    const activity = new ActivityBar();
    const controls = await activity.getViewControls();
    for (const c of controls) {
      const title = await c.getTitle();
      if (title && title.toLowerCase().includes(open.activityBarTitle.toLowerCase())) {
        await c.openView();
        const vw = new WebviewView();
        await vw.switchToFrame(15000);
        return { frame: vw, kind: 'sidebar' };
      }
    }
  }

  throw new Error('Could not open/attach to extension webview (check open.* values).');
}

module.exports = { openAndAttach };
