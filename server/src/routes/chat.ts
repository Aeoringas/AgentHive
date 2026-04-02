import { Router, Response } from 'express';
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, unlinkSync, mkdirSync, appendFileSync } from 'fs';
import { join, basename } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const execFileAsync = promisify(execFile);

const router = Router();
router.use(authMiddleware);

const PROJECTS_DIR = join(os.homedir(), '.claude', 'projects');

interface ProjectRow { id: string; repo_path: string }

function findProject(projectId: string): ProjectRow | undefined {
  return db.prepare('SELECT id, repo_path FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
}

function parseJSONL(filePath: string): any[] {
  try {
    return readFileSync(filePath, 'utf-8').split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

// repo_path -> claude project dir 的映射缓存
let cwdCache: Map<string, string> | null = null;

function buildCwdMap(): Map<string, string> {
  if (cwdCache) return cwdCache;
  const map = new Map<string, string>();
  if (!existsSync(PROJECTS_DIR)) return map;

  for (const dir of readdirSync(PROJECTS_DIR)) {
    const dirPath = join(PROJECTS_DIR, dir);
    try { if (!statSync(dirPath).isDirectory()) continue; } catch { continue; }
    const jsonlFiles = readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    if (jsonlFiles.length === 0) continue;

    const firstFile = join(dirPath, jsonlFiles[0]);
    const lines = readFileSync(firstFile, 'utf-8').split('\n', 5);
    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        if (r.cwd) { map.set(r.cwd, dirPath); break; }
      } catch {}
    }
  }
  cwdCache = map;
  // 5 分钟后清除缓存
  setTimeout(() => { cwdCache = null; }, 300_000);
  return map;
}

function findClaudeDir(repoPath: string): string | null {
  const map = buildCwdMap();
  return map.get(repoPath) || null;
}

// 会话列表
router.get('/sessions', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const claudeDir = findClaudeDir(project.repo_path);
  if (!claudeDir) { res.json({ sessions: [] }); return; }

  const jsonlFiles = readdirSync(claudeDir).filter(f => f.endsWith('.jsonl'));
  const sessions = jsonlFiles.map(filename => {
    const filePath = join(claudeDir, filename);
    const stat = statSync(filePath);
    const records = parseJSONL(filePath);
    const sessionId = basename(filename, '.jsonl');

    let title: string | null = null;
    let firstTs: string | null = null;
    let lastTs: string | null = null;
    let messageCount = 0;
    let model: string | null = null;
    let cwd: string | null = null;
    let hasHR = false;

    for (const r of records) {
      if (r.type === 'ai-title' && r.aiTitle) title = r.aiTitle;
      if (r.timestamp) {
        if (!firstTs || r.timestamp < firstTs) firstTs = r.timestamp;
        if (!lastTs || r.timestamp > lastTs) lastTs = r.timestamp;
      }
      if (r.type === 'user' || r.type === 'assistant') messageCount++;
      if (r.type === 'assistant' && r.message?.model && !model) model = r.message.model;
      if (r.cwd && !cwd) cwd = r.cwd;
      if (r.type === 'assistant' && r.message?.content) {
        const content = Array.isArray(r.message.content) ? r.message.content : [];
        for (const block of content) {
          if (block.type === 'tool_use' && block.name === 'Agent') {
            const desc = (block.input?.description || '').toLowerCase();
            const type = (block.input?.subagent_type || '').toLowerCase();
            if (desc.includes('hr') || type.includes('hr')) {
              hasHR = true;
            }
          }
        }
      }
    }

    let category = 'assistant';
    if (hasHR) {
      category = 'hr';
    } else if (cwd && (cwd.includes('worktree') || cwd.includes('-worktrees-'))) {
      category = 'dev';
    }

    return {
      id: sessionId,
      title,
      model,
      messageCount,
      category,
      firstTimestamp: firstTs,
      lastTimestamp: lastTs,
      fileSize: stat.size,
    };
  });

  sessions.sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));
  res.json({ sessions });
});

// 会话消息
router.get('/messages', (req: AuthRequest, res: Response) => {
  const { project_id, session_id } = req.query;
  if (!project_id || !session_id) {
    res.status(400).json({ error: 'project_id and session_id required' });
    return;
  }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const claudeDir = findClaudeDir(project.repo_path);
  if (!claudeDir) { res.status(404).json({ error: 'Session not found' }); return; }

  const filePath = join(claudeDir, String(session_id) + '.jsonl');
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Session not found' }); return; }

  const records = parseJSONL(filePath);
  const messages: any[] = [];

  for (const r of records) {
    if (r.type === 'user' && r.message) {
      const content = r.message.content;
      const texts: string[] = [];
      if (typeof content === 'string') {
        texts.push(content);
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') texts.push(block.text);
        }
      }
      if (texts.length === 0) continue;
      messages.push({ type: 'user', timestamp: r.timestamp, texts });
    } else if (r.type === 'assistant' && r.message) {
      const content = r.message.content;
      const texts: string[] = [];
      const toolCalls: any[] = [];
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') texts.push(block.text);
          else if (block.type === 'tool_use') {
            const tc: any = { name: block.name };
            if (block.name === 'Agent') {
              tc.isAgent = true;
              tc.agentDesc = block.input?.description || '';
              tc.agentType = block.input?.subagent_type || '';
            }
            toolCalls.push(tc);
          }
        }
      }
      messages.push({
        type: 'assistant',
        timestamp: r.timestamp,
        model: r.message.model,
        usage: r.message.usage || null,
        texts,
        toolCalls,
      });
    }
  }

  res.json({ messages });
});

// 发送消息并获取 AI 回复
router.post('/messages', async (req: AuthRequest, res: Response) => {
  const { project_id, session_id, content } = req.body;
  if (!project_id || !session_id || !content) {
    res.status(400).json({ error: 'project_id, session_id, and content required' });
    return;
  }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  try {
    const { stdout } = await execFileAsync('claude', [
      '--resume', String(session_id),
      '-p',
      '--output-format', 'json',
      String(content),
    ], {
      cwd: project.repo_path,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 600000,
    });

    let reply = '';
    try {
      const parsed = JSON.parse(stdout);
      reply = parsed.result || parsed.content || stdout;
    } catch {
      reply = stdout;
    }

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message, reply: null });
  }
});

// 新建对话
router.post('/sessions', (req: AuthRequest, res: Response) => {
  const { project_id, title } = req.body;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  let claudeDir = findClaudeDir(project.repo_path);
  if (!claudeDir) {
    // 如果没有对应的 Claude 项目目录，创建一个
    const dirName = '-' + project.repo_path.replace(/\//g, '-').replace(/^-/, '');
    claudeDir = join(PROJECTS_DIR, dirName);
    mkdirSync(claudeDir, { recursive: true });
    // 清除缓存以便重新扫描
    cwdCache = null;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const initRecord = { type: 'user', cwd: project.repo_path, sessionId: id, timestamp: now, message: { role: 'user', content: title || '新对话' } };
  writeFileSync(join(claudeDir, id + '.jsonl'), JSON.stringify(initRecord) + '\n', 'utf-8');

  res.status(201).json({ session: { id, title: title || '新对话' } });
});

// 删除对话
router.delete('/sessions/:id', (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(String(project_id));
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const claudeDir = findClaudeDir(project.repo_path);
  if (!claudeDir) { res.status(404).json({ error: 'Session not found' }); return; }

  const filePath = join(claudeDir, String(req.params.id) + '.jsonl');
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Session not found' }); return; }

  unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
