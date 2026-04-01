import { useState, useEffect, useCallback, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import Overlay from './Overlay';
import styles from './UsageOverlay.module.css';

Chart.register(...registerables);

interface UsageOverlayProps {
  visible: boolean;
  onClose: () => void;
}

interface TokenCounts {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

interface DailyEntry {
  date: string;
  tokensByModel: Record<string, TokenCounts>;
}

interface HourlyEntry {
  hour: string;
  tokensByModel: Record<string, TokenCounts>;
}

interface ProjectEntry {
  id: string;
  name: string;
  path: string;
  totalTokens: number;
  totalCost: number;
  tokens: TokenCounts;
  modelsUsed: string[];
  sessionCount: number;
}

interface ActiveBlock {
  entries: number;
  totalTokens: number;
  tokens: TokenCounts;
  costUSD: number;
  models: string[];
  burnRate: { costPerHour: number };
  projection: { totalCost: number; remainingMinutes: number };
}

interface OverviewData {
  daily: DailyEntry[];
  hourly: HourlyEntry[];
  block: ActiveBlock | null;
  projects: ProjectEntry[];
  totals: { cost: number; tokens: TokenCounts; sessions: number; messages: number };
}

const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheCreation: number }> = {
  'claude-opus-4-6': { input: 5, output: 25, cacheRead: 0.50, cacheCreation: 6.25 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.30, cacheCreation: 3.75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5, cacheRead: 0.10, cacheCreation: 1.25 },
};

function getModelPricing(model: string) {
  return PRICING[model] || PRICING['claude-sonnet-4-6'];
}

function calcCostForModel(model: string, c: TokenCounts): number {
  const p = getModelPricing(model);
  return (c.input * p.input + c.output * p.output + c.cacheRead * p.cacheRead + c.cacheCreation * p.cacheCreation) / 1_000_000;
}

function calcDayCost(entry: DailyEntry): number {
  let cost = 0;
  for (const [model, counts] of Object.entries(entry.tokensByModel)) {
    cost += calcCostForModel(model, counts);
  }
  return cost;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatCost(v: number): string {
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function sumCounts(byModel: Record<string, TokenCounts>): TokenCounts {
  let r = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  for (const c of Object.values(byModel)) {
    r.input += c.input; r.output += c.output; r.cacheRead += c.cacheRead; r.cacheCreation += c.cacheCreation;
  }
  return r;
}

// Chart.js 暖色配置
const CHART_COLORS = {
  input: { bg: 'rgba(245, 158, 11, 0.5)', border: '#F59E0B' },
  output: { bg: 'rgba(101, 163, 13, 0.5)', border: '#65A30D' },
  cacheRead: { bg: 'rgba(168, 85, 247, 0.3)', border: '#A855F7' },
  cacheCreation: { bg: 'rgba(212, 184, 150, 0.3)', border: '#D4B896' },
  cost: { bg: 'rgba(245, 158, 11, 0.4)', border: '#D97706' },
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { labels: { color: 'var(--text-secondary)', font: { size: 11 } } }, tooltip: { mode: 'index' as const, intersect: false } },
  scales: {
    x: { ticks: { color: '#7A6B4E', font: { size: 10 } }, grid: { color: 'rgba(201,176,122,0.1)' } },
    y: { ticks: { color: '#7A6B4E', font: { size: 10 } }, grid: { color: 'rgba(201,176,122,0.1)' } },
  },
};

function useChart(render: (ctx: HTMLCanvasElement) => Chart | null, deps: any[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = render(canvasRef.current);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, deps);

  return canvasRef;
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  while (d <= e) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function DailyCostChart({ data }: { data: DailyEntry[] }) {
  const ref = useChart((ctx) => {
    if (data.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    const dates = generateDateRange(data[0].date, today);
    const map: Record<string, DailyEntry> = {};
    for (const d of data) map[d.date] = d;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates.map(d => d.slice(5)),
        datasets: [{
          label: '费用 ($)',
          data: dates.map(d => map[d] ? calcDayCost(map[d]) : 0),
          backgroundColor: CHART_COLORS.cost.bg,
          borderColor: CHART_COLORS.cost.border,
          borderWidth: 1,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { legend: { display: false } },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => '$' + Number(v).toFixed(0) } },
        },
      },
    });
  }, [data]);

  if (data.length === 0) return <div className={styles.noData}>暂无数据</div>;
  return <div className={styles.chartWrap}><canvas ref={ref} /></div>;
}

function DailyTokenChart({ data }: { data: DailyEntry[] }) {
  const ref = useChart((ctx) => {
    if (data.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    const dates = generateDateRange(data[0].date, today);
    const map: Record<string, DailyEntry> = {};
    for (const d of data) map[d.date] = d;
    const get = (d: string) => map[d] ? sumCounts(map[d].tokensByModel) : { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates.map(d => d.slice(5)),
        datasets: [
          { label: '输入', data: dates.map(d => get(d).input), ...CHART_COLORS.input, borderWidth: 1 },
          { label: '输出', data: dates.map(d => get(d).output), backgroundColor: CHART_COLORS.output.bg, borderColor: CHART_COLORS.output.border, borderWidth: 1 },
          { label: '缓存读取', data: dates.map(d => get(d).cacheRead), backgroundColor: CHART_COLORS.cacheRead.bg, borderColor: CHART_COLORS.cacheRead.border, borderWidth: 1 },
          { label: '缓存创建', data: dates.map(d => get(d).cacheCreation), backgroundColor: CHART_COLORS.cacheCreation.bg, borderColor: CHART_COLORS.cacheCreation.border, borderWidth: 1 },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          x: { ...CHART_DEFAULTS.scales.x, stacked: true },
          y: { ...CHART_DEFAULTS.scales.y, stacked: true, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => formatTokens(Number(v)) } },
        },
      },
    });
  }, [data]);

  if (data.length === 0) return <div className={styles.noData}>暂无数据</div>;
  return <div className={styles.chartWrap}><canvas ref={ref} /></div>;
}

