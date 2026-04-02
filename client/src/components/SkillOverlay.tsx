import { useState, useEffect, useCallback } from 'react';
import Overlay from './Overlay';
import styles from './SkillOverlay.module.css';

interface SkillOverlayProps {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
}

interface SkillMeta {
  name: string;
  description: string;
  category: string;
  inject_target: string;
  inject_scene: string;
}

interface SkillFile {
  filename: string;
  meta: SkillMeta;
  content: string;
}

interface SimpleFile {
  filename: string;
  content: string;
}

type TabKey = 'skills' | 'rules' | 'hooks';

const CATEGORIES = [
  '\u89c4\u5212\u57df', '\u5f00\u53d1\u57df', '\u8d28\u91cf\u57df',
  '\u5de5\u7a0b\u57df', '\u4ea4\u4e92\u57df', '\u6cbb\u7406\u57df', '\u5de5\u5177\u57df',
];

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function groupByCategory(skills: SkillFile[]): Record<string, SkillFile[]> {
  const groups: Record<string, SkillFile[]> = {};
  for (const s of skills) {
    const cat = s.meta.category || '\u672a\u5206\u7c7b';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  }
  return groups;
}

// -- Skill 编辑器 --
function SkillEditor({ skill, projectId, onSaved, onDeleted }: {
  skill: SkillFile; projectId: string; onSaved: () => void; onDeleted: () => void;
}) {
  const [meta, setMeta] = useState(skill.meta);
  const [content, setContent] = useState(skill.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMeta(skill.meta); setContent(skill.content); }, [skill.filename]);

  const handleSave = () => {
    setSaving(true);
    fetch(`/api/skills/${encodeURIComponent(skill.filename)}`, {
      method: 'PUT', headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, meta, content }),
    }).then(() => onSaved()).catch(() => {}).finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!confirm(`删除 ${meta.name || skill.filename}?`)) return;
    fetch(`/api/skills/${encodeURIComponent(skill.filename)}?project_id=${projectId}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    }).then(() => onDeleted()).catch(() => {});
  };

  const set = (k: string, v: string) => setMeta(p => ({ ...p, [k]: v }));

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <span className={styles.editorFilename}>{skill.filename}</span>
        <div className={styles.editorActions}>
          <button className={styles.deleteBtn} onClick={handleDelete}>删除</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      <div className={styles.metaSection}>
        <div className={styles.metaGrid}>
          <label className={styles.field}>名称<input value={meta.name} onChange={e => set('name', e.target.value)} /></label>
          <label className={styles.field}>能力域
            <select value={meta.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className={styles.field}>注入对象<input value={meta.inject_target} onChange={e => set('inject_target', e.target.value)} /></label>
          <label className={styles.field}>注入场景<input value={meta.inject_scene} onChange={e => set('inject_scene', e.target.value)} /></label>
        </div>
        <label className={styles.fieldFull}>描述<input value={meta.description} onChange={e => set('description', e.target.value)} /></label>
      </div>
      <textarea className={styles.contentEditor} value={content} onChange={e => setContent(e.target.value)} spellCheck={false} />
    </div>
  );
}

// -- 简单文件编辑器（Rules / Hooks） --
function SimpleEditor({ file, apiBase, projectId, onSaved, onDeleted }: {
  file: SimpleFile; apiBase: string; projectId: string; onSaved: () => void; onDeleted: () => void;
}) {
  const [content, setContent] = useState(file.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setContent(file.content); }, [file.filename]);

  const handleSave = () => {
    setSaving(true);
    fetch(`${apiBase}/${encodeURIComponent(file.filename)}`, {
      method: 'PUT', headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, content }),
    }).then(() => onSaved()).catch(() => {}).finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!confirm(`删除 ${file.filename}?`)) return;
    fetch(`${apiBase}/${encodeURIComponent(file.filename)}?project_id=${projectId}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    }).then(() => onDeleted()).catch(() => {});
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <span className={styles.editorFilename}>{file.filename}</span>
        <div className={styles.editorActions}>
          <button className={styles.deleteBtn} onClick={handleDelete}>删除</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      <textarea className={styles.contentEditor} value={content} onChange={e => setContent(e.target.value)} spellCheck={false} />
    </div>
  );
}

