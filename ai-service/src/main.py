from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import uvicorn
import httpx
import json
import os
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time
import uuid

app = FastAPI(
    title="myJarvis AI Service",
    description="AI and ML processing service for myJarvis personal assistant",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    ollama_status: str

@app.get("/")
async def root():
    return {
        "message": "myJarvis AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint that also verifies Ollama connectivity"""
    ollama_status = "unknown"

    try:
        # Check if Ollama is running
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=5.0)
            if response.status_code == 200:
                ollama_status = "healthy"
            else:
                ollama_status = "unhealthy"
    except Exception:
        ollama_status = "unhealthy"

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="myJarvis-ai-service",
        ollama_status=ollama_status
    )

@app.get("/ollama/models")
async def get_ollama_models():
    """Get available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=10.0)
            if response.status_code == 200:
                return {
                    "status": "success",
                    "data": response.json()
                }
            else:
                return {
                    "status": "error",
                    "message": f"Ollama API returned status {response.status_code}"
                }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to connect to Ollama: {str(e)}"
        }

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: Optional[bool] = False

OLLAMA_API_URL = "http://localhost:11434/api/chat"

async def stream_generator(request: ChatCompletionRequest):
    """Generator for streaming responses."""
    chat_id = f"chatcmpl-{''.join(str(uuid.uuid4()).split('-'))}"
    created_timestamp = int(time.time())

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", OLLAMA_API_URL, json={
                "model": request.model,
                "messages": [msg.dict() for msg in request.messages],
                "stream": True
            }, timeout=None) as response:
                if response.status_code != 200:
                    response.raise_for_status()

                async for chunk in response.aiter_lines():
                    if chunk:
                        try:
                            json_chunk = json.loads(chunk)
                            if json_chunk.get("done") is False:
                                delta_content = json_chunk.get("message", {}).get("content", "")
                                response_chunk = {
                                    "id": chat_id,
                                    "object": "chat.completion.chunk",
                                    "created": created_timestamp,
                                    "model": request.model,
                                    "choices": [
                                        {
                                            "index": 0,
                                            "delta": {"content": delta_content},
                                            "finish_reason": None,
                                        }
                                    ],
                                }
                                yield f"data: {json.dumps(response_chunk)}\n\n"
                        except json.JSONDecodeError:
                            # Ignore chunks that are not valid JSON
                            pass

        # Send the final chunk
        final_chunk = {
            "id": chat_id,
            "object": "chat.completion.chunk",
            "created": created_timestamp,
            "model": request.model,
            "choices": [
                {
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop",
                }
            ],
        }
        yield f"data: {json.dumps(final_chunk)}\n\n"
        yield "data: [DONE]\n\n"

    except httpx.ConnectError as e:
        error_message = f"Error connecting to Ollama: {e}"
        # Yield a custom error message in the stream if possible
        error_chunk = {
            "error": {
                "message": error_message,
                "type": "service_unavailable",
                "code": 503
            }
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_message = f"An unexpected error occurred: {e}"
        error_chunk = {
            "error": {
                "message": error_message,
                "type": "internal_server_error",
                "code": 500
            }
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"


@app.post("/chat/completions")
async def chat_completion(request: ChatCompletionRequest):
    """
    Chat completion endpoint that proxies requests to Ollama.
    It supports both streaming and non-streaming responses.
    """
    if request.stream:
        return StreamingResponse(stream_generator(request), media_type="text/event-stream")

    # Non-streaming logic
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": request.model,
                    "messages": [msg.dict() for msg in request.messages],
                    "stream": False,
                },
                timeout=60.0,
            )
            response.raise_for_status()

            ollama_response = response.json()

            # Format the response to be OpenAI-compatible
            return {
                "id": f"chatcmpl-{''.join(str(uuid.uuid4()).split('-'))}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": ollama_response.get("model"),
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": ollama_response.get("message", {}).get("role"),
                            "content": ollama_response.get("message", {}).get("content"),
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": ollama_response.get("prompt_eval_count"),
                    "completion_tokens": ollama_response.get("eval_count"),
                    "total_tokens": ollama_response.get("prompt_eval_count", 0) + ollama_response.get("eval_count", 0),
                },
            }

    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Service Unavailable: Could not connect to Ollama.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Ollama API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("RELOAD", "true").lower() == "true"
    )