function generateLast48Hours(): string[] {
  const hours: string[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let i = 47; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000);
    hours.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0'));
  }
  return hours;
}

function formatHourLabel(hourKey: string): string {
  const [datePart, hourPart] = hourKey.split('T');
  return datePart.slice(5) + ' ' + hourPart + ':00';
}

function HourlyCostChart({ data }: { data: HourlyEntry[] }) {
  const ref = useChart((ctx) => {
    const hours = generateLast48Hours();
    const map: Record<string, HourlyEntry> = {};
    for (const h of data) map[h.hour] = h;

    const costs = hours.map(h => {
      const entry = map[h];
      if (!entry) return 0;
      let c = 0;
      for (const [model, counts] of Object.entries(entry.tokensByModel)) c += calcCostForModel(model, counts);
      return c;
    });

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours.map(formatHourLabel),
        datasets: [{ label: '费用 ($)', data: costs, backgroundColor: CHART_COLORS.cost.bg, borderColor: CHART_COLORS.cost.border, borderWidth: 1 }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { legend: { display: false } },
        scales: {
          x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45, autoSkip: true, maxTicksLimit: 24 } },
          y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => '$' + Number(v).toFixed(2) } },
        },
      },
    });
  }, [data]);

  return <div className={styles.chartWrap}><canvas ref={ref} /></div>;
}

function OverviewCards({ data }: { data: OverviewData }) {
  const { block, totals, daily } = data;
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = daily.find(d => d.date === today);
  const todayCost = todayEntry ? calcDayCost(todayEntry) : 0;
  const todayTokens = todayEntry ? sumCounts(todayEntry.tokensByModel) : null;

  return (
    <div className={styles.cards}>
      <div className={styles.card}>
        <div className={styles.cardLabel}>总费用</div>
        <div className={styles.cardValue}>{formatCost(totals.cost)}</div>
        <div className={styles.cardSub}>
          入 {formatTokens(totals.tokens.input)} | 出 {formatTokens(totals.tokens.output)} | 缓存 {formatTokens(totals.tokens.cacheRead + totals.tokens.cacheCreation)}
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>今日费用</div>
        <div className={styles.cardValue}>{formatCost(todayCost)}</div>
        <div className={styles.cardSub}>
          {todayTokens ? `入 ${formatTokens(todayTokens.input)} | 出 ${formatTokens(todayTokens.output)}` : '暂无数据'}
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>5h 窗口</div>
        <div className={styles.cardValue}>{block ? formatCost(block.costUSD) : '-'}</div>
        <div className={styles.cardSub}>
          {block ? `剩余 ${formatMinutes(block.projection.remainingMinutes)} | ${formatCost(block.burnRate.costPerHour)}/h` : '无活跃窗口'}
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>总会话</div>
        <div className={styles.cardValue}>{totals.sessions}</div>
        <div className={styles.cardSub}>{data.projects.length} 个项目 | {formatTokens(totals.messages)} 条消息</div>
      </div>
    </div>
  );
}

function ProjectTable({ data }: { data: ProjectEntry[] }) {
  if (data.length === 0) return <div className={styles.noData}>暂无项目数据</div>;
  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <span className={styles.colProject}>项目</span>
        <span className={styles.colSessions}>会话</span>
        <span className={styles.colTokens}>Tokens</span>
        <span className={styles.colCost}>费用</span>
      </div>
      <div className={styles.tableBody}>
        {data.map(p => (
          <div key={p.id} className={styles.tableRow} title={p.path}>
            <span className={styles.colProject}>{p.name}</span>
            <span className={styles.colSessions}>{p.sessionCount}</span>
            <span className={styles.colTokens}>{formatTokens(p.totalTokens)}</span>
            <span className={styles.colCost}>{formatCost(p.totalCost)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UsageOverlay({ visible, onClose }: UsageOverlayProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/usage/overview', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { setData(d); setLoaded(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) fetchData();
  }, [visible, fetchData]);

  return (
    <Overlay visible={visible} onClose={onClose} title="Token 用量统计">
      <div className={styles.content}>
        {!loaded && <div className={styles.loading}>加载中...</div>}
        {loaded && data && (
          <>
            <OverviewCards data={data} />
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>每日费用趋势</h3>
              <DailyCostChart data={data.daily} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>每日 Token 消耗</h3>
              <DailyTokenChart data={data.daily} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>每小时费用趋势</h3>
              <HourlyCostChart data={data.hourly} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>按项目排行</h3>
              <ProjectTable data={data.projects} />
            </section>
          </>
        )}
      </div>
    </Overlay>
  );
}
