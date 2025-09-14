const { openAndAttach } = require('./openAttach');
const { startReview, getCodeRabbitState, extractAllComments, fixAllIssues, dumpWebviewHTML } = require('./coderabbitDriver');
const { ReliableStartup } = require('./reliableStartup');

class CodeRabbitSession {
  constructor(sessionId, frame) {
    this.sessionId = sessionId;
    this.frame = frame;
    this.comments = [];
    this.startTime = Date.now();
    this.reviewCount = 0;
  }

  async startReview() {
    try {
      const cfg = require('../selectors/coderabbit.json');

      console.log(`\n🔄 Session ${this.sessionId}: Starting code review...`);

      // Check CodeRabbit readiness
      console.log(`🔍 Session ${this.sessionId}: Checking CodeRabbit state...`);
      const currentState = await this.getState();
      console.log(`   Current state: ${currentState}`);

      const result = await startReview(this.frame, cfg);

      if (result.success) {
        // Add comments to our collection
        this.comments.push(...result.comments);
        this.reviewCount++;

        console.log(`✅ Session ${this.sessionId}: Review completed with ${result.comments.length} comment(s)`);

        // Log the comments
        result.comments.forEach((comment, idx) => {
          console.log(`📝 Comment ${idx + 1}: ${comment.text.substring(0, 100)}${comment.text.length > 100 ? '...' : ''}`);
        });

        return {
          success: true,
          comments: result.comments,
          sessionId: this.sessionId,
          totalComments: this.comments.length,
          reviewCount: this.reviewCount
        };
      }
    } catch (error) {
      console.error(`❌ Session ${this.sessionId}: Error starting review:`, error.message);
      await dumpWebviewHTML(this.frame, `error-coderabbit-${this.sessionId}-${Date.now()}.html`);
      throw error;
    }
  }

  async fixAllIssues() {
    try {
      const cfg = require('../selectors/coderabbit.json');
      
      console.log(`\n🛠️ Session ${this.sessionId}: Fixing all issues...`);
      
      const result = await fixAllIssues(this.frame, cfg);
      
      if (result.success) {
        console.log(`✅ Session ${this.sessionId}: All issues fixed successfully`);
        return result;
      }
    } catch (error) {
      console.error(`❌ Session ${this.sessionId}: Error fixing issues:`, error.message);
      throw error;
    }
  }

  async getAllComments() {
    const cfg = require('../selectors/coderabbit.json');
    return await extractAllComments(this.frame, cfg.selectors);
  }

  async getState() {
    const cfg = require('../selectors/coderabbit.json');
    return await getCodeRabbitState(this.frame, cfg.selectors);
  }

  getStats() {
    return {
      sessionId: this.sessionId,
      totalComments: this.comments.length,
      reviewCount: this.reviewCount,
      duration: Date.now() - this.startTime,
      state: this.getState()
    };
  }

  async close() {
    try {
      await this.frame.switchBack();
      console.log(`🔒 Session ${this.sessionId}: Closed`);
    } catch (error) {
      console.error(`❌ Session ${this.sessionId}: Error closing:`, error.message);
    }
  }
}

class CodeRabbitController {
  constructor() {
    this.sessions = new Map();
    this.sessionCounter = 0;
  }

  async createSession(retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const sessionId = `coderabbit-${++this.sessionCounter}`;
        console.log(`\n🆕 Creating new CodeRabbit session: ${sessionId} (attempt ${attempt}/${retries})`);

        // Use reliable startup for better timing
        const reliableStartup = new ReliableStartup();
        await reliableStartup.waitForVSCodeReady();

        const cfg = require('../selectors/coderabbit.json');
        console.log(`📋 Using config: extensionId=${cfg.extensionId}`);
        
        // Add extra wait before attempting attachment
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const { frame } = await openAndAttach(cfg);
        console.log(`🔗 Successfully attached to webview frame`);
        
        // Verify the frame is working by testing basic interaction
        const driver = frame.getDriver();
        console.log('🔍 Verifying frame functionality...');
        
        // Extended wait for the frame to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if basic elements are present
        const bodyElements = await driver.findElements({ css: 'body' });
        if (bodyElements.length === 0) {
          throw new Error('Webview frame is not properly loaded (no body element found)');
        }
        
        const session = new CodeRabbitSession(sessionId, frame);
        this.sessions.set(sessionId, session);

        console.log(`✅ Session ${sessionId}: Created successfully and verified`);
        return sessionId;
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt < retries) {
          console.log(`🔄 Waiting 5 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Reset session counter if we're retrying
          this.sessionCounter--;
        }
      }
    }
    
    console.error(`💥 All ${retries} attempts failed. Last error:`, lastError.message);
    throw new Error(`Failed to create session after ${retries} attempts: ${lastError.message}`);
  }

  async startReview(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return await session.startReview();
  }

  async fixAllIssues(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return await session.fixAllIssues();
  }

  async getSessionComments(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.comments;
  }

  async getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return await session.getState();
  }

  async getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.getStats();
  }

  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.close();
      this.sessions.delete(sessionId);
      console.log(`🗑️  Session ${sessionId}: Removed`);
    }
  }

  async closeAllSessions() {
    console.log('\n🔒 Closing all CodeRabbit sessions...');
    for (const [sessionId, session] of this.sessions) {
      await session.close();
    }
    this.sessions.clear();
    console.log('✅ All sessions closed');
  }

  getAllSessions() {
    return Array.from(this.sessions.keys());
  }

  getStats() {
    const sessionStats = [];
    for (const [sessionId, session] of this.sessions) {
      sessionStats.push(session.getStats());
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.keys()),
      sessionStats: sessionStats,
      totalComments: sessionStats.reduce((sum, s) => sum + s.totalComments, 0),
      totalReviews: sessionStats.reduce((sum, s) => sum + s.reviewCount, 0)
    };
  }
}

// Export singleton instance for easy use
const codeRabbitController = new CodeRabbitController();

module.exports = {
  CodeRabbitController,
  codeRabbitController
};
