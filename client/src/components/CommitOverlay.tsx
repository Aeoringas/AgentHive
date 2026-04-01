import { useState, useEffect, useCallback, useMemo } from 'react';
import Overlay from './Overlay';
import styles from './CommitOverlay.module.css';

interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
  body: string;
}

interface FileStat {
  path: string;
  additions: number;
  deletions: number;
}

interface CommitDetail {
  commit: Commit;
  files: FileStat[];
  patch: string;
}

interface CommitOverlayProps {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function splitPatchByFile(patch: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = patch.split(/^diff --git /m).filter(Boolean);
  for (const part of parts) {
    const firstLine = part.split('\n')[0];
    const match = firstLine.match(/b\/(.+)$/);
    if (match) {
      result[match[1]] = 'diff --git ' + part;
    }
  }
  return result;
}

function classForLine(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) return styles.diffMeta;
  if (line.startsWith('+')) return styles.diffAdd;
  if (line.startsWith('-')) return styles.diffDel;
  if (line.startsWith('@@')) return styles.diffHunk;
  if (line.startsWith('diff ') || line.startsWith('index ')) return styles.diffMeta;
  return styles.diffCtx;
}

function DiffView({ patch }: { patch: string }) {
  const lines = patch.split('\n');
  return (
    <pre className={styles.patchContent}>
      {lines.map((line, i) => (
        <div key={i} className={classForLine(line)}>{line || '\n'}</div>
      ))}
    </pre>
  );
}

function DetailPanel({ detail, loading }: { detail: CommitDetail | null; loading: boolean }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileDiffs = useMemo(() => {
    if (!detail) return {};
    return splitPatchByFile(detail.patch);
  }, [detail]);

  useEffect(() => {
    if (detail && detail.files.length > 0) {
      setSelectedFile(detail.files[0].path);
    } else {
      setSelectedFile(null);
    }
  }, [detail]);

  if (loading) {
    return <div className={styles.detailEmpty}>加载中...</div>;
  }
  if (!detail) {
    return <div className={styles.detailEmpty}>选择一个提交查看详情</div>;
  }

  const { commit, files } = detail;
  const totalAdd = files.reduce((s, f) => s + f.additions, 0);
  const totalDel = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className={styles.detail}>
      <div className={styles.summary}>
        <div className={styles.summarySubject}>{commit.subject}</div>
        {commit.body && <div className={styles.summaryBody}>{commit.body}</div>}
        <div className={styles.summaryMeta}>
          <span className={styles.summaryHash}>{commit.hash.slice(0, 10)}</span>
          <span>{commit.author}</span>
          <span>{formatDate(commit.date)}</span>
          <span>{files.length} 个文件</span>
          {totalAdd > 0 && <span className={styles.statAdd}>+{totalAdd}</span>}
          {totalDel > 0 && <span className={styles.statDel}>-{totalDel}</span>}
        </div>
      </div>

      <div className={styles.changeArea}>
        <div className={styles.fileList}>
          {files.map((f) => (
            <button
              key={f.path}
              className={`${styles.fileRow}${selectedFile === f.path ? ` ${styles.fileRowActive}` : ''}`}
              onClick={() => setSelectedFile(f.path)}
            >
              <span className={styles.filePath}>{f.path}</span>
              <span className={styles.fileStats}>
                {f.additions > 0 && <span className={styles.statAdd}>+{f.additions}</span>}
                {f.deletions > 0 && <span className={styles.statDel}>-{f.deletions}</span>}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.diffPane}>
          {selectedFile && fileDiffs[selectedFile] ? (
            <DiffView patch={fileDiffs[selectedFile]} />
          ) : (
            <div className={styles.diffEmpty}>选择文件查看变动</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommitOverlay({ visible, onClose, projectId }: CommitOverlayProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [detail, setDetail] = useState<CommitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCommits = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({ project_id: projectId });
    if (search) params.set('search', search);
    fetch(`/api/git/commits?${params}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setCommits(data.commits ?? []))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, [projectId, search]);

  useEffect(() => {
    if (visible && projectId) {
      fetchCommits();
      setSelectedHash(null);
      setDetail(null);
    }
  }, [visible, projectId]);

  useEffect(() => {
    if (!selectedHash || !projectId) return;
    setDetailLoading(true);
    fetch(`/api/git/commits/${selectedHash}?project_id=${projectId}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedHash, projectId]);

  return (
    <Overlay visible={visible} onClose={onClose} title="Git 提交记录">
      <div className={styles.layout}>
        <div className={styles.left}>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="搜索提交信息..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCommits()}
            />
          </div>
          <div className={styles.list}>
            {loading && commits.length === 0 && (
              <div className={styles.empty}>加载中...</div>
            )}
            {!loading && commits.length === 0 && (
              <div className={styles.empty}>暂无提交记录</div>
            )}
            {commits.map((c) => (
              <button
                key={c.hash}
                className={`${styles.commitItem}${selectedHash === c.hash ? ` ${styles.commitItemActive}` : ''}`}
                onClick={() => setSelectedHash(c.hash)}
              >
                <div className={styles.commitSubject}>{c.subject}</div>
                <div className={styles.commitMeta}>
                  <span className={styles.commitHash}>{c.hash.slice(0, 7)}</span>
                  <span>{c.author}</span>
                  <span>{formatShortDate(c.date)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.right}>
          <DetailPanel detail={detail} loading={detailLoading} />
        </div>
      </div>
    </Overlay>
  );
}
