# 🤖 Cline Agent API Documentation

## Overview

This FastAPI backend provides REST endpoints to control and communicate with the Cline VS Code extension agent automation system. The API allows you to:

- Create and manage VS Code sessions with the Cline agent
- Send messages and receive responses from the AI agent
- Monitor conversation history and session status
- Control the automation lifecycle

## 🚀 Quick Start

### Start the FastAPI Server

```bash
cd backend
uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

### Test API Health

```bash
curl http://localhost:8000/api/v1/cline/health
```

## 📋 API Endpoints

### Session Management

#### `POST /api/v1/cline/sessions`
Create a new Cline agent session.

**Request:**
```json
{
  "workspace_path": "/path/to/workspace"  // optional
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "workspace_path": "/path/to/workspace",
  "created_at": "2024-01-01T12:00:00Z",
  "status": "ready",
  "message_count": 0
}
```

#### `GET /api/v1/cline/sessions`
List all active sessions.

**Response:**
```json
{
  "sessions": [...],
  "total_count": 3
}
```

#### `GET /api/v1/cline/sessions/{session_id}`
Get specific session details.

#### `DELETE /api/v1/cline/sessions/{session_id}`
Stop and clean up a session.

### Message Communication

#### `POST /api/v1/cline/sessions/{session_id}/messages`
Send a message to the Cline agent.

**Request:**
```json
{
  "message": "Create a Python script that calculates fibonacci numbers",
  "workspace_path": "/optional/workspace/override"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "message_id": "uuid-string", 
  "response": "I'll create a Python script for calculating Fibonacci numbers...",
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### `GET /api/v1/cline/sessions/{session_id}/messages`
Get conversation history.

**Query Parameters:**
- `limit`: Number of messages to return (default: 50)

#### `POST /api/v1/cline/sessions/{session_id}/quick-message`
Send a quick message using the simple CLI mode (for testing).

### Health Check

#### `GET /api/v1/cline/health`
Check service health and active sessions.

## 🔧 Usage Examples

### Python Client Example

```python
import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Create session
        session_resp = await client.post("http://localhost:8000/api/v1/cline/sessions")
        session_id = session_resp.json()["session_id"]
        
        # Send message
        message_resp = await client.post(
            f"http://localhost:8000/api/v1/cline/sessions/{session_id}/messages",
            json={"message": "Hello! How many files are in the current directory?"}
        )
        
        print("Agent Response:", message_resp.json()["response"])
        
        # Clean up
        await client.delete(f"http://localhost:8000/api/v1/cline/sessions/{session_id}")

asyncio.run(main())
```

### cURL Examples

```bash
# Create session
SESSION_ID=$(curl -s -X POST http://localhost:8000/api/v1/cline/sessions | jq -r '.session_id')

# Send message
curl -X POST http://localhost:8000/api/v1/cline/sessions/$SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "What files are in this directory?"}'

# Get conversation history
curl http://localhost:8000/api/v1/cline/sessions/$SESSION_ID/messages

# Stop session
curl -X DELETE http://localhost:8000/api/v1/cline/sessions/$SESSION_ID
```

### JavaScript/Fetch Example

```javascript
async function chatWithCline() {
    // Create session
    const sessionResp = await fetch('http://localhost:8000/api/v1/cline/sessions', {
        method: 'POST'
    });
    const session = await sessionResp.json();
    
    // Send message
    const messageResp = await fetch(`http://localhost:8000/api/v1/cline/sessions/${session.session_id}/messages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            message: 'Create a simple Python hello world script'
        })
    });
    
    const response = await messageResp.json();
    console.log('Agent says:', response.response);
    
    // Cleanup
    await fetch(`http://localhost:8000/api/v1/cline/sessions/${session.session_id}`, {
        method: 'DELETE'
    });
}
```

## 🏗️ How It Works

### Architecture Overview

```
FastAPI Backend ↔ ClineService ↔ Node.js CLI ↔ VS Code ↔ Cline Extension
```

1. **FastAPI Backend**: REST API endpoints for external communication
2. **ClineService**: Python service managing sessions and message routing
3. **Node.js CLI**: Existing automation system that controls VS Code
4. **VS Code**: Browser-based VS Code instance with Cline extension
5. **Cline Extension**: AI agent that processes requests and provides responses

### Session Lifecycle

1. **Create**: Start VS Code, initialize Cline extension, start persistence system
2. **Ready**: Agent is ready to receive messages
3. **Processing**: Agent is working on a request
4. **Error**: Something went wrong, session needs attention
5. **Stopped**: Session terminated and cleaned up

### Message Flow

1. Client sends message via POST request
2. FastAPI validates request and forwards to ClineService
3. ClineService creates temporary Node.js script
4. Node.js script uses existing CLI system to communicate with Cline
5. Cline processes message using its tools and context
6. Response flows back through the chain to the client

## 🔧 Configuration

### Environment Variables

Set these in your shell or `.env` file:

```bash
# VS Code workspace path (default)
export CUSTOM_WORKSPACE="/home/newton/coding_playground"

# Cline automation project root
export CLINE_PROJECT_ROOT="/home/newton/cline_hackathon"

# FastAPI settings
export ENVIRONMENT="local"
export LOG_LEVEL="INFO"
```

### Dependencies

The API requires:
- FastAPI backend running
- Node.js and npm installed
- VS Code automation system set up
- Cline extension installed and configured

## 🐛 Troubleshooting

### Common Issues

**"Session creation failed"**
- Check VS Code automation setup: `npm run setup:check`
- Verify persistence system: `npm run debug:state`
- Ensure Cline extension is installed

**"Message timeout"**
- Increase timeout in client requests (default: 5 minutes)
- Check VS Code processes: `ps aux | grep chrome`
- Verify agent isn't stuck processing

**"CLI command failed"**
- Check Node.js dependencies: `npm install`
- Verify project paths in environment variables
- Check logs for detailed error messages

### Debug Commands

```bash
# Check service health
curl http://localhost:8000/api/v1/cline/health

# Check VS Code setup
npm run setup:check

# Debug persistence state
npm run debug:state

# Test CLI directly
npm run cli "test message"
```

## 🚦 Testing

### Run API Examples

```bash
cd backend
python examples/api_usage.py
```

### Manual Testing

1. Start FastAPI server
2. Create a session via API
3. Send test messages
4. Verify responses
5. Clean up session

### Integration Test

```bash
# Test the full pipeline
curl -X POST http://localhost:8000/api/v1/cline/sessions/temp/quick-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what files exist in the current directory?"}'
```