// -- Skills Tab --
function SkillsTab({ skills, projectId, onRefresh }: {
  skills: SkillFile[]; projectId: string; onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const groups = groupByCategory(skills);
  const current = skills.find(s => s.filename === selected) || null;

  const handleNew = () => {
    const name = prompt('新 Skill 文件名（如 dev-my-skill.md）');
    if (!name) return;
    const filename = name.endsWith('.md') ? name : name + '.md';
    fetch(`/api/skills/${encodeURIComponent(filename)}`, {
      method: 'PUT', headers: getAuthHeaders(),
      body: JSON.stringify({
        project_id: projectId,
        meta: { name: '', description: '', category: '\u5f00\u53d1\u57df', inject_target: '', inject_scene: '' },
        content: '\n# 新 Skill\n\n',
      }),
    }).then(() => { onRefresh(); setSelected(filename); }).catch(() => {});
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.listPane}>
        {skills.length === 0 && <div className={styles.empty}>暂无 Skill</div>}
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} className={styles.group}>
            <div className={styles.groupTitle}>{cat} ({items.length})</div>
            {items.map(s => (
              <button key={s.filename}
                className={`${styles.listItem} ${selected === s.filename ? styles.listItemActive : ''}`}
                onClick={() => setSelected(s.filename)}>
                <div className={styles.itemName}>{s.meta.name || s.filename}</div>
                <div className={styles.itemDesc}>{s.meta.description}</div>
              </button>
            ))}
          </div>
        ))}
        <button className={styles.newBtn} onClick={handleNew}>+ 新增 Skill</button>
      </div>
      <div className={styles.editPane}>
        {!current && <div className={styles.placeholder}>选择 Skill 查看或编辑</div>}
        {current && <SkillEditor skill={current} projectId={projectId} onSaved={onRefresh} onDeleted={() => { setSelected(null); onRefresh(); }} />}
      </div>
    </div>
  );
}

// -- Rules / Hooks Tab --
function SimpleTab({ files, apiBase, projectId, ext, label, onRefresh }: {
  files: SimpleFile[]; apiBase: string; projectId: string; ext: string; label: string; onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = files.find(f => f.filename === selected) || null;

  const handleNew = () => {
    const name = prompt(`新${label}文件名（如 my-rule${ext}）`);
    if (!name) return;
    const filename = name.endsWith(ext) ? name : name + ext;
    fetch(`${apiBase}/${encodeURIComponent(filename)}`, {
      method: 'PUT', headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, content: '' }),
    }).then(() => { onRefresh(); setSelected(filename); }).catch(() => {});
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.listPane}>
        {files.length === 0 && <div className={styles.empty}>暂无{label}</div>}
        {files.map(f => (
          <button key={f.filename}
            className={`${styles.listItem} ${selected === f.filename ? styles.listItemActive : ''}`}
            onClick={() => setSelected(f.filename)}>
            <div className={styles.itemName}>{f.filename}</div>
          </button>
        ))}
        <button className={styles.newBtn} onClick={handleNew}>+ 新增{label}</button>
      </div>
      <div className={styles.editPane}>
        {!current && <div className={styles.placeholder}>选择{label}查看或编辑</div>}
        {current && <SimpleEditor file={current} apiBase={apiBase} projectId={projectId} onSaved={onRefresh} onDeleted={() => { setSelected(null); onRefresh(); }} />}
      </div>
    </div>
  );
}

// -- 主组件 --
export default function SkillOverlay({ visible, onClose, projectId }: SkillOverlayProps) {
  const [tab, setTab] = useState<TabKey>('skills');
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [rules, setRules] = useState<SimpleFile[]>([]);
  const [hooks, setHooks] = useState<SimpleFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/skills?project_id=${projectId}`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`/api/skills/rules/list?project_id=${projectId}`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`/api/skills/hooks/list?project_id=${projectId}`, { headers: getAuthHeaders() }).then(r => r.json()),
    ])
      .then(([s, r, h]) => {
        setSkills(s.skills ?? []);
        setRules(r.rules ?? []);
        setHooks(h.hooks ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (visible && projectId) fetchAll();
  }, [visible, projectId, fetchAll]);

  return (
    <Overlay visible={visible} onClose={onClose} title="治理配置">
      <div className={styles.layout}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'skills' ? styles.tabActive : ''}`} onClick={() => setTab('skills')}>
            Skills ({skills.length})
          </button>
          <button className={`${styles.tab} ${tab === 'rules' ? styles.tabActive : ''}`} onClick={() => setTab('rules')}>
            Rules ({rules.length})
          </button>
          <button className={`${styles.tab} ${tab === 'hooks' ? styles.tabActive : ''}`} onClick={() => setTab('hooks')}>
            Hooks ({hooks.length})
          </button>
        </div>
        {loading && <div className={styles.placeholder}>加载中...</div>}
        {!loading && projectId && tab === 'skills' && (
          <SkillsTab skills={skills} projectId={projectId} onRefresh={fetchAll} />
        )}
        {!loading && projectId && tab === 'rules' && (
          <SimpleTab files={rules} apiBase="/api/skills/rules" projectId={projectId} ext=".md" label="Rule" onRefresh={fetchAll} />
        )}
        {!loading && projectId && tab === 'hooks' && (
          <SimpleTab files={hooks} apiBase="/api/skills/hooks" projectId={projectId} ext=".sh" label="Hook" onRefresh={fetchAll} />
        )}
      </div>
    </Overlay>
  );
}
