import { useState, useEffect, useCallback } from 'react';
import Overlay from './Overlay';
import styles from './SettingsOverlay.module.css';

interface SettingsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

interface GeneralSettings {
  max_parallel_worktrees: number;
  auto_execute: boolean;
  consecutive_failure_limit: number;
  no_output_timeout_min: number;
  task_max_duration_min: number;
  subscription_tier: 'pro' | 'max5' | 'max20';
  budget_warning_threshold: number;
  default_model: string;
  auto_resolve_conflicts: boolean;
  upload_size_limit_mb: number;
  language: 'zh' | 'en';
}

const DEFAULTS: GeneralSettings = {
  max_parallel_worktrees: 6,
  auto_execute: true,
  consecutive_failure_limit: 3,
  no_output_timeout_min: 5,
  task_max_duration_min: 60,
  subscription_tier: 'pro',
  budget_warning_threshold: 10,
  default_model: 'claude-opus-4-6',
  auto_resolve_conflicts: true,
  upload_size_limit_mb: 10,
  language: 'zh',
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface FieldProps {
  label: string;
  desc: string;
  children: React.ReactNode;
}

function Field({ label, desc, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLeft}>
        <div className={styles.fieldLabel}>{label}</div>
        <div className={styles.fieldDesc}>{desc}</div>
      </div>
      <div className={styles.fieldRight}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`${styles.toggle} ${value ? styles.toggleOn : ''}`} onClick={() => onChange(!value)}>
      <span className={styles.toggleKnob} />
    </button>
  );
}

export default function SettingsOverlay({ visible, onClose }: SettingsOverlayProps) {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(() => {
    fetch('/api/settings', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const raw = data.settings?.general;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
        setSettings({ ...DEFAULTS, ...parsed });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (visible) { fetchSettings(); setSaved(false); }
  }, [visible, fetchSettings]);

  const handleSave = () => {
    setSaving(true);
    fetch('/api/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ general: settings }),
    })
      .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const set = <K extends keyof GeneralSettings>(key: K, val: GeneralSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  return (
    <Overlay visible={visible} onClose={onClose} title="设置">
      <div className={styles.content}>
        {!loaded && <div className={styles.loading}>加载中...</div>}
        {loaded && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>运行参数</h3>
              <Field label="最大并发 Worktree" desc="同时运行的最大任务数">
                <input type="number" className={styles.numInput} value={settings.max_parallel_worktrees}
                  onChange={e => set('max_parallel_worktrees', Number(e.target.value))} min={1} max={20} />
              </Field>
              <Field label="自动执行" desc="依赖分析后自动执行任务">
                <Toggle value={settings.auto_execute} onChange={v => set('auto_execute', v)} />
              </Field>
              <Field label="连续失败上限" desc="subAgent 连续失败的最大次数">
                <input type="number" className={styles.numInput} value={settings.consecutive_failure_limit}
                  onChange={e => set('consecutive_failure_limit', Number(e.target.value))} min={1} max={10} />
              </Field>
              <Field label="无输出超时" desc="Agent 无响应判定（分钟）">
                <input type="number" className={styles.numInput} value={settings.no_output_timeout_min}
                  onChange={e => set('no_output_timeout_min', Number(e.target.value))} min={1} max={30} />
              </Field>
              <Field label="任务时长上限" desc="单个任务最大运行时间（分钟）">
                <input type="number" className={styles.numInput} value={settings.task_max_duration_min}
                  onChange={e => set('task_max_duration_min', Number(e.target.value))} min={10} max={300} />
              </Field>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>额度与模型</h3>
              <Field label="订阅等级" desc="Claude 订阅计划">
                <select className={styles.selectInput} value={settings.subscription_tier}
                  onChange={e => set('subscription_tier', e.target.value as GeneralSettings['subscription_tier'])}>
                  <option value="pro">Pro</option>
                  <option value="max5">Max 5x</option>
                  <option value="max20">Max 20x</option>
                </select>
              </Field>
              <Field label="额度预警阈值" desc="低于此百分比时提示警告">
                <div className={styles.inputGroup}>
                  <input type="number" className={styles.numInput} value={settings.budget_warning_threshold}
                    onChange={e => set('budget_warning_threshold', Number(e.target.value))} min={1} max={50} />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </Field>
              <Field label="默认模型" desc="Agent 默认使用的模型">
                <select className={styles.selectInput} value={settings.default_model}
                  onChange={e => set('default_model', e.target.value)}>
                  <option value="claude-opus-4-6">Opus 4.6</option>
                  <option value="claude-sonnet-4-6">Sonnet 4.6</option>
                  <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
                </select>
              </Field>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>其他</h3>
              <Field label="合并冲突自动处理" desc="由 Agent 自动解决合并冲突">
                <Toggle value={settings.auto_resolve_conflicts} onChange={v => set('auto_resolve_conflicts', v)} />
              </Field>
              <Field label="文件上传大小上限" desc="对话中插入文件的最大体积">
                <div className={styles.inputGroup}>
                  <input type="number" className={styles.numInput} value={settings.upload_size_limit_mb}
                    onChange={e => set('upload_size_limit_mb', Number(e.target.value))} min={1} max={50} />
                  <span className={styles.inputSuffix}>MB</span>
                </div>
              </Field>
              <Field label="界面语言" desc="系统显示语言">
                <select className={styles.selectInput} value={settings.language}
                  onChange={e => set('language', e.target.value as 'zh' | 'en')}>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>

            <div className={styles.footer}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : saved ? '已保存' : '保存设置'}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}
