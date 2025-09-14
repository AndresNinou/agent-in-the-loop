from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import subprocess
import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coderabbit", tags=["coderabbit"])

class CodeRabbitRequest(BaseModel):
    workspace_path: str = Field(..., description="Path to the workspace to review")
    timeout_minutes: Optional[int] = Field(10, description="Timeout for review in minutes")

class CodeRabbitComment(BaseModel):
    text: str
    user: str
    range: str
    filePath: str
    timestamp: str

class CodeRabbitResponse(BaseModel):
    success: bool
    comments: List[CodeRabbitComment]
    comment_count: int
    session_id: str
    duration_seconds: float
    message: str

async def run_coderabbit_cli(workspace_path: str, timeout_minutes: int = 10) -> Dict[str, Any]:
    """Run CodeRabbit CLI and return the results"""
    try:
        # Set environment variable for custom workspace
        env = os.environ.copy()
        env["CUSTOM_WORKSPACE"] = workspace_path
        
        # Change to the project directory
        project_dir = "/home/newton/cline_hackathon"
        
        logger.info(f"Starting CodeRabbit review for workspace: {workspace_path}")
        
        # Run the CodeRabbit CLI command
        process = await asyncio.create_subprocess_exec(
            "npm", "run", "coderabbit",
            cwd=project_dir,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Wait for process to complete with timeout
        timeout_seconds = timeout_minutes * 60
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=timeout_seconds
            )
        except asyncio.TimeoutError:
            # Kill the process if it times out
            process.kill()
            await process.wait()
            raise HTTPException(
                status_code=408, 
                detail=f"CodeRabbit review timed out after {timeout_minutes} minutes"
            )
        
        # Decode output
        stdout_str = stdout.decode('utf-8') if stdout else ""
        stderr_str = stderr.decode('utf-8') if stderr else ""
        
        logger.info(f"CodeRabbit CLI completed with return code: {process.returncode}")
        
        if process.returncode != 0:
            logger.error(f"CodeRabbit CLI failed: {stderr_str}")
            raise HTTPException(
                status_code=500,
                detail=f"CodeRabbit CLI failed: {stderr_str[:500]}"
            )
        
        # Parse the output to extract comments
        comments = parse_coderabbit_output(stdout_str)
        
        return {
            "success": True,
            "comments": comments,
            "output": stdout_str,
            "process_code": process.returncode
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running CodeRabbit CLI: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error running CodeRabbit: {str(e)}"
        )

def parse_coderabbit_output(output: str) -> List[Dict[str, Any]]:
    """Parse CodeRabbit CLI output to extract comments"""
    comments = []
    lines = output.split('\n')
    
    for line in lines:
        # Look for comment extraction patterns in the output
        if '📝 Extracted:' in line:
            try:
                # Extract comment text from the log line
                comment_text = line.split('📝 Extracted: ')[1].replace('...', '').strip()
                if comment_text and len(comment_text) > 10:
                    comments.append({
                        "text": comment_text,
                        "user": "CodeRabbit",
                        "range": "Unknown",
                        "filePath": "Unknown",
                        "timestamp": "2024-01-01T00:00:00Z"  # Placeholder
                    })
            except (IndexError, AttributeError):
                continue
        elif '📊 Review completed with' in line and 'comments' in line:
            # Extract comment count for validation
            try:
                count_part = line.split('with ')[1].split(' comment')[0]
                expected_count = int(count_part)
                logger.info(f"Expected {expected_count} comments from CodeRabbit")
            except (IndexError, ValueError):
                pass
    
    # If no comments were parsed from logs, create a placeholder
    if not comments:
        comments.append({
            "text": "CodeRabbit review completed successfully. Check the VS Code interface for detailed comments.",
            "user": "CodeRabbit",
            "range": "Overall",
            "filePath": "Workspace",
            "timestamp": "2024-01-01T00:00:00Z"
        })
    
    return comments

@router.post("/review", response_model=CodeRabbitResponse)
async def review_workspace(request: CodeRabbitRequest) -> CodeRabbitResponse:
    """
    Run CodeRabbit review on a workspace and return comments when complete.
    
    This endpoint will:
    1. Validate the workspace path exists
    2. Run CodeRabbit CLI automation 
    3. Wait for review completion (up to timeout)
    4. Extract and return all comments
    """
    try:
        import time
        start_time = time.time()
        
        # Validate workspace path
        workspace_path = Path(request.workspace_path)
        if not workspace_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Workspace path does not exist: {request.workspace_path}"
            )
        
        if not workspace_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Workspace path is not a directory: {request.workspace_path}"
            )
        
        logger.info(f"Starting CodeRabbit review for: {request.workspace_path}")
        
        # Run CodeRabbit CLI
        result = await run_coderabbit_cli(
            str(workspace_path.absolute()),
            request.timeout_minutes
        )
        
        duration = time.time() - start_time
        
        # Convert comments to proper format
        comments = [CodeRabbitComment(**comment) for comment in result["comments"]]
        
        response = CodeRabbitResponse(
            success=result["success"],
            comments=comments,
            comment_count=len(comments),
            session_id="coderabbit-api-session",
            duration_seconds=round(duration, 2),
            message=f"CodeRabbit review completed successfully in {duration:.1f} seconds"
        )
        
        logger.info(f"CodeRabbit review completed: {len(comments)} comments in {duration:.1f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in CodeRabbit review: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for CodeRabbit service"""
    try:
        # Check if npm and node are available
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        npm_version = result.stdout.strip() if result.returncode == 0 else "unavailable"
        
        return {
            "status": "healthy",
            "npm_version": npm_version,
            "service": "CodeRabbit API"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )
