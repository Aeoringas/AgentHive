import { Router, Response } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const execFileAsync = promisify(execFile);

const router = Router();
router.use(authMiddleware);

interface ProjectRow {
  id: string;
  repo_path: string;
}

async function git(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoPath,
    maxBuffer: 5 * 1024 * 1024,
  });
  return stdout;
}

function qs(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return String(v ?? '');
}

function findProject(projectId: unknown): ProjectRow | undefined {
  return db.prepare('SELECT id, repo_path FROM projects WHERE id = ?').get(qs(projectId)) as ProjectRow | undefined;
}

function parseCommits(raw: string) {
  return raw.split('---END---\n').filter(Boolean).map((block) => {
    const lines = block.split('\n');
    return {
      hash: lines[0],
      author: lines[1],
      email: lines[2],
      date: lines[3],
      subject: lines[4],
      body: lines.slice(5).join('\n').trim(),
    };
  });
}

interface FileStat {
  path: string;
  additions: number;
  deletions: number;
}

function parseNumstat(raw: string): FileStat[] {
  return raw.trim().split('\n').filter(Boolean).map((line) => {
    const [add, del, ...pathParts] = line.split('\t');
    return {
      path: pathParts.join('\t'),
      additions: add === '-' ? 0 : Number(add),
      deletions: del === '-' ? 0 : Number(del),
    };
  });
}

router.get('/commits', async (req: AuthRequest, res: Response) => {
  const { project_id, search, limit = '50', offset = '0' } = req.query;
  if (!project_id) {
    res.status(400).json({ error: 'project_id required' });
    return;
  }

  const project = findProject(project_id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const args: string[] = [
    'log',
    `--max-count=${Number(limit)}`,
    `--skip=${Number(offset)}`,
    '--format=%H%n%an%n%ae%n%aI%n%s%n%b%n---END---',
  ];
  if (search) args.push(`--grep=${qs(search)}`, '-i');

  try {
    const raw = await git(project.repo_path, args);
    res.json({ commits: parseCommits(raw) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/commits/:hash', async (req: AuthRequest, res: Response) => {
  const projectId = req.query.project_id;
  const hash = String(req.params.hash);
  if (!projectId) {
    res.status(400).json({ error: 'project_id required' });
    return;
  }

  const project = findProject(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    const [infoRaw, numstatRaw, patchRaw] = await Promise.all([
      git(project.repo_path, ['log', '-1', hash, '--format=%H%n%an%n%ae%n%aI%n%s%n%b%n---END---']),
      git(project.repo_path, ['diff', `${hash}~1`, hash, '--numstat']).catch(() => ''),
      git(project.repo_path, ['diff', `${hash}~1`, hash, '--patch']).catch(() => ''),
    ]);

    const commits = parseCommits(infoRaw);
    const commit = commits[0] ?? null;
    const files = parseNumstat(numstatRaw);

    res.json({ commit, files, patch: patchRaw });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -- 文件浏览 --

router.get('/tree', async (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  if (!project_id) { res.status(400).json({ error: 'project_id required' }); return; }

  const project = findProject(project_id);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  try {
    // git ls-files 获取已跟踪文件
    const tracked = await git(project.repo_path, ['ls-files']);
    // git status --porcelain 获取修改状态
    const statusRaw = await git(project.repo_path, ['status', '--porcelain']).catch(() => '');
    const statusMap: Record<string, string> = {};
    for (const line of statusRaw.split('\n').filter(Boolean)) {
      const code = line.slice(0, 2).trim();
      const filePath = line.slice(3);
      statusMap[filePath] = code;
    }

    // 构建树
    const files = tracked.split('\n').filter(Boolean);
    // 补上未跟踪的新文件
    for (const [fp, code] of Object.entries(statusMap)) {
      if (code === '??' && !files.includes(fp)) files.push(fp);
    }

    interface TreeNode {
      name: string;
      path: string;
      type: 'file' | 'dir';
      status?: string;
      children?: TreeNode[];
    }

    const root: TreeNode = { name: '', path: '', type: 'dir', children: [] };

    for (const fp of files) {
      const parts = fp.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const isFile = i === parts.length - 1;
        const name = parts[i];
        const path = parts.slice(0, i + 1).join('/');

        if (!current.children) current.children = [];
        let child = current.children.find(c => c.name === name);
        if (!child) {
          child = { name, path, type: isFile ? 'file' : 'dir' };
          if (!isFile) child.children = [];
          current.children.push(child);
        }
        if (isFile && statusMap[fp]) {
          child.status = statusMap[fp];
        }
        current = child;
      }
    }

    // 排序：目录在前，文件在后，各自按名称排序
    function sortTree(node: TreeNode) {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    }
    sortTree(root);

    res.json({ tree: root.children || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/file', async (req: AuthRequest, res: Response) => {
  const { project_id, path: filePath } = req.query;
  if (!project_id || !filePath) {
    res.status(400).json({ error: 'project_id and path required' });
    return;
  }

  const project = findProject(project_id);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const absPath = resolve(join(project.repo_path, String(filePath)));
  if (!absPath.startsWith(resolve(project.repo_path))) {
    res.status(403).json({ error: 'Path traversal not allowed' });
    return;
  }

  try {
    const content = readFileSync(absPath, 'utf-8');
    res.json({ content, path: String(filePath) });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.put('/file', (req: AuthRequest, res: Response) => {
  const { project_id, path: filePath, content } = req.body;
  if (!project_id || !filePath || content === undefined) {
    res.status(400).json({ error: 'project_id, path, and content required' });
    return;
  }

  const project = findProject(project_id);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const absPath = resolve(join(project.repo_path, String(filePath)));
  if (!absPath.startsWith(resolve(project.repo_path))) {
    res.status(403).json({ error: 'Path traversal not allowed' });
    return;
  }

  try {
    writeFileSync(absPath, content, 'utf-8');
    res.json({ success: true, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
