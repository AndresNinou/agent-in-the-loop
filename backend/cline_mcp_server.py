#!/usr/bin/env python3
"""
Cline MCP Server

MCP server for creating and managing Cline AI agent instances.
Wraps the existing Cline service logic for session management and messaging.
"""

import asyncio
import sys
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastmcp import FastMCP

# Import existing Cline service logic
try:
    from app.services.simple_cline_service import simple_cline_service
    from app.models import SessionCreateRequest, MessageRequest
except ImportError as e:
    logging.error(f"Failed to import Cline services: {e}")
    print(f"Error importing Cline services: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP("Cline AI Agent MCP Server")

@mcp.tool
async def create_cline_session(workspace_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new Cline AI agent session.
    
    Creates a new VS Code session with the Cline extension, starts the persistence
    system, and prepares the agent for communication.
    
    Args:
        workspace_path: Optional path to workspace directory. If not provided, uses default.
    
    Returns:
        Dictionary containing session details including session_id, workspace_path, status, etc.
    """
    try:
        request = SessionCreateRequest(workspace_path=workspace_path) if workspace_path else None
        session = await simple_cline_service.create_session(workspace_path)
        
        return {
            "success": True,
            "session_id": session.session_id,
            "workspace_path": session.workspace_path,
            "created_at": session.created_at.isoformat() if hasattr(session.created_at, 'isoformat') else str(session.created_at),
            "status": session.status,
            "message_count": len(session.messages),
            "message": f"Cline session {session.session_id} created successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to create Cline session: {e}")
        return {
            "success": False,
            "session_id": None,
            "error": str(e),
            "message": f"Failed to create Cline session: {str(e)}"
        }

@mcp.tool
async def list_cline_sessions() -> Dict[str, Any]:
    """
    List all active Cline AI agent sessions.
    
    Returns a list of all currently active sessions with their basic information.
    
    Returns:
        Dictionary containing list of sessions and total count.
    """
    try:
        sessions = await simple_cline_service.list_sessions()
        
        session_list = [
            {
                "session_id": session.session_id,
                "workspace_path": session.workspace_path,
                "created_at": session.created_at.isoformat() if hasattr(session.created_at, 'isoformat') else str(session.created_at),
                "status": session.status,
                "message_count": len(session.messages)
            }
            for session in sessions
        ]
        
        return {
            "success": True,
            "sessions": session_list,
            "total_count": len(session_list),
            "message": f"Found {len(session_list)} active Cline sessions"
        }
        
    except Exception as e:
        logger.error(f"Failed to list Cline sessions: {e}")
        return {
            "success": False,
            "sessions": [],
            "total_count": 0,
            "error": str(e),
            "message": f"Failed to list sessions: {str(e)}"
        }

@mcp.tool
async def get_cline_session(session_id: str) -> Dict[str, Any]:
    """
    Get details of a specific Cline AI agent session.
    
    Returns detailed information about a session including its current status
    and message count.
    
    Args:
        session_id: The unique identifier for the session
    
    Returns:
        Dictionary containing session details or error information.
    """
    try:
        session = await simple_cline_service.get_session(session_id)
        
        if not session:
            return {
                "success": False,
                "session_id": session_id,
                "error": "Session not found",
                "message": f"Session {session_id} not found"
            }
        
        return {
            "success": True,
            "session_id": session.session_id,
            "workspace_path": session.workspace_path,
            "created_at": session.created_at.isoformat() if hasattr(session.created_at, 'isoformat') else str(session.created_at),
            "status": session.status,
            "message_count": len(session.messages),
            "message": f"Session {session_id} details retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get Cline session {session_id}: {e}")
        return {
            "success": False,
            "session_id": session_id,
            "error": str(e),
            "message": f"Failed to get session: {str(e)}"
        }

@mcp.tool
async def send_message_to_cline(session_id: str, message: str) -> Dict[str, Any]:
    """
    Send a message to a Cline AI agent session.
    
    Sends a message to the persistent Cline session and returns the agent's response.
    The session must be in 'ready' status to accept messages.
    
    Args:
        session_id: The unique identifier for the session
        message: The message to send to the Cline agent
    
    Returns:
        Dictionary containing the agent's response and metadata.
    """
    try:
        result = await simple_cline_service.send_message(session_id, message)
        
        return {
            "success": True,
            "session_id": result["session_id"],
            "message_id": result["message_id"],
            "response": result["response"],
            "status": result["status"],
            "message": "Message sent and response received successfully"
        }
        
    except ValueError as e:
        return {
            "success": False,
            "session_id": session_id,
            "error": "Session not found",
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Failed to send message to Cline session {session_id}: {e}")
        return {
            "success": False,
            "session_id": session_id,
            "error": str(e),
            "message": f"Failed to send message: {str(e)}"
        }

@mcp.tool
async def get_cline_session_messages(session_id: str, limit: int = 50) -> Dict[str, Any]:
    """
    Get conversation history from a Cline AI agent session.
    
    Returns the recent message history from the specified session,
    limited to the specified number of messages.
    
    Args:
        session_id: The unique identifier for the session
        limit: Maximum number of messages to return (default: 50)
    
    Returns:
        Dictionary containing message history and metadata.
    """
    try:
        messages = await simple_cline_service.get_session_messages(session_id, limit)
        
        message_list = [
            {
                "id": msg["id"],
                "type": msg["type"],
                "content": msg["content"],
                "timestamp": msg["timestamp"],
                "metadata": msg.get("metadata")
            }
            for msg in messages
        ]
        
        return {
            "success": True,
            "session_id": session_id,
            "messages": message_list,
            "total_count": len(message_list),
            "message": f"Retrieved {len(message_list)} messages for session {session_id}"
        }
        
    except ValueError as e:
        return {
            "success": False,
            "session_id": session_id,
            "messages": [],
            "total_count": 0,
            "error": "Session not found",
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Failed to get messages for Cline session {session_id}: {e}")
        return {
            "success": False,
            "session_id": session_id,
            "messages": [],
            "total_count": 0,
            "error": str(e),
            "message": f"Failed to get messages: {str(e)}"
        }

@mcp.tool
async def stop_cline_session(session_id: str) -> Dict[str, Any]:
    """
    Stop and clean up a Cline AI agent session.
    
    Stops the VS Code session, cleans up resources, and removes the session
    from the active sessions list.
    
    Args:
        session_id: The unique identifier for the session to stop
    
    Returns:
        Dictionary containing operation status and details.
    """
    try:
        success = await simple_cline_service.stop_session(session_id)
        
        if not success:
            return {
                "success": False,
                "session_id": session_id,
                "error": "Session not found or already stopped",
                "message": f"Session {session_id} not found or already stopped"
            }
        
        return {
            "success": True,
            "session_id": session_id,
            "status": "stopped",
            "message": f"Session {session_id} stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop Cline session {session_id}: {e}")
        return {
            "success": False,
            "session_id": session_id,
            "error": str(e),
            "message": f"Failed to stop session: {str(e)}"
        }

@mcp.tool
async def quick_message_to_cline(message: str, workspace_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Send a quick message to Cline without maintaining a persistent session.
    
    Uses the single-shot CLI mode without session persistence. 
    Useful for simple queries and testing.
    
    Args:
        message: The message to send to Cline
        workspace_path: Optional workspace path for the operation
    
    Returns:
        Dictionary containing Cline's response.
    """
    try:
        import subprocess
        
        # Prepare environment
        env = os.environ.copy()
        env["CLI_MESSAGE"] = message
        if workspace_path:
            env["CUSTOM_WORKSPACE"] = workspace_path
        
        # Use the existing CLI script
        cmd = ["npm", "run", "cli", message]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd="/home/newton/cline_hackathon",
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(), 
            timeout=300  # 5 minute timeout
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            return {
                "success": False,
                "message": message,
                "error": error_msg,
                "response": None,
                "method": "quick_cli"
            }
        
        output = stdout.decode()
        
        return {
            "success": True,
            "message": message,
            "response": output.strip(),
            "status": "completed",
            "method": "quick_cli"
        }
        
    except asyncio.TimeoutError:
        return {
            "success": False,
            "message": message,
            "error": "Request timed out after 5 minutes",
            "response": None,
            "method": "quick_cli"
        }
    except Exception as e:
        logger.error(f"Quick message to Cline failed: {e}")
        return {
            "success": False,
            "message": message,
            "error": str(e),
            "response": None,
            "method": "quick_cli"
        }

@mcp.tool
def cline_health_check() -> Dict[str, Any]:
    """
    Health check for the Cline AI agent service.
    
    Returns the current status of the service and number of active sessions.
    
    Returns:
        Dictionary containing service health status.
    """
    try:
        active_sessions = len(simple_cline_service.sessions)
        
        return {
            "status": "healthy",
            "active_sessions": active_sessions,
            "service": "Cline AI Agent MCP Server",
            "message": f"Service is healthy with {active_sessions} active sessions"
        }
        
    except Exception as e:
        logger.error(f"Cline health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "Cline AI Agent MCP Server",
            "message": f"Service is unhealthy: {str(e)}"
        }

if __name__ == "__main__":
    mcp.run()
