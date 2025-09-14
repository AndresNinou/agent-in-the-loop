"""Pydantic models for Cline agent API endpoints."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID


class MessageRequest(BaseModel):
    """Request model for sending a message to Cline agent."""
    message: str = Field(..., min_length=1, max_length=10000, description="Message to send to the agent")
    workspace_path: Optional[str] = Field(None, description="Optional workspace path override")


class MessageResponse(BaseModel):
    """Response model for agent message."""
    session_id: str = Field(..., description="Session ID")
    message_id: str = Field(..., description="Unique message ID")
    response: str = Field(..., description="Agent response content")
    status: str = Field(..., description="Response status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class SessionCreateRequest(BaseModel):
    """Request model for creating a new session."""
    workspace_path: Optional[str] = Field(None, description="Workspace path for the session")


class SessionResponse(BaseModel):
    """Response model for session information."""
    session_id: str = Field(..., description="Unique session ID")
    workspace_path: str = Field(..., description="Workspace path")
    created_at: datetime = Field(..., description="Session creation timestamp")
    status: str = Field(..., description="Session status")
    message_count: int = Field(..., description="Number of messages in session")


class SessionListResponse(BaseModel):
    """Response model for listing sessions."""
    sessions: List[SessionResponse] = Field(..., description="List of active sessions")
    total_count: int = Field(..., description="Total number of sessions")


class SessionMessageModel(BaseModel):
    """Model for individual session message."""
    id: str = Field(..., description="Message ID")
    type: str = Field(..., description="Message type (user/agent)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional message metadata")


class SessionMessagesResponse(BaseModel):
    """Response model for session messages."""
    session_id: str = Field(..., description="Session ID")
    messages: List[SessionMessageModel] = Field(..., description="List of messages")
    total_count: int = Field(..., description="Total number of messages")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    session_id: Optional[str] = Field(None, description="Session ID if applicable")


class StatusResponse(BaseModel):
    """Status response model."""
    status: str = Field(..., description="Operation status")
    message: Optional[str] = Field(None, description="Status message")
    session_id: Optional[str] = Field(None, description="Session ID if applicable")
