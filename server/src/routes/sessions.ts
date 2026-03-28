import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  const { project_id, type } = req.query;
  if (!project_id) {
    res.status(400).json({ error: 'project_id required' });
    return;
  }

  let sql = 'SELECT * FROM sessions WHERE project_id = ? AND deleted_at IS NULL';
  const params: any[] = [project_id];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC';
  const sessions = db.prepare(sql).all(...params);
  res.json({ sessions });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { type, title, task_id, project_id } = req.body;
  if (!type || !project_id) {
    res.status(400).json({ error: 'type and project_id required' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO sessions (id, type, title, task_id, project_id) VALUES (?, ?, ?, ?, ?)'
  ).run(id, type, title || '', task_id || null, project_id);

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json({ session });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const fields = ['title', 'status', 'is_archived', 'token_total'];
  const updates: string[] = [];
  const values: any[] = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.json({ session });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  db.prepare(
    "UPDATE sessions SET deleted_at = datetime('now'), is_archived = 1, updated_at = datetime('now') WHERE id = ?"
  ).run(id);

  res.json({ success: true });
});

router.get('/:id/messages', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(id);
  res.json({ messages });
});

export default router;
