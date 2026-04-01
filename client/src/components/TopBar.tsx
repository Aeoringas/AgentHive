import { useState, useRef, useEffect } from 'react';
import type { Project } from '@agenthive/shared';
import Modal, { ModalLabel, ModalInput, ModalText, ModalButton } from './Modal';
import styles from './TopBar.module.css';

interface TopBarProps {
  projects: Project[];
  currentProjectId: string | null;
  onProjectChange: (id: string) => void;
  onCreateProject: (data: { name: string; description: string; repo_path: string }) => void;
  onDeleteProject: (id: string) => void;
  onLogout: () => void;
}

type ModalState = null | 'create' | { type: 'delete'; project: Project };

export default function TopBar({ projects, currentProjectId, onProjectChange, onCreateProject, onDeleteProject, onLogout }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState({ name: '', description: '', repo_path: '' });
  const [confirmName, setConfirmName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = projects.find(p => p.id === currentProjectId);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function closeModal() {
    setModal(null);
    setForm({ name: '', description: '', repo_path: '' });
    setConfirmName('');
  }

  function handleCreate() {
    if (!form.name.trim() || !form.repo_path.trim()) return;
    onCreateProject({ name: form.name.trim(), description: form.description.trim(), repo_path: form.repo_path.trim() });
    closeModal();
  }

  function handleDelete(project: Project) {
    onDeleteProject(project.id);
    closeModal();
  }

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 0L14.93 4v8L8 16L1.07 12V4Z"
              fill="var(--honey-500)"
            />
          </svg>
          <span className={styles.brandText}>AgentHive</span>
        </div>
        <div className={styles.projectSelector} ref={dropdownRef}>
          <button
            className={styles.selectorTrigger}
            onClick={() => setOpen(v => !v)}
          >
            <span>{current?.name ?? '...'}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" className={open ? styles.chevronOpen : undefined}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <div className={styles.dropdown}>
              {projects.map(p => (
                <div key={p.id} className={styles.dropdownRow}>
                  <button
                    className={`${styles.dropdownItem} ${p.id === currentProjectId ? styles.dropdownItemActive : ''}`}
                    onClick={() => { onProjectChange(p.id); setOpen(false); }}
                  >
                    <span>{p.name}</span>
                  </button>
                  <div className={styles.rowAction}>
                    {p.is_source ? (
                      <span className={styles.sourceTag}>源</span>
                    ) : (
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', project: p }); setOpen(false); }}
                        title="删除项目"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12">
                          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => { setModal('create'); setOpen(false); }}
              >
                <span>新建项目...</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <button className={styles.logoutBtn} onClick={onLogout}>
        退出
      </button>

      <Modal
        open={modal === 'create'}
        onClose={closeModal}
        title="新建项目"
        actions={<>
          <ModalButton variant="secondary" onClick={closeModal}>取消</ModalButton>
          <ModalButton variant="primary" disabled={!form.name.trim() || !form.repo_path.trim()} onClick={handleCreate}>创建</ModalButton>
        </>}
      >
        <ModalLabel>项目名称</ModalLabel>
        <ModalInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：MyApp" autoFocus />
        <ModalLabel>仓库路径</ModalLabel>
        <ModalInput value={form.repo_path} onChange={e => setForm(f => ({ ...f, repo_path: e.target.value }))} placeholder="例如：/home/user/projects/my-app" />
        <ModalLabel>描述（可选）</ModalLabel>
        <ModalInput value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="简要描述项目" />
      </Modal>

      {modal && typeof modal === 'object' && (
        <Modal
          open
          onClose={closeModal}
          title="删除项目"
          actions={<>
            <ModalButton variant="secondary" onClick={closeModal}>取消</ModalButton>
            <ModalButton variant="primary" disabled={confirmName !== modal.project.name} onClick={() => handleDelete(modal.project)}>确认删除</ModalButton>
          </>}
        >
          <ModalText>此操作将永久删除项目 <strong>{modal.project.name}</strong> 及其所有数据，不可恢复。</ModalText>
          <ModalLabel>输入项目名称确认</ModalLabel>
          <ModalInput value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder={modal.project.name} autoFocus />
        </Modal>
      )}
    </header>
  );
}
