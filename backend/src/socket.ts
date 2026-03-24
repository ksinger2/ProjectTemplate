import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

export function setupSocket(httpServer: HttpServer, frontendUrl: string): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
