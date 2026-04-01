import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheCreation: number }> = {
  'claude-opus-4-6': { input: 5, output: 25, cacheRead: 0.50, cacheCreation: 6.25 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.30, cacheCreation: 3.75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5, cacheRead: 0.10, cacheCreation: 1.25 },
};

function getDefaultPricing() {
  return PRICING['claude-sonnet-4-6'];
}

function calcCost(model: string, input: number, output: number, cacheRead: number, cacheCreation: number): number {
  const p = PRICING[model] || getDefaultPricing();
  return (input * p.input + output * p.output + cacheRead * p.cacheRead + cacheCreation * p.cacheCreation) / 1_000_000;
}

interface TokenCounts {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

function zeroCounts(): TokenCounts {
  return { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
}

function addCounts(a: TokenCounts, b: TokenCounts): TokenCounts {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheCreation: a.cacheCreation + b.cacheCreation,
  };
}

function parseJSONL(filePath: string): any[] {
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    const records: any[] = [];
    for (const line of lines) {
      try { records.push(JSON.parse(line)); } catch {}
    }
    return records;
  } catch {
    return [];
  }
}

function extractCwd(dirPath: string): string | null {
  try {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    if (files.length === 0) return null;
    const first = fs.readFileSync(path.join(dirPath, files[0]), 'utf-8').split('\n', 5);
    for (const line of first) {
      try {
        const r = JSON.parse(line);
        if (r.cwd) return r.cwd;
      } catch {}
    }
  } catch {}
  return null;
}

