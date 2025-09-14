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

async function getClineState(frame, selectors) {
  const driver = frame.getDriver();

  try {
    // Check for Cancel button (agent thinking)
    const cancelButtons = await driver.findElements(By.css(selectors.cancelButton));
    if (cancelButtons.length > 0) return 'thinking';
  } catch {}

  try {
    // Check for Proceed While Running button (agent running command)
    const proceedButtons = await driver.findElements(By.css(selectors.proceedButton));
    if (proceedButtons.length > 0) return 'running';
  } catch {}

  try {
    // Check for Start New Task button (agent done)
    const startButtons = await driver.findElements(By.css(selectors.startNewTaskButton));
    if (startButtons.length > 0) return 'done';
  } catch {}

  // No special buttons = ready for input
  return 'ready';
}

async function waitForReadyState(frame, selectors, timeout = 120000) { // Increased to 2 minutes
  const driver = frame.getDriver();
  const startTime = Date.now();

  console.log('⏳ Waiting for Cline to be ready for NEW message...');

  // First, wait for the extension to load its basic UI
  console.log('   Waiting for extension UI to load...');
  await driver.wait(async () => {
    const inputs = await driver.findElements({ css: 'input, textarea, [contenteditable], [role="textbox"]' });
    const buttons = await driver.findElements({ css: 'button, [role="button"], vscode-button' });
    // Also check for Cline-specific elements
    const clineElements = await driver.findElements({ css: '[data-testid*="chat"], [data-testid*="cline"], .sc-gkCgsS, .sc-ienWRC' });
    return inputs.length > 0 || buttons.length > 0 || clineElements.length > 0;
  }, 45000, 'Timeout waiting for Cline UI elements to appear');

  console.log('   ✅ Extension UI loaded, now checking state...');

  let consecutiveReadyChecks = 0;
  const requiredConsecutiveReady = 3; // Need 3 consecutive ready checks

  while (Date.now() - startTime < timeout) {
    const state = await getClineState(frame, selectors);
    const isProcessing = await isProcessingApiRequest(frame, selectors);

    // If we're still processing an API request, definitely not ready
    if (isProcessing) {
      consecutiveReadyChecks = 0;
      console.log('   🔄 Still processing API request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    if (state === 'ready') {
      consecutiveReadyChecks++;
      console.log(`   ✅ Cline ready check ${consecutiveReadyChecks}/${requiredConsecutiveReady}`);

      if (consecutiveReadyChecks >= requiredConsecutiveReady) {
        console.log('✅ Cline is ready for input (confirmed)');
        return true;
      }
    } else {
      consecutiveReadyChecks = 0;

      if (state === 'thinking') {
        console.log('🤔 Cline is thinking... waiting');
      } else if (state === 'running') {
        console.log('⚙️  Cline is running command... waiting');
      } else if (state === 'done') {
        console.log('✅ Cline is done - should be ready for new task');
        // For 'done' state, we still need to verify it's actually ready
        consecutiveReadyChecks++;
      } else {
        console.log(`   Current state: ${state}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
  }

  throw new Error('Timeout waiting for Cline to be ready');
}

async function extractMessages(frame, selectors) {
  const driver = frame.getDriver();

  const messages = [];

  try {
    // Try multiple selector strategies to find messages
    const selectorStrategies = [
      // Most specific selectors first
      '.sc-ienWRC .ph-no-capture',
      '.sc-gkCgsS.bnbjFC.ph-no-capture',
      selectors.messageContainer,
      selectors.messageText,
      selectors.assistantText,
      '.sc-ienWRC',
      '[data-index] .sc-gkCgsS',
      '[data-index] .sc-ienWRC',
      '.ph-no-capture',
      // Generic text content selectors
      '[data-index] p',
      '.message-content p',
      '.chat-message p'
    ];

    for (const selector of selectorStrategies) {
      try {
        const elements = await driver.findElements(By.css(selector));

        for (const element of elements) {
          try {
            let text = '';

            // Try to get text directly from the element
            text = await element.getText();

            // If no text, try to find a paragraph inside
            if (!text || text.trim() === '') {
              try {
                const pElement = await element.findElement(By.css('p'));
                text = await pElement.getText();
              } catch {}
            }

            // If still no text, try to find any text content
            if (!text || text.trim() === '') {
              try {
                const textElements = await element.findElements(By.css('*'));
                for (const textEl of textElements) {
                  const elText = await textEl.getText();
                  if (elText && elText.trim()) {
                    text = elText.trim();
                    break;
                  }
                }
              } catch {}
            }

            if (text && text.trim() && text.length > 5) { // Lower threshold for message detection
              // Clean up the text
              text = text.trim();

              // Skip very short or generic text that might be UI elements
              if (text.length < 100 && (
                text.toLowerCase().includes('api request') ||
                text.toLowerCase().includes('thinking') ||
                text.toLowerCase().includes('loading') ||
                text === '✕' ||
                text === '@' ||
                /^\d+\.\d+$/.test(text) // Skip version numbers or simple numbers
              )) {
                continue;
              }

              // Avoid duplicates by checking if similar content already exists
              const isDuplicate = messages.some(existing =>
                existing.includes(text.substring(0, 30)) ||
                text.includes(existing.substring(0, 30)) ||
                calculateSimilarity(existing, text) > 0.8
              );

              if (!isDuplicate) {
                messages.push(text);
                console.log(`📝 Found message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
              }
            }
          } catch (e) {
            // Skip this element
            continue;
          }
        }
      } catch (e) {
        // Skip this selector strategy
        continue;
      }
    }

    console.log(`📊 Extracted ${messages.length} messages using multiple strategies`);
    return messages;
  } catch (e) {
    console.log('Warning: Could not extract messages:', e.message);
    return [];
  }
}

