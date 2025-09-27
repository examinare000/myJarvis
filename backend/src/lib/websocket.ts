import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('chat:message', (message) => {
      socket.broadcast.emit('chat:message', message);
    });

    socket.on('chat:typing', (data) => {
      socket.broadcast.emit('chat:typing', data);
    });

    socket.on('chat:send', (payload) => {
      io.emit('chat:broadcast', payload);
    });
  });

  return io;
};
