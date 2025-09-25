from fastapi import FastAPI
from datetime import datetime
import uvicorn
import httpx
import os
from pydantic import BaseModel

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

@app.post("/chat/completions")
async def chat_completion(request: dict):
    """Chat completion endpoint (placeholder for future implementation)"""
    return {
        "status": "not_implemented",
        "message": "Chat completion functionality will be implemented in future versions",
        "received_request": request
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("RELOAD", "true").lower() == "true"
    )