// Helper function to calculate text similarity
function calculateSimilarity(text1, text2) {
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

async function isProcessingApiRequest(frame, selectors) {
  const driver = frame.getDriver();

  try {
    // Check for API request indicators that show active processing
    const apiIndicators = await driver.findElements(By.css(selectors.apiRequestIndicator));
    if (apiIndicators.length > 0) {
      // Check if any of these indicators show active processing (not completed)
      for (const indicator of apiIndicators) {
        try {
          const text = await indicator.getText();
          // If it contains "API Request" but no completion indicators, it's still processing
          if (text.includes('API Request') && !text.includes('$') && !text.includes('Complete')) {
            console.log('🔄 API request in progress...');
            return true;
          }
        } catch {}
      }
    }
  } catch {}

  try {
    // Check for processing indicators
    const processingIndicators = await driver.findElements(By.css(selectors.processingIndicator));
    if (processingIndicators.length > 0) {
      console.log('⚙️  Processing in progress...');
      return true;
    }
  } catch {}

  // Check for buttons above the auto-approve section that indicate processing
  try {
    // Look for any buttons that might indicate processing state
    const processingButtons = await driver.findElements(By.css('vscode-button, button, [role="button"]'));
    for (const button of processingButtons) {
      try {
        const buttonText = await button.getText();
        // If we find buttons that indicate processing or cancellation
        if (buttonText.includes('Cancel') || buttonText.includes('Stop') || buttonText.includes('Abort')) {
          console.log('🚫 Found processing button - Cline is still active');
          return true;
        }
      } catch {}
    }
  } catch {}

  // Check for text content that indicates active processing (not completed requests)
  try {
    const pageText = await driver.findElement(By.css('body')).getText();

    // Check for specific states that indicate Cline is still actively working
    const hasActiveStates = pageText.includes('run command') ||
                           pageText.includes('Running command') ||
                           pageText.includes('Executing') ||
                           pageText.includes('Loading') ||
                           pageText.includes('Processing') ||
                           pageText.includes('Thinking');

    // Check for completion indicators
    const hasCompletionIndicators = pageText.includes('Start New Task') ||
                                   (pageText.includes('API Request') && pageText.includes('$') && !hasActiveStates);

    if (hasActiveStates) {
      console.log('📡 Detected active processing state (run command, etc.)...');
      return true;
    }

    // Only consider completed if we see "Start New Task" or API request with cost but no active states
    if (hasCompletionIndicators) {
      console.log('✅ Cline appears to be truly completed (Start New Task or final API state)');
      return false;
    }
  } catch {}

  // Check if there are any elements above the auto-approve section that indicate processing
  try {
    const autoApproveSection = await driver.findElements(By.css(selectors.autoApproveSection));
    if (autoApproveSection.length > 0) {
      // If we can find the auto-approve section, check if there are processing elements above it
      const completionIndicator = await driver.findElements(By.css(selectors.completionIndicator));
      if (completionIndicator.length > 0) {
        // The auto-approve section exists and is visible - this is a good sign Cline is done
        console.log('✅ Auto-approve section visible - Cline appears to be done processing');
        return false;
      }
    }
  } catch {}

  return false;
}

async function waitForCompletion(frame, selectors, timeout = 300000) { // 5 minutes
  const driver = frame.getDriver();
  const startTime = Date.now();

  console.log('⏳ Waiting for Cline to complete response...');

  let lastMessageCount = 0;
  let stableCount = 0;
  const requiredStableChecks = 8; // Full checks for uncertain states
  const quickStableChecks = 1; // IMMEDIATE when we detect proper completion

  while (Date.now() - startTime < timeout) {
    const state = await getClineState(frame, selectors);
    const isProcessing = await isProcessingApiRequest(frame, selectors);

    // CRITICAL: If Cancel button is present, Cline is still thinking/processing
    if (state === 'thinking') {
      stableCount = 0; // Reset stability counter
      console.log('🚫 Cancel button detected - Cline is still processing...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer when actively processing
      continue;
    }

    // Always check for messages, regardless of state
    const messages = await extractMessages(frame, selectors);

    if (messages.length > lastMessageCount) {
      console.log(`📝 Detected ${messages.length - lastMessageCount} new message(s)`);
      console.log(`   Total messages now: ${messages.length}`);
      lastMessageCount = messages.length;
      stableCount = 0; // Reset stability counter when new messages arrive
    }

    // If we're still processing an API request, keep waiting
    if (isProcessing) {
      stableCount = 0; // Reset stability while processing
      console.log('   🔄 Still processing API request...');
    }
    // Check if we're in a completion state AND not processing
    else if (state === 'ready' || state === 'done') {
      // IMMEDIATE RETURN when we detect proper completion state
      if (isProcessing === false) {
        console.log('🚀 IMMEDIATE: Detected proper completion state - sending next message now!');
        console.log(`📊 Final message count: ${messages.length}`);

        // Log the actual messages for debugging
        if (messages.length > 0) {
          console.log('📝 Response messages:');
          messages.forEach((msg, idx) => {
            console.log(`   ${idx + 1}: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
          });
        }

        return messages; // Return immediately when we detect proper completion
      }

      // If still processing, use stability checks
      if (messages.length === lastMessageCount) {
        stableCount++;
        console.log(`   Messages stable for ${stableCount}/${requiredStableChecks} checks`);

        if (stableCount >= requiredStableChecks) {
          console.log('✅ Cline response completed (fallback)');
          console.log(`📊 Final message count: ${messages.length}`);

          // Log the actual messages for debugging
          if (messages.length > 0) {
            console.log('📝 Response messages:');
            messages.forEach((msg, idx) => {
              console.log(`   ${idx + 1}: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
            });
          }

          return messages; // Return all messages (we'll filter new ones in sendMessage)
        }
      } else {
        stableCount = 0; // Reset if messages changed
      }
    } else {
      // Reset stability if not in completion state
      stableCount = 0;
      console.log(`   Current state: ${state}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1500)); // Check every 1.5 seconds for faster response
  }

  // Timeout - return whatever messages we have
  console.log('⏰ Timeout reached, returning available messages');
  const finalMessages = await extractMessages(frame, selectors);
  console.log(`📊 Timeout message count: ${finalMessages.length}`);
  return finalMessages;
}

async function configureAutoApproveSettings(frame, selectors) {
  const driver = frame.getDriver();

  try {
    console.log('⚙️ Configuring Cline auto-approve settings...');

    // First, try to expand the auto-approve section by clicking the chevron
    try {
      const chevronButton = await driver.findElements(By.css(selectors.autoApproveChevron));
      if (chevronButton.length > 0) {
        console.log('📂 Clicking chevron to expand auto-approve settings...');
        await chevronButton[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for expansion
      }
    } catch (e) {
      console.log('ℹ️ Chevron not found or already expanded');
    }

    // Click the "Toggle all" checkbox
    try {
      const toggleAllCheckbox = await driver.findElements(By.css(selectors.toggleAllCheckbox));
      if (toggleAllCheckbox.length > 0) {
        console.log('✅ Clicking "Toggle all" to enable all permissions...');
        await toggleAllCheckbox[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.log('⚠️ Could not find or click "Toggle all" checkbox:', e.message);
    }

    // Update Max Requests to 100
    try {
      const maxRequestsField = await driver.findElements(By.css(selectors.maxRequestsField));
      if (maxRequestsField.length > 0) {
        console.log('🔢 Updating Max Requests to 100...');
        const input = await maxRequestsField[0].findElement(By.css('input'));
        await input.clear();
        await input.sendKeys('100');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.log('⚠️ Could not find or update Max Requests field:', e.message);
    }

    console.log('✅ Auto-approve settings configured successfully');
  } catch (e) {
    console.log('⚠️ Could not configure auto-approve settings:', e.message);
  }
}

// Global flag to track if auto-approve settings have been configured
let autoApproveConfigured = false;

async function sendMessage(frame, cfg) {
  const { selectors, message } = cfg;
  const driver = frame.getDriver();

  // Wait for Cline to be ready
  await waitForReadyState(frame, selectors);

  // Configure auto-approve settings on first message
  if (!autoApproveConfigured) {
    console.log('🔧 First message detected - configuring auto-approve settings...');
    await configureAutoApproveSettings(frame, selectors);
    autoApproveConfigured = true;
  }

  // Get messages BEFORE sending our message
  const messagesBefore = await extractMessages(frame, selectors);
  console.log(`📊 Messages before sending: ${messagesBefore.length}`);

  // Find and focus input
  const inputEl = await focusWritable(frame, selectors.input);

  // Clear any existing text
  await inputEl.clear();

  // Send the message
  await inputEl.sendKeys(message);

  // Find and click send button
  const sendButton = await driver.wait(until.elementLocated(By.css(selectors.sendButton)), 5000);
  await sendButton.click();

  console.log(`📤 Sent message: "${message}"`);

  // Wait for completion and get all messages after
  const allMessagesAfter = await waitForCompletion(frame, selectors);

  // Calculate new messages (difference between before and after)
  const newMessages = allMessagesAfter.slice(messagesBefore.length);

  console.log(`📊 Messages after completion: ${allMessagesAfter.length}`);
  console.log(`📊 New messages from response: ${newMessages.length}`);

  return {
    success: true,
    messages: newMessages,
    messageCount: newMessages.length,
    totalMessages: allMessagesAfter.length
  };
}

async function getAllMessages(frame, selectors) {
  return await extractMessages(frame, selectors);
}

async function dumpWebviewHTML(frame, path = 'webview.html') {
  try {
    const html = await frame.getDriver().getPageSource();
    fs.writeFileSync(path, html);
  } catch {}
}

module.exports = {
  sendMessage,
  getAllMessages,
  getClineState,
  waitForReadyState,
  waitForCompletion,
  extractMessages,
  dumpWebviewHTML
};
