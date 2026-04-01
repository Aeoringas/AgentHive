import { Router, Response } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
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

export default router;
