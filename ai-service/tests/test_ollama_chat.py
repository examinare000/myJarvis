"""Ollama Chat API Tests"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import json

@pytest.fixture
def client():
    """Create test client"""
    from src.main import app
    return TestClient(app)

class TestOllamaChat:
    """Test Ollama chat functionality"""

    @patch('httpx.AsyncClient.post')
    async def test_chat_completion_success(self, mock_post, client):
        """Test successful chat completion"""
        # Mock Ollama response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = 'Hello! How can I help you today?'
        mock_response.json.return_value = {
            'model': 'llama2',
            'response': 'Hello! How can I help you today?',
            'done': True
        }
        mock_post.return_value = mock_response

        # Test request
        response = client.post('/chat/completions', json={
            'model': 'llama2',
            'messages': [
                {'role': 'user', 'content': 'Hello'}
            ]
        })

        assert response.status_code == 200
        data = response.json()
        assert 'choices' in data
        assert len(data['choices']) > 0
        assert data['choices'][0]['message']['content'] == 'Hello! How can I help you today?'

    @patch('httpx.AsyncClient.post')
    async def test_chat_streaming(self, mock_post, client):
        """Test streaming chat completion"""
        # Mock streaming response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.iter_lines.return_value = [
            json.dumps({'response': 'Hello', 'done': False}),
            json.dumps({'response': ' there!', 'done': False}),
            json.dumps({'response': '', 'done': True})
        ]
        mock_post.return_value = mock_response

        response = client.post('/chat/completions', json={
            'model': 'llama2',
            'messages': [{'role': 'user', 'content': 'Hi'}],
            'stream': True
        })

        assert response.status_code == 200
        # Streaming response should be event-stream
        assert 'text/event-stream' in response.headers.get('content-type', '')

    @patch('httpx.AsyncClient.post')
    async def test_chat_with_system_prompt(self, mock_post, client):
        """Test chat with system prompt"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'model': 'llama2',
            'response': 'I am a helpful AI assistant.',
            'done': True
        }
        mock_post.return_value = mock_response

        response = client.post('/chat/completions', json={
            'model': 'llama2',
            'messages': [
                {'role': 'system', 'content': 'You are a helpful assistant'},
                {'role': 'user', 'content': 'Who are you?'}
            ]
        })

        assert response.status_code == 200
        data = response.json()
        assert data['choices'][0]['message']['role'] == 'assistant'

    @patch('httpx.AsyncClient.post')
    async def test_chat_error_handling(self, mock_post, client):
        """Test error handling when Ollama is unavailable"""
        mock_post.side_effect = Exception("Connection refused")

        response = client.post('/chat/completions', json={
            'model': 'llama2',
            'messages': [{'role': 'user', 'content': 'Hello'}]
        })

        assert response.status_code == 503
        data = response.json()
        assert 'error' in data
        assert 'Ollama service unavailable' in data['error']

    @patch('httpx.AsyncClient.get')
    async def test_list_models(self, mock_get, client):
        """Test listing available Ollama models"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'models': [
                {'name': 'llama2', 'size': '3.8GB'},
                {'name': 'codellama', 'size': '3.8GB'}
            ]
        }
        mock_get.return_value = mock_response

        response = client.get('/ollama/models')

        assert response.status_code == 200
        data = response.json()
        assert 'data' in data
        assert 'models' in data['data']
        assert len(data['data']['models']) == 2