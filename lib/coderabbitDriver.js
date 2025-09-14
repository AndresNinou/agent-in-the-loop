const { By, until, Key } = require('selenium-webdriver');
const fs = require('fs');

async function getCodeRabbitState(frame, selectors) {
  const driver = frame.getDriver();

  try {
    // Check for Stop Review button (CodeRabbit processing)
    const stopButtons = await driver.findElements(By.css(selectors.stopReviewButton));
    if (stopButtons.length > 0) return 'processing';
  } catch {}

  try {
    // Check for disabled Review all changes button (CodeRabbit completed)
    const disabledReviewButtons = await driver.findElements(By.css(selectors.reviewAllChangesDisabled));
    if (disabledReviewButtons.length > 0) return 'completed';
  } catch {}

  try {
    // Check for active Review all changes button (ready to start)
    const reviewButtons = await driver.findElements(By.css(selectors.reviewAllChangesButton));
    if (reviewButtons.length > 0) {
      // Make sure it's not disabled
      const isDisabled = await reviewButtons[0]?.getAttribute('disabled');
      if (!isDisabled) return 'ready';
    }
  } catch {}

  return 'unknown';
}

async function waitForCodeRabbitReady(frame, selectors, timeout = 60000) {
  const driver = frame.getDriver();
  const startTime = Date.now();

  console.log('⏳ Waiting for CodeRabbit to be ready...');

  // First, wait for CodeRabbit UI to load
  await driver.wait(async () => {
    const reviewButtons = await driver.findElements(By.css(selectors.reviewAllChangesButton));
    return reviewButtons.length > 0;
  }, 30000, 'Timeout waiting for CodeRabbit UI to appear');

  console.log('   ✅ CodeRabbit UI loaded');

  while (Date.now() - startTime < timeout) {
    const state = await getCodeRabbitState(frame, selectors);
    
    if (state === 'ready') {
      console.log('✅ CodeRabbit is ready for review');
      return true;
    }
    
    console.log(`   Current state: ${state}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Timeout waiting for CodeRabbit to be ready');
}

async function waitForReviewCompletion(frame, selectors, timeout = 300000) { // 5 minutes
  const driver = frame.getDriver();
  const startTime = Date.now();

  console.log('⏳ Waiting for CodeRabbit review to complete...');

  while (Date.now() - startTime < timeout) {
    const state = await getCodeRabbitState(frame, selectors);
    
    if (state === 'completed') {
      console.log('✅ CodeRabbit review completed');
      return true;
    } else if (state === 'processing') {
      console.log('🔄 CodeRabbit is processing review...');
    } else {
      console.log(`   Current state: ${state}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds
  }

  throw new Error('Timeout waiting for CodeRabbit review to complete');
}

async function extractAllComments(frame, selectors) {
  const driver = frame.getDriver();
  const comments = [];

  try {
    console.log('📝 Extracting CodeRabbit comments...');

    // First, click on the Comments tab to ensure it's active
    try {
      const commentsTab = await driver.findElements(By.css(selectors.commentsTab));
      if (commentsTab.length > 0) {
        await commentsTab[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for tab to load
        console.log('   ✅ Comments tab activated');
      }
    } catch (e) {
      console.log('   ℹ️ Comments tab may already be active');
    }

    // Wait for comments list to load
    await driver.wait(until.elementLocated(By.css(selectors.commentsList)), 10000);

    // Find all comment items
    const commentElements = await driver.findElements(By.css(selectors.commentItems));
    console.log(`   Found ${commentElements.length} comment elements`);

    for (const element of commentElements) {
      try {
        // Extract comment text
        let commentText = '';
        try {
          const textElements = await element.findElements(By.css(selectors.commentText));
          if (textElements.length > 0) {
            commentText = await textElements[0].getText();
          }
        } catch {}

        // Extract user (should be CodeRabbit)
        let user = '';
        try {
          const userElements = await element.findElements(By.css(selectors.commentUser));
          if (userElements.length > 0) {
            user = await userElements[0].getText();
          }
        } catch {}

        // Extract line range
        let range = '';
        try {
          const rangeElements = await element.findElements(By.css(selectors.commentRange));
          if (rangeElements.length > 0) {
            range = await rangeElements[0].getText();
          }
        } catch {}

        // Extract file path (from parent elements)
        let filePath = '';
        try {
          const fileElements = await element.findElements(By.css(selectors.filePathLabel));
          if (fileElements.length > 0) {
            filePath = await fileElements[0].getText();
          } else {
            // Look for file path in parent elements
            const parentRows = await driver.findElements(By.css('.monaco-list-row[aria-level="1"]'));
            for (const parentRow of parentRows) {
              const fileLabels = await parentRow.findElements(By.css('.label-name'));
              if (fileLabels.length > 0) {
                filePath = await fileLabels[0].getText();
                break;
              }
            }
          }
        } catch {}

        // Only add if we have meaningful content
        if (commentText && commentText.trim() && commentText.length > 10) {
          const comment = {
            text: commentText.trim(),
            user: user || 'CodeRabbit',
            range: range || 'Unknown',
            filePath: filePath || 'Unknown',
            timestamp: new Date().toISOString()
          };
          
          comments.push(comment);
          console.log(`   📝 Extracted: ${comment.text.substring(0, 80)}...`);
        }
      } catch (e) {
        console.log('   ⚠️ Error extracting comment:', e.message);
        continue;
      }
    }

    console.log(`📊 Extracted ${comments.length} comments total`);
    return comments;

  } catch (e) {
    console.log('⚠️ Error extracting comments:', e.message);
    return [];
  }
}

async function fixAllIssues(frame, selectors) {
  const driver = frame.getDriver();

  try {
    console.log('🛠️ Clicking "Fix all issues" button...');

    // Find and click the Fix all issues button
    const fixButton = await driver.wait(
      until.elementLocated(By.css(selectors.fixAllIssuesButton)), 
      10000
    );
    
    await fixButton.click();
    console.log('   ✅ Clicked "Fix all issues"');

    // Wait for popup dialog to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Handle popup - look for dialog or quick input widget
    try {
      const popupElements = await driver.findElements(By.css(selectors.popupDialog));
      if (popupElements.length > 0) {
        console.log('   📋 Popup dialog appeared');

        // Look for "select all" checkbox and click it
        try {
          const selectAllElements = await driver.findElements(By.css(selectors.selectAllCheckbox));
          if (selectAllElements.length > 0) {
            await selectAllElements[0].click();
            console.log('   ✅ Selected all files');
          }
        } catch (e) {
          console.log('   ℹ️ No select all checkbox found, files may already be selected');
        }

        // Press Enter or click confirm button
        try {
          const confirmButtons = await driver.findElements(By.css(selectors.confirmButton));
          if (confirmButtons.length > 0) {
            await confirmButtons[0].click();
            console.log('   ✅ Clicked confirm button');
          } else {
            // Fallback: press Enter
            await driver.actions().sendKeys(Key.ENTER).perform();
            console.log('   ✅ Pressed Enter to confirm');
          }
        } catch (e) {
          // Final fallback: press Enter
          await driver.actions().sendKeys(Key.ENTER).perform();
          console.log('   ✅ Pressed Enter (fallback)');
        }
      } else {
        // No popup appeared, just press Enter
        await driver.actions().sendKeys(Key.ENTER).perform();
        console.log('   ✅ No popup, pressed Enter directly');
      }
    } catch (e) {
      console.log('   ⚠️ Error handling popup:', e.message);
      // Try pressing Enter as fallback
      await driver.actions().sendKeys(Key.ENTER).perform();
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: 'Fix all issues completed'
    };

  } catch (error) {
    console.error('❌ Error fixing all issues:', error.message);
    throw error;
  }
}

async function startReview(frame, cfg) {
  const { selectors } = cfg;
  const driver = frame.getDriver();

  // Wait for CodeRabbit to be ready
  await waitForCodeRabbitReady(frame, selectors);

  // Click "Review all changes" button
  console.log('🔍 Starting CodeRabbit review...');
  const reviewButton = await driver.wait(
    until.elementLocated(By.css(selectors.reviewAllChangesButton)), 
    10000
  );
  
  await reviewButton.click();
  console.log('   ✅ Clicked "Review all changes"');

  // Wait for review to complete
  await waitForReviewCompletion(frame, selectors);

  // Extract all the comments
  const comments = await extractAllComments(frame, selectors);

  console.log(`📊 Review completed with ${comments.length} comments`);

  return {
    success: true,
    comments: comments,
    commentCount: comments.length
  };
}

async function dumpWebviewHTML(frame, path = 'coderabbit-webview.html') {
  try {
    const html = await frame.getDriver().getPageSource();
    fs.writeFileSync(path, html);
    console.log(`🗂️ HTML dumped to: ${path}`);
  } catch (e) {
    console.log('⚠️ Could not dump HTML:', e.message);
  }
}

module.exports = {
  startReview,
  getCodeRabbitState,
  waitForCodeRabbitReady,
  waitForReviewCompletion,
  extractAllComments,
  fixAllIssues,
  dumpWebviewHTML
};
