import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { parse } from 'url';

const JWT_SECRET = process.env.JWT_SECRET || 'agenthive-dev-secret';

const clients = new Set<WebSocket>();

export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const { query } = parse(req.url || '', true);
    const token = query.token as string;

    if (!token) {
      ws.close(4001, 'Token required');
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return wss;
}

export function broadcast(data: Record<string, unknown>) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
