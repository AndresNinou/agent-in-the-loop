const { VSBrowser } = require('vscode-extension-tester');
const assert = require('assert');
const { openAndAttach } = require('../lib/openAttach');
const { sendAndAwaitReply, dumpWebviewHTML } = require('../lib/chatDriver');

describe('Cline chat (config-driven, no UI inspection)', function () {
  this.timeout(3 * 60 * 1000);

  it('opens, sends message, reads reply', async () => {
    const cfg = require('../selectors/cline.json');
    await VSBrowser.instance.openResources();

    let frame;
    try {
      const { frame: f } = await openAndAttach(cfg);
      frame = f;

      const reply = await sendAndAwaitReply(frame, cfg);
      assert.ok(reply.length > 0, 'Expected non-empty assistant reply');

      await frame.switchBack();
    } catch (e) {
      if (frame) await dumpWebviewHTML(frame);
      throw e;
    }
  });
});
