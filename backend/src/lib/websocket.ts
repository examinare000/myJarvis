import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Existing chat handlers
    socket.on('chat:message', (message) => {
      socket.broadcast.emit('chat:message', message);
    });

    socket.on('chat:typing', (data) => {
      socket.broadcast.emit('chat:typing', data);
    });

    socket.on('chat:send', (payload) => {
      io.emit('chat:broadcast', payload);
    });

    // AI chat handler
    socket.on('ai:chat', async (data) => {
      const { message, model = 'llama2' } = data;

      try {
        // Call AI service with streaming
        const response = await fetch(`${AI_SERVICE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'user', content: message }
            ],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`AI service returned ${response.status}`);
        }

        // Stream response chunks to client
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                socket.emit('ai:complete');
              } else {
                try {
                  const parsed = JSON.parse(data);
                  socket.emit('ai:response', parsed);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

      } catch (error) {
        console.error('AI chat error:', error);
        socket.emit('ai:error', {
          message: error instanceof Error ? error.message : 'AI service error',
          code: 'AI_SERVICE_ERROR'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
