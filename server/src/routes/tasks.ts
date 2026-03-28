import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) {
    res.status(400).json({ error: 'project_id required' });
    return;
  }

  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order ASC, created_at DESC').all(project_id);
  res.json({ tasks });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { project_id, name, description, type, status, dependencies, sort_order, canvas_col, canvas_row } = req.body;
  if (!project_id || !name || !type) {
    res.status(400).json({ error: 'project_id, name, and type required' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO tasks (id, project_id, name, description, type, status, dependencies, sort_order, canvas_col, canvas_row)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, project_id, name, description || '', type,
    status || 'waiting',
    dependencies ? JSON.stringify(dependencies) : '[]',
    sort_order || 0, canvas_col ?? null, canvas_row ?? null
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json({ task });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const fields = ['name', 'description', 'type', 'status', 'interrupted_status', 'sort_order',
    'requirement_doc', 'technical_plan', 'worktree_branch', 'current_phase',
    'token_total', 'canvas_col', 'canvas_row'];

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (req.body.dependencies !== undefined) {
    updates.push('dependencies = ?');
    values.push(JSON.stringify(req.body.dependencies));
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ task });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
