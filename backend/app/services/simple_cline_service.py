"""Simple Cline service that directly uses existing CLI infrastructure for persistent sessions."""

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime
import os
import tempfile
import time

from app.core.log_config import logger


class PersistentClineSession:
    """A persistent Cline session that keeps VS Code alive like the interactive CLI."""
    
    def __init__(self, session_id: str, workspace_path: str = None):
        self.session_id = session_id
        self.workspace_path = workspace_path or "/home/newton/swe_bench_reproducer"
        self.created_at = datetime.utcnow()
        self.messages: List[Dict[str, Any]] = []
        self.status = "initializing"
        self.cli_process: Optional[subprocess.Popen] = None
        self.input_file: Optional[str] = None
        self.output_file: Optional[str] = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "workspace_path": self.workspace_path,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "message_count": len(self.messages)
        }


class SimpleClineService:
    """Simple service using existing CLI infrastructure for persistent sessions."""
    
    def __init__(self):
        self.sessions: Dict[str, PersistentClineSession] = {}
        self.project_root = Path("/home/newton/cline_hackathon")
        
    async def create_session(self, workspace_path: str = None) -> PersistentClineSession:
        """Create a persistent session using the actual CLI interactive structure."""
        session_id = str(uuid.uuid4())
        session = PersistentClineSession(session_id, workspace_path)
        
        try:
            logger.info(f"🚀 Creating persistent session {session_id}")
            logger.info(f"📁 Workspace: {session.workspace_path}")
            
            # Create communication files
            temp_dir = tempfile.mkdtemp(prefix=f"cline_session_{session_id}_")
            session.input_file = os.path.join(temp_dir, "input.txt")
            session.output_file = os.path.join(temp_dir, "output.txt")
            logger.info(f"📂 Session files: {temp_dir}")
            
            # Create initial empty files
            open(session.input_file, 'w').close()
            open(session.output_file, 'w').close()
            
            # Use the actual working CLI interactive approach directly
            env = os.environ.copy()
            env["CUSTOM_WORKSPACE"] = session.workspace_path
            env["CLI_MESSAGE"] = "Starting persistent session..."
            env["INTERACTIVE_MODE"] = "true"
            env["SESSION_ID"] = session_id
            env["SESSION_INPUT_FILE"] = session.input_file
            env["SESSION_OUTPUT_FILE"] = session.output_file
            
            logger.info(f"🔧 Environment configured for session {session_id}")
            
            # Use the working cli-with-persistence.sh approach
            cli_script_path = self.project_root / "cli-with-persistence.sh" 
            
            logger.info(f"🎬 Starting CLI process: {cli_script_path}")
            
            # Start the persistent CLI process using the proven working script
            process = await asyncio.create_subprocess_exec(
                "bash", str(cli_script_path),
                cwd=str(self.project_root),
                env=env,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            session.cli_process = process
            logger.info(f"⚡ CLI process started with PID: {process.pid}")
            
            # Wait for session to be ready with detailed logging
            await self._wait_for_session_ready_with_logs(session)
            
            session.status = "ready"
            self.sessions[session_id] = session
            
            logger.info(f"✅ Persistent session {session_id} is ready and operational")
            return session
            
        except Exception as e:
            logger.error(f"❌ Failed to create session {session_id}: {e}")
            logger.exception("Full exception details:")
            session.status = "error"
            raise
    
    def _create_persistent_cli_script(self, session: PersistentClineSession) -> Path:
        """Create a bash script that runs persistent interactive CLI."""
        script_content = f'''#!/bin/bash

# Persistent Cline CLI Session
echo "Starting persistent Cline session {session.session_id}..."

# Set environment
export CUSTOM_WORKSPACE="{session.workspace_path}"
export SESSION_INPUT_FILE="{session.input_file}"
export SESSION_OUTPUT_FILE="{session.output_file}"

# Start persistence system
./lib/improvedPersistence.sh &
PERSISTENCE_PID=$!

# Wait for persistence to start
sleep 5

# Signal that we're ready
echo "READY" > "$SESSION_OUTPUT_FILE"

# Create a modified interactive test that reads from input file
cat > temp_persistent_test_{session.session_id}.js << 'EOF'
const {{ VSBrowser }} = require('vscode-extension-tester');
const {{ clineController }} = require('./lib/ClineController');
const fs = require('fs');
const path = require('path');

describe('Persistent Cline Session', function () {{
  this.timeout(60 * 60 * 1000); // 1 hour timeout
  
  let session;
  const inputFile = process.env.SESSION_INPUT_FILE;
  const outputFile = process.env.SESSION_OUTPUT_FILE;
  
  before(async function() {{
    console.log('Initializing persistent Cline session...');
    
    const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/swe_bench_reproducer';
    console.log(`Opening workspace: ${{customWorkspace}}`);
    
    await VSBrowser.instance.openResources(customWorkspace);
    
    // Create persistent Cline session
    session = await clineController.createSession();
    console.log(`Persistent session created: ${{session}}`);
    
    // Write ready signal
    fs.writeFileSync(outputFile, 'SESSION_READY\\n');
  }});
  
  it('should handle persistent messages', async function() {{
    let messageCounter = 0;
    
    while (true) {{
      try {{
        // Check for new message in input file
        if (fs.existsSync(inputFile)) {{
          const content = fs.readFileSync(inputFile, 'utf8').trim();
          
          if (content && content !== 'STOP_SESSION') {{
            messageCounter++;
            console.log(`Processing message ${{messageCounter}}: ${{content.substring(0, 50)}}...`);
            
            // Clear input file
            fs.writeFileSync(inputFile, '');
            
            // Send message to Cline
            const result = await clineController.sendMessage(session, content);
            
            // Write response to output file
            const responseData = {{
              success: true,
              messageId: messageCounter,
              response: result.messages.join('\\n\\n'),
              timestamp: new Date().toISOString()
            }};
            
            fs.writeFileSync(outputFile, JSON.stringify(responseData) + '\\n');
            
          }} else if (content === 'STOP_SESSION') {{
            console.log('Stopping session...');
            break;
          }}
        }}
        
        // Small delay to prevent busy waiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      }} catch (error) {{
        console.error('Error processing message:', error);
        const errorData = {{
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }};
        fs.writeFileSync(outputFile, JSON.stringify(errorData) + '\\n');
      }}
    }}
  }});
  
  after(async function() {{
    if (session) {{
      await clineController.closeSession(session);
    }}
  }});
}});
EOF

# Run the persistent test
npx extest run-tests "temp_persistent_test_{session.session_id}.js" --storage ./vscode-test-persistent -o ./.vscode/settings.test.json

# Cleanup
rm -f "temp_persistent_test_{session.session_id}.js"
kill $PERSISTENCE_PID 2>/dev/null || true
'''
        
        script_path = self.project_root / f"persistent_session_{session.session_id}.sh"
        script_path.write_text(script_content)
        script_path.chmod(0o755)
        return script_path
    
    async def _wait_for_session_ready_with_logs(self, session: PersistentClineSession):
        """Wait for the persistent session to be ready with detailed logging."""
        max_wait = 300  # 5 minutes
        start_time = time.time()
        check_interval = 10  # Log progress every 10 seconds
        last_log_time = start_time
        
        logger.info(f"🕐 Waiting for session {session.session_id} to become ready (max {max_wait}s)")
        logger.info(f"👀 Monitoring output file: {session.output_file}")
        
        while time.time() - start_time < max_wait:
            elapsed = time.time() - start_time
            
            # Log progress periodically
            if time.time() - last_log_time >= check_interval:
                logger.info(f"⏱️  Session {session.session_id} - {elapsed:.1f}s elapsed, still waiting...")
                
                # Check if CLI process is still running
                if session.cli_process:
                    if session.cli_process.returncode is not None:
                        logger.error(f"💀 CLI process exited with code: {session.cli_process.returncode}")
                        stdout, stderr = await session.cli_process.communicate()
                        logger.error(f"📤 Process stdout: {stdout.decode()}")
                        logger.error(f"📥 Process stderr: {stderr.decode()}")
                        break
                    else:
                        logger.info(f"✅ CLI process PID {session.cli_process.pid} is still running")
                
                # Check what's in the output file
                if os.path.exists(session.output_file):
                    try:
                        with open(session.output_file, 'r') as f:
                            content = f.read().strip()
                            if content:
                                logger.info(f"📄 Output file content so far: {content[:200]}...")
                            else:
                                logger.info("📄 Output file exists but is empty")
                    except Exception as e:
                        logger.warning(f"📄 Could not read output file: {e}")
                else:
                    logger.info("📄 Output file does not exist yet")
                    
                last_log_time = time.time()
            
            # Check for ready signal
            if os.path.exists(session.output_file):
                try:
                    with open(session.output_file, 'r') as f:
                        content = f.read().strip()
                        if "SESSION_READY" in content or "READY" in content:
                            logger.info(f"🎉 Session {session.session_id} is ready! (took {elapsed:.1f}s)")
                            return
                except Exception as e:
                    logger.warning(f"❓ Error reading output file: {e}")
            
            await asyncio.sleep(2)
        
        logger.error(f"⏰ Session {session.session_id} timed out after {max_wait} seconds")
        raise TimeoutError(f"Session {session.session_id} failed to become ready within {max_wait} seconds")
    
    async def send_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Send a message to the persistent session."""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        if session.status != "ready":
            raise ValueError(f"Session {session_id} is not ready (status: {session.status})")
        
        try:
            session.status = "processing"
            
            # Add user message to session history
            user_message = {
                "id": str(uuid.uuid4()),
                "type": "user", 
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            session.messages.append(user_message)
            
            logger.info(f"Sending message to persistent session {session_id}: {message[:100]}...")
            
            # Write message to input file
            with open(session.input_file, 'w') as f:
                f.write(message)
            
            # Wait for response in output file
            response = await self._wait_for_response(session)
            
            # Add agent response to session history
            agent_message = {
                "id": str(uuid.uuid4()),
                "type": "agent",
                "content": response.get("response", ""),
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": {"message_id": response.get("messageId")}
            }
            session.messages.append(agent_message)
            
            session.status = "ready"
            
            return {
                "session_id": session_id,
                "message_id": agent_message["id"],
                "response": agent_message["content"],
                "status": "success"
            }
            
        except Exception as e:
            session.status = "error"
            logger.error(f"Error sending message to session {session_id}: {e}")
            raise
    
    async def _wait_for_response(self, session: PersistentClineSession) -> Dict[str, Any]:
        """Wait for response from persistent session."""
        max_wait = 300  # 5 minutes
        start_time = time.time()
        last_response_id = getattr(session, '_last_response_id', 0)
        
        while time.time() - start_time < max_wait:
            try:
                if os.path.exists(session.output_file):
                    with open(session.output_file, 'r') as f:
                        content = f.read().strip()
                    
                    if content:
                        # Look for JSON response (not just "SESSION_READY")
                        lines = content.split('\n')
                        for line in reversed(lines):
                            line = line.strip()
                            if line and line != "SESSION_READY" and line.startswith('{'):
                                try:
                                    response_data = json.loads(line)
                                    if "response" in response_data or "error" in response_data:
                                        # Check if this is a new response
                                        response_id = response_data.get("messageId", 0)
                                        if response_id > last_response_id:
                                            # Store the latest response ID to avoid returning old responses
                                            session._last_response_id = response_id
                                            return response_data
                                except json.JSONDecodeError:
                                    continue
                
            except Exception as e:
                logger.warning(f"Error reading response file: {e}")
            
            await asyncio.sleep(2)
        
        raise TimeoutError(f"No response received within {max_wait} seconds")
    
    async def get_session(self, session_id: str) -> Optional[PersistentClineSession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    async def list_sessions(self) -> List[PersistentClineSession]:
        """List all active sessions."""
        return list(self.sessions.values())
    
    async def stop_session(self, session_id: str) -> bool:
        """Stop and clean up a persistent session."""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        
        try:
            # Signal session to stop
            if session.input_file and os.path.exists(session.input_file):
                with open(session.input_file, 'w') as f:
                    f.write("STOP_SESSION")
            
            # Terminate the CLI process
            if session.cli_process:
                session.cli_process.terminate()
                await asyncio.sleep(3)
                if session.cli_process.poll() is None:
                    session.cli_process.kill()
            
            # Cleanup files
            if session.input_file and os.path.exists(session.input_file):
                os.unlink(session.input_file)
            if session.output_file and os.path.exists(session.output_file):
                os.unlink(session.output_file)
            
            # Cleanup script
            script_path = self.project_root / f"persistent_session_{session.session_id}.sh"
            if script_path.exists():
                script_path.unlink()
            
            session.status = "stopped"
            del self.sessions[session_id]
            
            logger.info(f"Persistent session {session_id} stopped")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping session {session_id}: {e}")
            return False
    
    async def get_session_messages(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages from a session."""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        return session.messages[-limit:] if limit else session.messages


# Global service instance
simple_cline_service = SimpleClineService()