function computeOverview() {
  const dailyMap: Record<string, Record<string, TokenCounts>> = {};
  const hourlyMap: Record<string, Record<string, TokenCounts>> = {};
  const projectMap: Record<string, { tokens: TokenCounts; models: Set<string>; lastActivity: string; sessionCount: number }> = {};

  const hourlyStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const windowStart = new Date(Date.now() - 5 * 60 * 60 * 1000);
  let windowTokens: TokenCounts = zeroCounts();
  let windowCost = 0;
  let windowEntries = 0;
  const windowModels = new Set<string>();
  let windowFirstTs: string | null = null;
  let windowLastTs: string | null = null;

  let totalSessions = 0;
  let totalMessages = 0;

  let dirs: string[];
  try {
    dirs = fs.readdirSync(PROJECTS_DIR);
  } catch {
    return { daily: [], hourly: [], block: null, projects: [], totals: { cost: 0, tokens: zeroCounts(), sessions: 0, messages: 0 } };
  }

  for (const dir of dirs) {
    const dirPath = path.join(PROJECTS_DIR, dir);
    try {
      if (!fs.statSync(dirPath).isDirectory()) continue;
    } catch { continue; }

    const jsonlFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    let dirSessionCount = 0;

    for (const jf of jsonlFiles) {
      const records = parseJSONL(path.join(dirPath, jf));
      dirSessionCount++;
      totalSessions++;

      for (const r of records) {
        if (r.type === 'user' || r.type === 'assistant') totalMessages++;
        if (r.type !== 'assistant' || !r.message?.usage) continue;
        const ts = r.timestamp;
        if (!ts) continue;

        const u = r.message.usage;
        const model = r.message.model || 'unknown';
        const input = u.input_tokens || 0;
        const output = u.output_tokens || 0;
        const cacheRead = u.cache_read_input_tokens || 0;
        const cacheCreation = u.cache_creation_input_tokens || 0;
        const counts: TokenCounts = { input, output, cacheRead, cacheCreation };
        const cost = calcCost(model, input, output, cacheRead, cacheCreation);

        // daily by model
        const dateKey = ts.split('T')[0];
        if (!dailyMap[dateKey]) dailyMap[dateKey] = {};
        if (!dailyMap[dateKey][model]) dailyMap[dateKey][model] = zeroCounts();
        dailyMap[dateKey][model] = addCounts(dailyMap[dateKey][model], counts);

        // hourly by model (48h only)
        if (new Date(ts) >= hourlyStart) {
          const hourKey = ts.slice(0, 13);
          if (!hourlyMap[hourKey]) hourlyMap[hourKey] = {};
          if (!hourlyMap[hourKey][model]) hourlyMap[hourKey][model] = zeroCounts();
          hourlyMap[hourKey][model] = addCounts(hourlyMap[hourKey][model], counts);
        }

        // project
        if (!projectMap[dir]) projectMap[dir] = { tokens: zeroCounts(), models: new Set(), lastActivity: ts, sessionCount: 0 };
        const pp = projectMap[dir];
        pp.tokens = addCounts(pp.tokens, counts);
        pp.models.add(model);
        if (ts > pp.lastActivity) pp.lastActivity = ts;

        // 5h window
        if (new Date(ts) >= windowStart) {
          windowTokens = addCounts(windowTokens, counts);
          windowCost += cost;
          windowEntries++;
          windowModels.add(model);
          if (!windowFirstTs || ts < windowFirstTs) windowFirstTs = ts;
          if (!windowLastTs || ts > windowLastTs) windowLastTs = ts;
        }
      }
    }

    if (projectMap[dir]) projectMap[dir].sessionCount = dirSessionCount;
  }

  // daily array with per-model breakdown
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, byModel]) => ({
      date,
      tokensByModel: byModel,
    }));

  // hourly array (last 48h)
  const hourly = Object.entries(hourlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, byModel]) => ({
      hour,
      tokensByModel: byModel,
    }));

  // projects
  const projects = Object.entries(projectMap)
    .map(([id, p]) => {
      const projectPath = extractCwd(path.join(PROJECTS_DIR, id)) || id;
      const t = p.tokens;
      return {
        id,
        name: projectPath.split('/').filter(Boolean).pop() || id,
        path: projectPath,
        totalTokens: t.input + t.output + t.cacheRead + t.cacheCreation,
        totalCost: [...p.models].reduce((sum, model) => sum, 0) || calcCostFromCounts(p.tokens),
        tokens: p.tokens,
        modelsUsed: [...p.models],
        lastActivity: p.lastActivity,
        sessionCount: p.sessionCount,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  // active block
  let block = null;
  if (windowEntries > 0 && windowFirstTs && windowLastTs) {
    const elapsedMs = new Date(windowLastTs).getTime() - new Date(windowFirstTs).getTime();
    const elapsedMin = Math.max(elapsedMs / 60000, 1);
    const remainingMin = Math.max((new Date(windowFirstTs).getTime() + 5 * 3600000 - Date.now()) / 60000, 0);
    const costPerHour = (windowCost / elapsedMin) * 60;
    block = {
      startTime: windowFirstTs,
      endTime: new Date(new Date(windowFirstTs).getTime() + 5 * 3600000).toISOString(),
      isActive: true,
      entries: windowEntries,
      totalTokens: windowTokens.input + windowTokens.output + windowTokens.cacheRead + windowTokens.cacheCreation,
      tokens: windowTokens,
      costUSD: windowCost,
      models: [...windowModels],
      burnRate: { costPerHour },
      projection: {
        totalCost: Math.round((windowCost + costPerHour * (remainingMin / 60)) * 100) / 100,
        remainingMinutes: Math.round(remainingMin),
      },
    };
  }

  // totals
  const allTokens = daily.reduce((acc, d) => {
    let sum = zeroCounts();
    for (const c of Object.values(d.tokensByModel)) sum = addCounts(sum, c);
    return addCounts(acc, sum);
  }, zeroCounts());

  const totalCost = daily.reduce((sum, d) => {
    let c = 0;
    for (const [model, counts] of Object.entries(d.tokensByModel)) {
      c += calcCost(model, counts.input, counts.output, counts.cacheRead, counts.cacheCreation);
    }
    return sum + c;
  }, 0);

  return {
    daily,
    hourly,
    block,
    projects,
    totals: { cost: totalCost, tokens: allTokens, sessions: totalSessions, messages: totalMessages },
  };
}

function calcCostFromCounts(t: TokenCounts): number {
  return calcCost('claude-opus-4-6', t.input, t.output, t.cacheRead, t.cacheCreation);
}

const CACHE_TTL = 60_000;
let cache: { data: any; ts: number } | null = null;

function getOverview() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  const data = computeOverview();
  cache = { data, ts: Date.now() };
  return data;
}

try { getOverview(); } catch {}

router.get('/overview', (_req: AuthRequest, res: Response) => {
  try {
    const data = getOverview();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
