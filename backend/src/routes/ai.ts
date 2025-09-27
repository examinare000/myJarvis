import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

// TODO: Add JWT authentication middleware
// import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/v1/ai/chat
 * Proxy chat requests to the AI service
 */
router.post('/chat', /* authenticateToken, */ async (req: Request, res: Response) => {
  const { stream = false } = req.body;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    if (stream && response.body) {
      // For streaming responses, pipe directly to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // @ts-ignore - node-fetch body is readable stream
      response.body.pipe(res);
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('AI service proxy error:', error);
    res.status(503).json({
      error: 'AI service is unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/ai/models
 * Get available AI models from the AI service
 */
router.get('/models', /* authenticateToken, */ async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/ollama/models`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI models fetch error:', error);
    res.status(503).json({
      error: 'AI service is unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;