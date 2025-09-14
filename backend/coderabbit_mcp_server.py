#!/usr/bin/env python3
"""
CodeRabbit MCP Server

MCP server for running CodeRabbit code reviews on workspaces.
Takes a workspace path and returns all comments when the review is complete.
"""

import asyncio
import os
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Any
import logging

from fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP("CodeRabbit MCP Server")

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
            raise Exception(f"CodeRabbit review timed out after {timeout_minutes} minutes")
        
        # Decode output
        stdout_str = stdout.decode('utf-8') if stdout else ""
        stderr_str = stderr.decode('utf-8') if stderr else ""
        
        logger.info(f"CodeRabbit CLI completed with return code: {process.returncode}")
        
        if process.returncode != 0:
            logger.error(f"CodeRabbit CLI failed: {stderr_str}")
            raise Exception(f"CodeRabbit CLI failed: {stderr_str[:500]}")
        
        # Parse the output to extract comments
        comments = parse_coderabbit_output(stdout_str)
        
        return {
            "success": True,
            "comments": comments,
            "output": stdout_str,
            "process_code": process.returncode
        }
        
    except Exception as e:
        logger.error(f"Error running CodeRabbit CLI: {str(e)}")
        raise Exception(f"Internal error running CodeRabbit: {str(e)}")

def parse_coderabbit_output(output: str) -> List[Dict[str, Any]]:
    """Parse CodeRabbit CLI output to extract comments"""
    comments = []
    lines = output.split('\n')
    
    current_timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
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
                        "timestamp": current_timestamp
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
    
    # If no comments were parsed from logs, create a success message
    if not comments:
        comments.append({
            "text": "CodeRabbit review completed successfully. Check the output logs for detailed analysis.",
            "user": "CodeRabbit",
            "range": "Overall",
            "filePath": "Workspace",
            "timestamp": current_timestamp
        })
    
    return comments

@mcp.tool
async def review_workspace(workspace_path: str, timeout_minutes: int = 10) -> Dict[str, Any]:
    """
    Run CodeRabbit review on a workspace and return comments when complete.
    
    Args:
        workspace_path: Path to the workspace directory to review
        timeout_minutes: Timeout for review completion in minutes (default: 10)
    
    Returns:
        Dictionary containing success status, comments list, and metadata
    """
    try:
        start_time = time.time()
        
        # Validate workspace path
        workspace_path_obj = Path(workspace_path)
        if not workspace_path_obj.exists():
            raise Exception(f"Workspace path does not exist: {workspace_path}")
        
        if not workspace_path_obj.is_dir():
            raise Exception(f"Workspace path is not a directory: {workspace_path}")
        
        logger.info(f"Starting CodeRabbit review for: {workspace_path}")
        
        # Run CodeRabbit CLI
        result = await run_coderabbit_cli(
            str(workspace_path_obj.absolute()),
            timeout_minutes
        )
        
        duration = time.time() - start_time
        
        response = {
            "success": result["success"],
            "comments": result["comments"],
            "comment_count": len(result["comments"]),
            "session_id": "coderabbit-mcp-session",
            "duration_seconds": round(duration, 2),
            "message": f"CodeRabbit review completed successfully in {duration:.1f} seconds"
        }
        
        logger.info(f"CodeRabbit review completed: {len(result['comments'])} comments in {duration:.1f}s")
        return response
        
    except Exception as e:
        logger.error(f"Error in CodeRabbit review: {str(e)}")
        return {
            "success": False,
            "comments": [],
            "comment_count": 0,
            "session_id": "coderabbit-mcp-session",
            "duration_seconds": 0,
            "message": f"CodeRabbit review failed: {str(e)}"
        }

@mcp.tool
def health_check() -> Dict[str, str]:
    """Health check for CodeRabbit MCP server"""
    try:
        # Check if npm and node are available
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        npm_version = result.stdout.strip() if result.returncode == 0 else "unavailable"
        
        return {
            "status": "healthy",
            "npm_version": npm_version,
            "service": "CodeRabbit MCP Server"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "CodeRabbit MCP Server"
        }

if __name__ == "__main__":
    mcp.run()
