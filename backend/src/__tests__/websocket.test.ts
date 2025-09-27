import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { AddressInfo } from 'net';
import { initializeWebSocket } from '../lib/websocket';

describe('WebSocket Server', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = initializeWebSocket(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('should handle client connection', (done) => {
    expect(serverSocket).toBeDefined();
    expect(clientSocket.connected).toBe(true);
    done();
  });

  test('should emit and receive chat messages', (done) => {
    const testMessage = {
      text: 'Hello WebSocket',
      userId: 'test-user',
      timestamp: new Date().toISOString()
    };

    clientSocket.on('chat:message', (message: any) => {
      expect(message).toEqual(testMessage);
      done();
    });

    serverSocket.emit('chat:message', testMessage);
  });

  test('should handle typing events', (done) => {
    const typingData = {
      userId: 'test-user',
      isTyping: true
    };

    serverSocket.on('chat:typing', (data: any) => {
      expect(data).toEqual(typingData);
      done();
    });

    clientSocket.emit('chat:typing', typingData);
  });

  test('should handle disconnection', (done) => {
    serverSocket.on('disconnect', () => {
      expect(serverSocket.connected).toBe(false);
      done();
    });

    clientSocket.disconnect();
  });

  test('should broadcast messages to all clients', (done) => {
    const secondClient = Client(`http://localhost:${(httpServer.address() as AddressInfo).port}`);
    const broadcastMessage = {
      text: 'Broadcast test',
      userId: 'user-1'
    };

    secondClient.on('connect', () => {
      secondClient.on('chat:broadcast', (message: any) => {
        expect(message).toEqual(broadcastMessage);
        secondClient.close();
        done();
      });

      // First client sends message
      clientSocket.emit('chat:send', broadcastMessage);
    });
  });
});