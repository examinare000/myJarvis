"""Health check endpoint tests (TDD Red Phase)"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime


def test_health_check_endpoint(test_client):
    """Test that health check endpoint returns expected status"""
    # Red Phase: このテストは最初は失敗する
    response = test_client.get("/health")

    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert data["status"] == "healthy"
    assert "service" in data
    assert data["service"] == "myjarvis-ai-service"
    assert "timestamp" in data
    assert "uptime" in data
    assert "version" in data


def test_health_check_includes_model_status(test_client):
    """Test that health check includes AI model status"""
    response = test_client.get("/health")

    assert response.status_code == 200
    data = response.json()

    assert "models" in data
    assert "ollama" in data["models"]
    assert "status" in data["models"]["ollama"]
    assert "available_models" in data["models"]["ollama"]


def test_health_check_response_time(test_client):
    """Test that health check responds within reasonable time"""
    import time

    start = time.time()
    response = test_client.get("/health")
    elapsed = time.time() - start

    assert response.status_code == 200
    assert elapsed < 1.0  # Should respond within 1 second


@pytest.fixture
def test_client():
    """Create test client for FastAPI app"""
    # Stub implementation - will fail initially
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()

    # Stub health endpoint
    @app.get("/health")
    async def health():
        return {"status": "not_implemented"}

    return TestClient(app)