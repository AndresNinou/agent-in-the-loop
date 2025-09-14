
const { VSBrowser } = require('vscode-extension-tester');
const { clineController } = require('./lib/ClineController');
const readline = require('readline');

let clineSession = null;
let isReady = false;

async function initializeSession() {
    try {
        console.log('INIT_START');
        
        // Initialize VS Code browser (like the interactive CLI)
        const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
        await VSBrowser.instance.openResources(customWorkspace);
        
        // Create persistent Cline session
        clineSession = await clineController.createSession();
        isReady = true;
        
        console.log('INIT_SUCCESS');
        console.log(JSON.stringify({
            sessionId: clineSession,
            status: 'ready'
        }));
        
        // Listen for messages on stdin
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.on('line', async (input) => {
            try {
                const messageData = JSON.parse(input);
                if (messageData.type === 'message') {
                    await handleMessage(messageData.content);
                }
            } catch (error) {
                console.log('ERROR');
                console.log(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });
        
        // Keep process alive
        process.stdin.resume();
        
    } catch (error) {
        console.log('INIT_ERROR');
        console.log(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    }
}

async function handleMessage(message) {
    try {
        if (!isReady || !clineSession) {
            throw new Error('Session not ready');
        }
        
        // Send message to Cline (like interactive CLI)
        const result = await clineController.sendMessage(clineSession, message);
        
        console.log('RESPONSE_START');
        console.log(JSON.stringify({
            success: true,
            response: result.messages.join('\n\n'),
            messageCount: result.messages.length,
            sessionId: clineSession
        }));
        console.log('RESPONSE_END');
        
    } catch (error) {
        console.log('RESPONSE_START');
        console.log(JSON.stringify({
            success: false,
            error: error.message
        }));
        console.log('RESPONSE_END');
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    if (clineSession) {
        await clineController.closeSession(clineSession);
    }
    process.exit(0);
});

// Start the session
initializeSession();
