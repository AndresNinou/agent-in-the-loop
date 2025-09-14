const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('../lib/ClineController');
const fs = require('fs');
const path = require('path');

describe('API Persistent Cline Session', function () {
  this.timeout(60 * 60 * 1000); // 1 hour timeout
  
  let session;
  const inputFile = process.env.SESSION_INPUT_FILE;
  const outputFile = process.env.SESSION_OUTPUT_FILE;
  const sessionId = process.env.SESSION_ID || 'unknown';
  
  before(async function() {
    console.log(`🚀 Initializing API persistent Cline session: ${sessionId}`);
    console.log(`📁 Input file: ${inputFile}`);
    console.log(`📄 Output file: ${outputFile}`);
    
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/coding_playground';
    console.log(`📂 Opening workspace: ${customWorkspace}`);
    
    try {
      // Initialize VS Code and workspace
      console.log('🔧 Starting VSBrowser...');
      await VSBrowser.instance.openResources(customWorkspace);
      console.log('✅ VSBrowser initialized successfully');
      
      // Create persistent Cline session
      console.log('🎯 Creating Cline session...');
      session = await clineController.createSession();
      console.log(`✅ Persistent Cline session created: ${session}`);
      
      // Write ready signal to output file
      const readySignal = 'SESSION_READY\n';
      console.log(`📤 Writing ready signal to: ${outputFile}`);
      fs.writeFileSync(outputFile, readySignal);
      console.log('🎉 Session is ready for API communication');
      
    } catch (error) {
      console.error('❌ Error during session initialization:', error);
      const errorData = {
        success: false,
        error: `Session initialization failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(outputFile, JSON.stringify(errorData) + '\n');
      throw error;
    }
  });
  
  it('should handle persistent API messages', async function() {
    let messageCounter = 0;
    console.log(`🔄 Starting message loop for session ${sessionId}`);
    
    while (true) {
      try {
        // Check for new message in input file
        if (fs.existsSync(inputFile)) {
          const content = fs.readFileSync(inputFile, 'utf8').trim();
          
          if (content && content !== 'STOP_SESSION') {
            messageCounter++;
            console.log(`📨 Processing message ${messageCounter}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
            
            // Clear input file immediately
            fs.writeFileSync(inputFile, '');
            
            try {
              // Send message to Cline
              console.log(`🤖 Sending to Cline...`);
              const result = await clineController.sendMessage(session, content);
              console.log(`✅ Received response from Cline (${result.messages.length} messages)`);
              
              // Prepare response data
              const responseData = {
                success: true,
                messageId: messageCounter,
                response: result.messages.join('\n\n'),
                timestamp: new Date().toISOString(),
                totalMessages: result.totalMessages,
                newMessages: result.messageCount
              };
              
              console.log(`📤 Writing response (${responseData.response.length} chars)`);
              
              // Write response to output file
              fs.writeFileSync(outputFile, JSON.stringify(responseData) + '\n');
              
            } catch (messageError) {
              console.error(`❌ Error processing message ${messageCounter}:`, messageError);
              const errorData = {
                success: false,
                messageId: messageCounter,
                error: messageError.message,
                timestamp: new Date().toISOString()
              };
              fs.writeFileSync(outputFile, JSON.stringify(errorData) + '\n');
            }
            
          } else if (content === 'STOP_SESSION') {
            console.log('🛑 Received stop signal - shutting down session');
            break;
          }
        }
        
        // Small delay to prevent busy waiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('❌ Error in message loop:', error);
        const errorData = {
          success: false,
          error: `Message loop error: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        
        try {
          fs.writeFileSync(outputFile, JSON.stringify(errorData) + '\n');
        } catch (writeError) {
          console.error('❌ Could not write error to output file:', writeError);
        }
        
        // Continue the loop unless it's a critical error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`🏁 Message loop ended for session ${sessionId} after ${messageCounter} messages`);
  });
  
  after(async function() {
    console.log(`🧹 Cleaning up session ${sessionId}`);
    if (session) {
      try {
        await clineController.closeSession(session);
        console.log('✅ Cline session closed successfully');
      } catch (error) {
        console.error('❌ Error closing Cline session:', error);
      }
    }
    
    // Write final cleanup signal
    try {
      const cleanupSignal = {
        success: true,
        message: 'Session cleanup complete',
        timestamp: new Date().toISOString()
      };
      fs.appendFileSync(outputFile, JSON.stringify(cleanupSignal) + '\n');
    } catch (error) {
      console.error('❌ Error writing cleanup signal:', error);
    }
    
    console.log(`🎯 Session ${sessionId} cleanup complete`);
  });
});
