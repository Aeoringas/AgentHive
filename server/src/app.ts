import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import sessionRoutes from './routes/sessions.js';
import settingsRoutes from './routes/settings.js';
import gitRoutes from './routes/git.js';
import usageRoutes from './routes/usage.js';
import skillsRoutes from './routes/skills.js';
import chatRoutes from './routes/chat.js';

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/chat', chatRoutes);

export default app;
