import { createServer } from 'http';
import app from './app.js';
import { runMigrations } from './database/migrate.js';
import { createWebSocketServer } from './websocket/index.js';

runMigrations();

const server = createServer(app);
createWebSocketServer(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
