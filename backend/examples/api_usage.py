"""Example usage of the Cline agent API."""

import asyncio
import httpx
import json
from typing import Dict, Any


class ClineAPIClient:
    """Client for interacting with the Cline agent API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1/cline"
    
    async def create_session(self, workspace_path: str = None) -> Dict[str, Any]:
        """Create a new Cline agent session."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {}
            if workspace_path:
                payload["workspace_path"] = workspace_path
            
            response = await client.post(f"{self.api_base}/sessions", json=payload)
            response.raise_for_status()
            return response.json()
    
    async def send_message(self, session_id: str, message: str, workspace_path: str = None) -> Dict[str, Any]:
        """Send a message to the Cline agent."""
        async with httpx.AsyncClient(timeout=600.0) as client:  # 10 minute timeout
            payload = {"message": message}
            if workspace_path:
                payload["workspace_path"] = workspace_path
            
            response = await client.post(
                f"{self.api_base}/sessions/{session_id}/messages", 
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def get_session(self, session_id: str) -> Dict[str, Any]:
        """Get session details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_base}/sessions/{session_id}")
            response.raise_for_status()
            return response.json()
    
    async def list_sessions(self) -> Dict[str, Any]:
        """List all sessions."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_base}/sessions")
            response.raise_for_status()
            return response.json()
    
    async def get_messages(self, session_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get session messages."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/sessions/{session_id}/messages?limit={limit}"
            )
            response.raise_for_status()
            return response.json()
    
    async def stop_session(self, session_id: str) -> Dict[str, Any]:
        """Stop a session."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{self.api_base}/sessions/{session_id}")
            response.raise_for_status()
            return response.json()
    
    async def quick_message(self, message: str, workspace_path: str = None) -> Dict[str, Any]:
        """Send a quick message without creating a persistent session."""
        async with httpx.AsyncClient(timeout=600.0) as client:
            payload = {"message": message}
            if workspace_path:
                payload["workspace_path"] = workspace_path
            
            response = await client.post(
                f"{self.api_base}/sessions/temp/quick-message", 
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_base}/health")
            response.raise_for_status()
            return response.json()


async def example_basic_usage():
    """Example: Basic usage - create session, send message, get response."""
    client = ClineAPIClient()
    
    print("🚀 Example: Basic Cline Agent Usage")
    print("=" * 50)
    
    try:
        # Check health first
        health = await client.health_check()
        print(f"✅ Service health: {health}")
        
        # Create a new session
        print("\n📝 Creating new session...")
        session = await client.create_session()
        session_id = session["session_id"]
        print(f"✅ Session created: {session_id}")
        print(f"   Workspace: {session['workspace_path']}")
        
        # Send a message
        print("\n💬 Sending message...")
        message = "Hello! Can you tell me how many files are in the current directory?"
        response = await client.send_message(session_id, message)
        
        print(f"📤 Sent: {message}")
        print(f"🤖 Agent response: {response['response'][:200]}...")
        
        # Get session messages
        print("\n📋 Getting conversation history...")
        messages = await client.get_messages(session_id)
        print(f"📊 Total messages: {messages['total_count']}")
        
        for msg in messages["messages"][-2:]:  # Last 2 messages
            print(f"   [{msg['type']}] {msg['content'][:100]}...")
        
        # Stop session
        print(f"\n🛑 Stopping session {session_id}...")
        stop_result = await client.stop_session(session_id)
        print(f"✅ {stop_result['message']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def example_quick_message():
    """Example: Quick message without session management."""
    client = ClineAPIClient()
    
    print("\n🚀 Example: Quick Message (No Session)")
    print("=" * 50)
    
    try:
        message = "What Python files exist in the workspace?"
        print(f"📤 Sending quick message: {message}")
        
        response = await client.quick_message(message)
        
        print(f"🤖 Quick response:")
        print(f"   Status: {response['status']}")
        print(f"   Response: {response['response'][:300]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def example_multi_turn_conversation():
    """Example: Multi-turn conversation in same session."""
    client = ClineAPIClient()
    
    print("\n🚀 Example: Multi-turn Conversation")
    print("=" * 50)
    
    session_id = None
    
    try:
        # Create session
        session = await client.create_session()
        session_id = session["session_id"]
        print(f"✅ Session created: {session_id}")
        
        # Series of messages
        messages = [
            "List the files in the current directory",
            "Can you create a simple Python hello world script?",
            "Now show me the contents of that script"
        ]
        
        for i, msg in enumerate(messages, 1):
            print(f"\n💬 Turn {i}: {msg}")
            
            response = await client.send_message(session_id, msg)
            print(f"🤖 Response: {response['response'][:150]}...")
            
            # Brief pause between messages
            await asyncio.sleep(2)
        
        # Get full conversation
        print(f"\n📋 Full conversation history:")
        conversation = await client.get_messages(session_id)
        
        for msg in conversation["messages"]:
            role = "👤 You" if msg["type"] == "user" else "🤖 Agent"
            print(f"{role}: {msg['content'][:100]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        if session_id:
            try:
                await client.stop_session(session_id)
                print(f"🛑 Session {session_id} stopped")
            except:
                pass


async def example_session_management():
    """Example: Managing multiple sessions."""
    client = ClineAPIClient()
    
    print("\n🚀 Example: Session Management")
    print("=" * 50)
    
    session_ids = []
    
    try:
        # Create multiple sessions
        print("📝 Creating multiple sessions...")
        for i in range(3):
            session = await client.create_session()
            session_ids.append(session["session_id"])
            print(f"   ✅ Session {i+1}: {session['session_id']}")
        
        # List all sessions
        print("\n📋 Listing all sessions...")
        sessions = await client.list_sessions()
        print(f"📊 Total active sessions: {sessions['total_count']}")
        
        for session in sessions["sessions"]:
            print(f"   🔹 {session['session_id']} - Status: {session['status']}")
        
        # Send message to specific session
        if session_ids:
            target_session = session_ids[0]
            print(f"\n💬 Sending message to session {target_session}...")
            
            response = await client.send_message(
                target_session, 
                "What's the current working directory?"
            )
            print(f"🤖 Response: {response['response'][:100]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        # Clean up all sessions
        print("\n🧹 Cleaning up sessions...")
        for session_id in session_ids:
            try:
                await client.stop_session(session_id)
                print(f"   🛑 Stopped {session_id}")
            except Exception as e:
                print(f"   ⚠️ Failed to stop {session_id}: {e}")


async def main():
    """Run all examples."""
    print("🎯 CLINE AGENT API EXAMPLES")
    print("=" * 60)
    
    examples = [
        example_basic_usage,
        example_quick_message,
        example_multi_turn_conversation,
        example_session_management
    ]
    
    for example in examples:
        try:
            await example()
            print("\n" + "─" * 60)
            await asyncio.sleep(1)  # Brief pause between examples
            
        except KeyboardInterrupt:
            print("\n🛑 Examples interrupted by user")
            break
        except Exception as e:
            print(f"❌ Example failed: {e}")
            print("─" * 60)
    
    print("\n✅ All examples completed!")


if __name__ == "__main__":
    asyncio.run(main())
