const { openAndAttach } = require('./openAttach');
const { sendMessage, getAllMessages, getClineState, dumpWebviewHTML, configureAutoApproveSettings } = require('./chatDriver');

class ClineSession {
  constructor(sessionId, frame) {
    this.sessionId = sessionId;
    this.frame = frame;
    this.messages = [];
    this.cost = 0;
    this.startTime = Date.now();
    this.messageCount = 0;
  }

  async sendMessage(message) {
    try {
      const cfg = require('../selectors/cline.json');
      cfg.message = message;

      console.log(`\n🔄 Session ${this.sessionId}: Sending message...`);

      // Additional check: ensure Cline is truly ready before sending
      console.log(`🔍 Session ${this.sessionId}: Double-checking Cline readiness...`);
      const currentState = await this.getState();
      console.log(`   Current state: ${currentState}`);

      if (currentState !== 'ready' && currentState !== 'done') {
        console.log(`⚠️  Session ${this.sessionId}: Cline not ready (${currentState}), waiting...`);
        // Wait a bit more for Cline to settle
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      const result = await sendMessage(this.frame, cfg);

      if (result.success) {
        // Add new messages to our collection
        this.messages.push(...result.messages);
        this.messageCount += result.messages.length;

        console.log(`✅ Session ${this.sessionId}: Received ${result.messages.length} message(s)`);

        // Log the messages
        result.messages.forEach((msg, idx) => {
          console.log(`📝 Message ${this.messageCount - result.messages.length + idx + 1}: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
        });

        return {
          success: true,
          messages: result.messages,
          sessionId: this.sessionId,
          totalMessages: this.messages.length,
          cost: this.cost
        };
      }
    } catch (error) {
      console.error(`❌ Session ${this.sessionId}: Error sending message:`, error.message);
      await dumpWebviewHTML(this.frame, `error-${this.sessionId}-${Date.now()}.html`);
      throw error;
    }
  }

  async getAllMessages() {
    const cfg = require('../selectors/cline.json');
    return await getAllMessages(this.frame, cfg.selectors);
  }

  async getState() {
    const cfg = require('../selectors/cline.json');
    return await getClineState(this.frame, cfg.selectors);
  }

  getStats() {
    return {
      sessionId: this.sessionId,
      totalMessages: this.messages.length,
      cost: this.cost,
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

class ClineController {
  constructor() {
    this.sessions = new Map();
    this.sessionCounter = 0;
  }

  async createSession() {
    try {
      const sessionId = `cline-${++this.sessionCounter}`;
      console.log(`\n🆕 Creating new Cline session: ${sessionId}`);

      const cfg = require('../selectors/cline.json');
      const { frame } = await openAndAttach(cfg);

      const session = new ClineSession(sessionId, frame);
      this.sessions.set(sessionId, session);

      console.log(`✅ Session ${sessionId}: Created successfully`);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create session:', error.message);
      throw error;
    }
  }

  async sendMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return await session.sendMessage(message);
  }

  async getSessionMessages(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.messages;
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
    console.log('\n🔒 Closing all Cline sessions...');
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
      totalMessages: sessionStats.reduce((sum, s) => sum + s.totalMessages, 0),
      totalCost: sessionStats.reduce((sum, s) => sum + s.cost, 0)
    };
  }
}

// Export singleton instance for easy use
const clineController = new ClineController();

module.exports = {
  ClineController,
  clineController
};
