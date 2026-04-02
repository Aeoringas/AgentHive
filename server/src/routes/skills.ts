import { Router, Response } from 'express';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

interface ProjectRow { id: string; repo_path: string }

function findProject(projectId: string): ProjectRow | undefined {
  return db.prepare('SELECT id, repo_path FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
}

interface SkillMeta {
  name: string;
  description: string;
  category: string;
  inject_target: string;
  inject_scene: string;
  [key: string]: string;
}

interface SkillFile {
  filename: string;
  meta: SkillMeta;
  content: string;
}

function parseFrontmatter(raw: string): { meta: SkillMeta; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: { name: '', description: '', category: '', inject_target: '', inject_scene: '' }, content: raw };

  const meta: SkillMeta = { name: '', description: '', category: '', inject_target: '', inject_scene: '' };
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  }
  return { meta, content: match[2] };
}

function toFrontmatter(meta: SkillMeta, content: string): string {
  const lines = Object.entries(meta)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n${content}`;
}

function readSkillsDir(dirPath: string): SkillFile[] {
  if (!existsSync(dirPath)) return [];
  const files = readdirSync(dirPath).filter(f => f.endsWith('.md')).sort();
  return files.map(filename => {
    const raw = readFileSync(join(dirPath, filename), 'utf-8');
    const { meta, content } = parseFrontmatter(raw);
    return { filename, meta, content };
  });
}

// 列出项目的 skills
router.get('/', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const skillsDir = join(project.repo_path, '.claude', 'skills');
  const skills = readSkillsDir(skillsDir);
  res.json({ skills });
});

// 读取单个 skill
router.get('/:filename', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const filePath = join(project.repo_path, '.claude', 'skills', String(req.params.filename));
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Skill not found' }); return; }

  const raw = readFileSync(filePath, 'utf-8');
  const { meta, content } = parseFrontmatter(raw);
  res.json({ filename: req.params.filename, meta, content });
});

// 保存 skill（新建或更新）
router.put('/:filename', (req: AuthRequest, res: Response) => {
  const { project_id, meta, content } = req.body;
  if (!project_id || !meta || content === undefined) {
    res.status(400).json({ error: 'project_id, meta, and content required' });
    return;
  }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const skillsDir = join(project.repo_path, '.claude', 'skills');
  if (!existsSync(skillsDir)) mkdirSync(skillsDir, { recursive: true });

  const filePath = join(skillsDir, String(req.params.filename));
  writeFileSync(filePath, toFrontmatter(meta, content), 'utf-8');
  res.json({ success: true, filename: req.params.filename });
});

// 删除 skill
router.delete('/:filename', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const filePath = join(project.repo_path, '.claude', 'skills', String(req.params.filename));
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Skill not found' }); return; }

  unlinkSync(filePath);
  res.json({ success: true });
});

// -- Rules --

router.get('/rules/list', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const rulesDir = join(project.repo_path, '.claude', 'rules');
  if (!existsSync(rulesDir)) { res.json({ rules: [] }); return; }
  const files = readdirSync(rulesDir).filter(f => f.endsWith('.md')).sort();
  const rules = files.map(filename => {
    const content = readFileSync(join(rulesDir, filename), 'utf-8');
    return { filename, content };
  });
  res.json({ rules });
});

router.put('/rules/:filename', (req: AuthRequest, res: Response) => {
  const { project_id, content } = req.body;
  if (!project_id || content === undefined) { res.status(400).json({ error: 'project_id and content required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const rulesDir = join(project.repo_path, '.claude', 'rules');
  if (!existsSync(rulesDir)) mkdirSync(rulesDir, { recursive: true });
  writeFileSync(join(rulesDir, String(req.params.filename)), content, 'utf-8');
  res.json({ success: true });
});

router.delete('/rules/:filename', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const filePath = join(project.repo_path, '.claude', 'rules', String(req.params.filename));
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Rule not found' }); return; }
  unlinkSync(filePath);
  res.json({ success: true });
});

// -- Hooks --

router.get('/hooks/list', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const hooksDir = join(project.repo_path, '.claude', 'hooks');
  if (!existsSync(hooksDir)) { res.json({ hooks: [] }); return; }
  const files = readdirSync(hooksDir).filter(f => f.endsWith('.sh') || f.endsWith('.js')).sort();
  const hooks = files.map(filename => {
    const content = readFileSync(join(hooksDir, filename), 'utf-8');
    return { filename, content };
  });
  res.json({ hooks });
});

router.put('/hooks/:filename', (req: AuthRequest, res: Response) => {
  const { project_id, content } = req.body;
  if (!project_id || content === undefined) { res.status(400).json({ error: 'project_id and content required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const hooksDir = join(project.repo_path, '.claude', 'hooks');
  if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });
  writeFileSync(join(hooksDir, String(req.params.filename)), content, 'utf-8');
  res.json({ success: true });
});

router.delete('/hooks/:filename', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }
  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const filePath = join(project.repo_path, '.claude', 'hooks', String(req.params.filename));
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Hook not found' }); return; }
  unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
