"""Cline agent API routes for VS Code automation control."""

from typing import List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.core.log_config import logger
from app.services.simple_cline_service import simple_cline_service
from app.models import SessionCreateRequest, SessionResponse, MessageRequest, MessageResponse, SessionListResponse, SessionMessagesResponse, ErrorResponse, StatusResponse, SessionMessageModel

router = APIRouter(prefix="/cline", tags=["cline"])


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: SessionCreateRequest = None):
    """Create a new Cline agent session.
    
    Creates a new VS Code session with the Cline extension, starts the persistence
    system, and prepares the agent for communication.
    """
    try:
        workspace_path = request.workspace_path if request else None
        session = await simple_cline_service.create_session(workspace_path)
        
        return SessionResponse(
            session_id=session.session_id,
            workspace_path=session.workspace_path,
            created_at=session.created_at,
            status=session.status,
            message_count=len(session.messages)
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions():
    """List all active Cline agent sessions.
    
    Returns a list of all currently active sessions with their basic information.
    """
    try:
        sessions = await simple_cline_service.list_sessions()
        
        session_responses = [
            SessionResponse(
                session_id=session.session_id,
                workspace_path=session.workspace_path,
                created_at=session.created_at,
                status=session.status,
                message_count=len(session.messages)
            )
            for session in sessions
        ]
        
        return SessionListResponse(
            sessions=session_responses,
            total_count=len(session_responses)
        )
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get details of a specific Cline agent session.
    
    Returns detailed information about a session including its current status
    and message count.
    """
    try:
        session = await simple_cline_service.get_session(session_id)
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found"
            )
        
        return SessionResponse(
            session_id=session.session_id,
            workspace_path=session.workspace_path,
            created_at=session.created_at,
            status=session.status,
            message_count=len(session.messages)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session: {str(e)}"
        )


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(session_id: str, request: MessageRequest):
    """Send a message to a Cline agent session.
    
    Sends a message to the persistent Cline session and returns the agent's response.
    The session must be in 'ready' status to accept messages.
    """
    try:
        result = await simple_cline_service.send_message(session_id, request.message)
        
        return MessageResponse(
            session_id=result["session_id"],
            message_id=result["message_id"],
            response=result["response"],
            status=result["status"]
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to send message to session {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(session_id: str, limit: int = 50):
    """Get conversation history from a Cline agent session.
    
    Returns the recent message history from the specified session,
    limited to the specified number of messages (default 50).
    """
    try:
        messages = await simple_cline_service.get_session_messages(session_id, limit)
        
        message_models = [
            SessionMessageModel(
                id=msg["id"],
                type=msg["type"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                metadata=msg.get("metadata")
            )
            for msg in messages
        ]
        
        return SessionMessagesResponse(
            session_id=session_id,
            messages=message_models,
            total_count=len(message_models)
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get messages for session {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get messages: {str(e)}"
        )


@router.delete("/sessions/{session_id}", response_model=StatusResponse)
async def stop_session(session_id: str):
    """Stop and clean up a Cline agent session.
    
    Stops the VS Code session, cleans up resources, and removes the session
    from the active sessions list.
    """
    try:
        success = await simple_cline_service.stop_session(session_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found or already stopped"
            )
        
        return StatusResponse(
            status="success",
            message=f"Session {session_id} stopped successfully",
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stop session {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stop session: {str(e)}"
        )


@router.post("/sessions/{session_id}/quick-message", response_model=dict)
async def send_quick_message(session_id: str, request: MessageRequest):
    """Send a quick message without persistence (for testing).
    
    Sends a message using the single-shot CLI mode without maintaining
    a persistent session. Useful for simple queries and testing.
    """
    try:
        # This uses the simpler CLI approach without session persistence
        import asyncio
        import subprocess
        import os
        import json
        
        # Prepare environment
        env = os.environ.copy()
        env["CLI_MESSAGE"] = request.message
        if request.workspace_path:
            env["CUSTOM_WORKSPACE"] = request.workspace_path
        
        # Use the existing CLI script
        cmd = ["npm", "run", "cli", request.message]
        
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
            raise HTTPException(
                status_code=500,
                detail=f"CLI command failed: {error_msg}"
            )
        
        output = stdout.decode()
        
        return {
            "session_id": session_id,
            "message": request.message,
            "response": output.strip(),
            "status": "success",
            "method": "quick_cli"
        }
        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408,
            detail="Request timed out"
        )
    except Exception as e:
        logger.error(f"Quick message failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Quick message failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the Cline automation service.
    
    Returns the current status of the service and number of active sessions.
    """
    try:
        active_sessions = len(simple_cline_service.sessions)
        
        return {
            "status": "healthy",
            "active_sessions": active_sessions,
            "service": "cline_automation"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "service": "cline_automation"
            }
        )
