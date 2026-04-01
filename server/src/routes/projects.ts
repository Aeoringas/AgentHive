import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const SCAN_ROOT = '/Users/aeoringas/AI_Storage';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY is_source DESC, last_accessed_at DESC').all();
  res.json({ projects });
});

router.post('/:id/access', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = db.prepare("UPDATE projects SET last_accessed_at = datetime('now') WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ success: true });
});

router.get('/discover', (_req: AuthRequest, res: Response) => {
  const registered = db.prepare('SELECT repo_path FROM projects').all() as { repo_path: string }[];
  const registeredPaths = new Set(registered.map(p => p.repo_path));

  const discovered: { name: string; path: string }[] = [];
  try {
    const entries = readdirSync(SCAN_ROOT);
    for (const entry of entries) {
      const fullPath = join(SCAN_ROOT, entry);
      try {
        if (!statSync(fullPath).isDirectory()) continue;
        if (registeredPaths.has(fullPath)) continue;
        if (existsSync(join(fullPath, '.git'))) {
          discovered.push({ name: basename(fullPath), path: fullPath });
        }
      } catch { /* skip inaccessible */ }
    }
  } catch { /* scan root inaccessible */ }

  res.json({ discovered });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, description, repo_path, is_source } = req.body;
  if (!name || !repo_path) {
    res.status(400).json({ error: 'Name and repo_path required' });
    return;
  }

  if (!existsSync(repo_path)) {
    try {
      mkdirSync(repo_path, { recursive: true });
      execSync('git init', { cwd: repo_path });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create project directory' });
      return;
    }
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

  if (existsSync(project.repo_path)) {
    try {
      rmSync(project.repo_path, { recursive: true, force: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete project directory' });
      return;
    }
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
