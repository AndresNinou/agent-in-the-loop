"""Cline agent service for managing VS Code automation sessions."""

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime
import os
import signal
import tempfile

from app.core.log_config import logger


class ClineSession:
    """Represents a persistent Cline agent session."""
    
    def __init__(self, session_id: str, workspace_path: str = None):
        self.session_id = session_id
        self.workspace_path = workspace_path or "/home/newton/coding_playground"
        self.created_at = datetime.utcnow()
        self.messages: List[Dict[str, Any]] = []
        self.status = "initializing"  # initializing, ready, processing, error, stopped
        self.interactive_process: Optional[subprocess.Popen] = None
        self.message_pipe: Optional[str] = None  # Path to named pipe for communication
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "workspace_path": self.workspace_path,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "message_count": len(self.messages),
            "messages": self.messages[-10:]  # Last 10 messages only
        }


class ClineService:
    """Service for managing Cline agent sessions and communication."""
    
    def __init__(self):
        self.sessions: Dict[str, ClineSession] = {}
        self.project_root = Path("/home/newton/cline_hackathon")
        
    async def create_session(self, workspace_path: str = None) -> ClineSession:
        """Create a new persistent Cline session using existing CLI infrastructure."""
        session_id = str(uuid.uuid4())
        session = ClineSession(session_id, workspace_path)
        
        try:
            logger.info(f"Creating persistent Cline session {session_id}")
            
            # Start the interactive CLI process (reuse existing infrastructure)
            await self._start_cli_interactive_process(session)
            
            session.status = "ready"
            self.sessions[session_id] = session
            
            logger.info(f"Persistent Cline session {session_id} created and ready")
            return session
            
        except Exception as e:
            logger.error(f"Failed to create session {session_id}: {e}")
            session.status = "error"
            raise
    
    async def _start_interactive_session(self, session: ClineSession):
        """Start a persistent interactive Cline session using ExTest framework."""
        try:
            # Create a test file for this persistent session
            session_test = self._create_persistent_session_test(session)
            
            # Start persistence system first
            await self._start_persistence_system(session)
            
            env = os.environ.copy()
            env["CUSTOM_WORKSPACE"] = session.workspace_path
            env["SESSION_MODE"] = "persistent"
            env["SESSION_ID"] = session.session_id
            
            # Use ExTest framework like the CLI does
            process = await asyncio.create_subprocess_exec(
                "npx", "extest", "run-tests", str(session_test),
                "--storage", "./vscode-test-persistent",
                "-o", "./.vscode/settings.test.json",
                cwd=str(self.project_root),
                env=env,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            session.vscode_process = process
            
            # Wait for session to be ready
            await self._wait_for_session_ready(session)
            
            logger.info(f"Persistent session {session.session_id} is ready (PID: {process.pid})")
            
        except Exception as e:
            logger.error(f"Failed to start persistent session {session.session_id}: {e}")
            raise
    
    async def send_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Send a message to persistent Cline session (like interactive CLI)."""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
            
        session = self.sessions[session_id]
        
        if session.status != "ready":
            raise ValueError(f"Session {session_id} is not ready (status: {session.status})")
            
        try:
            session.status = "processing"
            
            # Add user message to session
            user_message = {
                "id": str(uuid.uuid4()),
                "type": "user",
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            session.messages.append(user_message)
            
            logger.info(f"Sending message to persistent session {session_id}: {message[:100]}...")
            
            # Send message to the persistent Node.js process
            response = await self._send_to_interactive_session(session, message)
            
            # Add agent response to session
            agent_message = {
                "id": str(uuid.uuid4()),
                "type": "agent",
                "content": response.get("response", ""),
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": response.get("metadata", {})
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
    
    async def _execute_cli_command(self, session: ClineSession, message: str) -> Dict[str, Any]:
        """Execute CLI command using the existing npm CLI system."""
        try:
            # Prepare environment
            env = os.environ.copy()
            env["CLI_MESSAGE"] = message
            env["CUSTOM_WORKSPACE"] = session.workspace_path
            
            # Use the existing npm CLI system
            cmd = [
                "npm", "run", "cli", message
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(self.project_root),
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), 
                    timeout=300  # 5 minute timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                raise TimeoutError("Cline agent response timed out")
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"CLI command failed: {error_msg}")
                raise RuntimeError(f"CLI command failed: {error_msg}")
            
            # Parse response from CLI output
            output = stdout.decode()
            response = self._parse_cli_output(output)
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to execute CLI command: {e}")
            raise
    
    async def _send_to_interactive_session(self, session: ClineSession, message: str) -> Dict[str, Any]:
        """Send message to persistent interactive session."""
        try:
            if not session.vscode_process or session.vscode_process.returncode is not None:
                raise RuntimeError("Interactive session process is not running")
            
            # Send message through stdin
            message_data = {
                "type": "message",
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            message_json = json.dumps(message_data) + "\n"
            session.vscode_process.stdin.write(message_json.encode())
            await session.vscode_process.stdin.drain()
            
            # Wait for response
            response = await self._read_session_response(session)
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to send message to interactive session: {e}")
            raise
    
    def _create_interactive_session_script(self, session: ClineSession) -> Path:
        """Create Node.js script for persistent interactive session."""
        script_content = f"""
const {{ VSBrowser }} = require('vscode-extension-tester');
const {{ clineController }} = require('./lib/ClineController');
const readline = require('readline');

let clineSession = null;
let isReady = false;

async function initializeSession() {{
    try {{
        console.log('INIT_START');
        
        // Initialize VS Code browser (like the interactive CLI)
        const customWorkspace = process.env.CUSTOM_WORKSPACE || '/home/newton/coding_playground';
        await VSBrowser.instance.openResources(customWorkspace);
        
        // Create persistent Cline session
        clineSession = await clineController.createSession();
        isReady = true;
        
        console.log('INIT_SUCCESS');
        console.log(JSON.stringify({{
            sessionId: clineSession,
            status: 'ready'
        }}));
        
        // Listen for messages on stdin
        const rl = readline.createInterface({{
            input: process.stdin,
            output: process.stdout
        }});
        
        rl.on('line', async (input) => {{
            try {{
                const messageData = JSON.parse(input);
                if (messageData.type === 'message') {{
                    await handleMessage(messageData.content);
                }}
            }} catch (error) {{
                console.log('ERROR');
                console.log(JSON.stringify({{
                    success: false,
                    error: error.message
                }}));
            }}
        }});
        
        // Keep process alive
        process.stdin.resume();
        
    }} catch (error) {{
        console.log('INIT_ERROR');
        console.log(JSON.stringify({{
            success: false,
            error: error.message
        }}));
        process.exit(1);
    }}
}}

async function handleMessage(message) {{
    try {{
        if (!isReady || !clineSession) {{
            throw new Error('Session not ready');
        }}
        
        // Send message to Cline (like interactive CLI)
        const result = await clineController.sendMessage(clineSession, message);
        
        console.log('RESPONSE_START');
        console.log(JSON.stringify({{
            success: true,
            response: result.messages.join('\\n\\n'),
            messageCount: result.messages.length,
            sessionId: clineSession
        }}));
        console.log('RESPONSE_END');
        
    }} catch (error) {{
        console.log('RESPONSE_START');
        console.log(JSON.stringify({{
            success: false,
            error: error.message
        }}));
        console.log('RESPONSE_END');
    }}
}}

// Handle graceful shutdown
process.on('SIGTERM', async () => {{
    if (clineSession) {{
        await clineController.closeSession(clineSession);
    }}
    process.exit(0);
}});

// Start the session
initializeSession();
"""
        
        script_path = self.project_root / f"interactive_session_{session.session_id}.js"
        script_path.write_text(script_content)
        return script_path
    
    async def _wait_for_session_ready(self, session: ClineSession):
        """Wait for interactive session to be ready."""
        try:
            # Read initialization messages
            while True:
                line = await session.vscode_process.stdout.readline()
                if not line:
                    raise RuntimeError("Session process ended unexpectedly")
                
                line_str = line.decode().strip()
                
                if line_str == 'INIT_SUCCESS':
                    # Read the success data
                    data_line = await session.vscode_process.stdout.readline()
                    data = json.loads(data_line.decode().strip())
                    session.cline_session_id = data.get('sessionId')
                    logger.info(f"Session {session.session_id} initialized with Cline session {session.cline_session_id}")
                    break
                elif line_str == 'INIT_ERROR':
                    # Read the error data
                    error_line = await session.vscode_process.stdout.readline()
                    error_data = json.loads(error_line.decode().strip())
                    raise RuntimeError(f"Session initialization failed: {error_data.get('error')}")
                
        except Exception as e:
            logger.error(f"Failed to wait for session ready: {e}")
            raise
    
    async def _read_session_response(self, session: ClineSession) -> Dict[str, Any]:
        """Read response from interactive session."""
        try:
            # Wait for response markers
            while True:
                line = await session.vscode_process.stdout.readline()
                if not line:
                    raise RuntimeError("Session process ended unexpectedly")
                
                line_str = line.decode().strip()
                
                if line_str == 'RESPONSE_START':
                    # Read the response data
                    data_line = await session.vscode_process.stdout.readline()
                    response_data = json.loads(data_line.decode().strip())
                    
                    # Wait for end marker
                    end_line = await session.vscode_process.stdout.readline()
                    if end_line.decode().strip() != 'RESPONSE_END':
                        logger.warning("Missing RESPONSE_END marker")
                    
                    if not response_data.get("success"):
                        raise RuntimeError(response_data.get("error", "Unknown error"))
                    
                    return {
                        "response": response_data.get("response", ""),
                        "metadata": {
                            "message_count": response_data.get("messageCount", 0),
                            "session_id": response_data.get("sessionId")
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Failed to read session response: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[ClineSession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    async def list_sessions(self) -> List[ClineSession]:
        """List all active sessions."""
        return list(self.sessions.values())
    
    async def stop_session(self, session_id: str) -> bool:
        """Stop and clean up a persistent session."""
        if session_id not in self.sessions:
            return False
            
        session = self.sessions[session_id]
        
        try:
            # Stop the interactive VS Code process
            if session.vscode_process:
                session.vscode_process.terminate()
                await asyncio.sleep(2)
                if session.vscode_process.returncode is None:
                    session.vscode_process.kill()
            
            # Clean up session script
            script_path = self.project_root / f"interactive_session_{session.session_id}.js"
            if script_path.exists():
                script_path.unlink()
            
            session.status = "stopped"
            del self.sessions[session_id]
            
            logger.info(f"Persistent session {session_id} stopped and cleaned up")
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
cline_service = ClineService()
