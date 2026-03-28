import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json({ projects });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, description, repo_path, is_source } = req.body;
  if (!name || !repo_path) {
    res.status(400).json({ error: 'Name and repo_path required' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO projects (id, name, description, repo_path, is_source) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, description || '', repo_path, is_source ? 1 : 0);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ project });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, repo_path, is_source } = req.body;

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  db.prepare(
    `UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
     repo_path = COALESCE(?, repo_path), is_source = COALESCE(?, is_source),
     updated_at = datetime('now') WHERE id = ?`
  ).run(name, description, repo_path, is_source !== undefined ? (is_source ? 1 : 0) : undefined, id);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ project });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (project.is_source) {
    res.status(403).json({ error: 'Cannot delete source project' });
    return;
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
