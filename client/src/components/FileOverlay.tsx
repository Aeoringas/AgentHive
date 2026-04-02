import { useState, useEffect, useCallback } from 'react';
import Overlay from './Overlay';
import styles from './FileOverlay.module.css';

interface FileOverlayProps {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  status?: string;
  children?: TreeNode[];
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function statusLabel(status?: string): { text: string; cls: string } | null {
  if (!status) return null;
  if (status === '??') return { text: 'U', cls: styles.statusNew };
  if (status.includes('M')) return { text: 'M', cls: styles.statusMod };
  if (status.includes('A')) return { text: 'A', cls: styles.statusNew };
  if (status.includes('D')) return { text: 'D', cls: styles.statusDel };
  if (status.includes('R')) return { text: 'R', cls: styles.statusMod };
  return { text: status, cls: styles.statusMod };
}

function extToLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', html: 'html', md: 'markdown',
    sql: 'sql', sh: 'shell', py: 'python', rs: 'rust', go: 'go',
  };
  return map[ext] || '';
}

function TreeItem({
  node,
  depth,
  selectedPath,
  expandedDirs,
  onToggleDir,
  onSelectFile,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
  const isDir = node.type === 'dir';
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedPath === node.path;
  const st = statusLabel(node.status);

  return (
    <>
      <button
        className={`${styles.treeItem} ${isSelected ? styles.treeItemActive : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => isDir ? onToggleDir(node.path) : onSelectFile(node.path)}
      >
        <span className={styles.treeIcon}>{isDir ? (isExpanded ? '\u25BE' : '\u25B8') : ' '}</span>
        <span className={styles.treeName}>{node.name}</span>
        {st && <span className={`${styles.statusBadge} ${st.cls}`}>{st.text}</span>}
      </button>
      {isDir && isExpanded && node.children?.map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          onSelectFile={onSelectFile}
        />
      ))}
    </>
  );
}

export default function FileOverlay({ visible, onClose, projectId }: FileOverlayProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTree = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/git/tree?project_id=${projectId}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setTree(data.tree ?? []);
        // 默认展开第一级目录
        const firstLevel = new Set<string>();
        for (const node of (data.tree ?? [])) {
          if (node.type === 'dir') firstLevel.add(node.path);
        }
        setExpandedDirs(firstLevel);
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (visible && projectId) {
      fetchTree();
      setSelectedPath(null);
      setFileContent(null);
    }
  }, [visible, projectId, fetchTree]);

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedPath(path);
    setFileLoading(true);
    setFileContent(null);
    fetch(`/api/git/file?project_id=${projectId}&path=${encodeURIComponent(path)}`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => {
        setFileContent(data.content ?? '');
        setOriginalContent(data.content ?? '');
      })
      .catch(() => { setFileContent('(无法读取文件)'); setOriginalContent(null); })
      .finally(() => setFileLoading(false));
  }, [projectId]);

  const isDirty = fileContent !== null && originalContent !== null && fileContent !== originalContent;

  const handleSave = useCallback(() => {
    if (!projectId || !selectedPath || fileContent === null) return;
    setSaving(true);
    fetch('/api/git/file', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, path: selectedPath, content: fileContent }),
    })
      .then(r => r.json())
      .then(() => setOriginalContent(fileContent))
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [projectId, selectedPath, fileContent]);

  return (
    <Overlay visible={visible} onClose={onClose} title="文件浏览">
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          {loading && <div className={styles.empty}>加载中...</div>}
          {!loading && tree.length === 0 && <div className={styles.empty}>暂无文件</div>}
          {!loading && tree.map(node => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expandedDirs={expandedDirs}
              onToggleDir={handleToggleDir}
              onSelectFile={handleSelectFile}
            />
          ))}
        </div>
        <div className={styles.content}>
          {!selectedPath && <div className={styles.placeholder}>选择文件查看内容</div>}
          {selectedPath && fileLoading && <div className={styles.placeholder}>加载中...</div>}
          {selectedPath && !fileLoading && fileContent !== null && (
            <>
              <div className={styles.fileHeader}>
                <span className={styles.filePath}>{selectedPath}</span>
                <button
                  className={`${styles.saveBtn} ${isDirty ? styles.saveBtnActive : ''}`}
                  disabled={!isDirty || saving}
                  onClick={handleSave}
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
              <textarea
                className={styles.editor}
                value={fileContent}
                onChange={e => setFileContent(e.target.value)}
                spellCheck={false}
              />
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
