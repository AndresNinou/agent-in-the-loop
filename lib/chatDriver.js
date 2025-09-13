const { By, until } = require('selenium-webdriver');
const fs = require('fs');

async function focusWritable(frame, selectorList) {
  const driver = frame.getDriver();
  const used = await driver.executeScript((sels) => {
    const visible = (el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0;
    };
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el && visible(el)) { el.focus(); return sel; }
    }
    return null;
  }, selectorList);
  if (!used) throw new Error('No writable input found (selectors inaccurate?)');
  return frame.getDriver().findElement(By.css(used));
}

async function getLastAssistantText(driver, assistantSelector) {
  const els = await driver.findElements(By.css(assistantSelector));
  if (!els.length) return '';
  const text = await els[els.length - 1].getText();
  return (text || '').trim();
}

async function sendAndAwaitReply(frame, cfg) {
  const { selectors, message, modeSwitchActXpath } = cfg;

  // optional: flip to Act
  if (selectors.modeSwitchActXpath) {
    try {
      const act = await frame.findWebElement(By.xpath(selectors.modeSwitchActXpath));
      await act.click();
    } catch {}
  }

  const driver = frame.getDriver();
  await driver.wait(until.elementLocated(By.css(selectors.sendButton)), 15000);

  const before = await getLastAssistantText(driver, selectors.assistantText);

  const inputEl = await focusWritable(frame, selectors.input);
  await inputEl.sendKeys(message);

  const send = await frame.findWebElement(By.css(selectors.sendButton));
  await send.click();

  await driver.wait(async () => {
    const now = await getLastAssistantText(driver, selectors.assistantText);
    return now && now !== before;
  }, 60000, 'Timed out waiting for assistant reply');

  const reply = await getLastAssistantText(driver, selectors.assistantText);
  if (!reply) throw new Error('Assistant reply empty');

  return reply;
}

async function dumpWebviewHTML(frame, path = 'webview.html') {
  try {
    const html = await frame.getDriver().getPageSource();
    fs.writeFileSync(path, html);
  } catch {}
}

module.exports = { sendAndAwaitReply, dumpWebviewHTML };
