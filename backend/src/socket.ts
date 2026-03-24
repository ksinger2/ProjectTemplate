import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupWatchSessionHandlers } from './services/watch-session';

export function setupSocket(httpServer: HttpServer, frontendUrl: string): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Register watch session handlers (auth middleware + event handlers)
  setupWatchSessionHandlers(io);

  return io;
}
