import { useState } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';
import styles from './SidePanel.module.css';

interface SidePanelProps {
  task: Task | null;
  onClose: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  waiting: 'var(--status-waiting)',
  running: 'var(--status-running)',
  paused: 'var(--status-paused)',
  reviewing: 'var(--status-reviewing)',
  completed: 'var(--status-completed)',
  needs_intervention: 'var(--status-intervention)',
  interrupted: 'var(--status-interrupted)',
  conflict_resolving: 'var(--status-conflict)',
};

const statusLabels: Record<TaskStatus, string> = {
  waiting: '待执行',
  running: '运行中',
  paused: '已暂停',
  reviewing: '审查中',
  completed: '已完成',
  needs_intervention: '需要介入',
  interrupted: '已中断',
  conflict_resolving: '冲突解决中',
};

const typeLabels: Record<string, string> = {
  frontend: '前端',
  backend: '后端',
  fullstack: '全栈',
};

type TabKey = 'conversation' | 'files' | 'details';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'conversation', label: '对话' },
  { key: 'files', label: '文件' },
  { key: 'details', label: '详情' },
];

function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={styles.statusBadge}
      style={{ backgroundColor: statusColors[status] }}
    >
      {statusLabels[status]}
    </span>
  );
}

function ActionButtons({ status }: { status: TaskStatus }) {
  const map: Partial<Record<TaskStatus, string[]>> = {
    waiting: ['执行'],
    running: ['暂停', '终止'],
    paused: ['恢复', '终止'],
    interrupted: ['继续', '重置'],
    needs_intervention: ['恢复', '终止'],
    reviewing: ['确认通过', '驳回修改'],
  };

  const labels = map[status];
  if (!labels) return null;

  return (
    <div className={styles.actionButtons}>
      {labels.map((label) => (
        <button key={label} className={styles.actionBtn} onClick={() => {}}>
          {label}
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, content }: { title: string; content: string | null }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;

  return (
    <div>
      <button className={styles.collapsibleToggle} onClick={() => setOpen(!open)}>
        <span className={`${styles.collapsibleArrow}${open ? ` ${styles.collapsibleArrowOpen}` : ''}`}>
          ▶
        </span>
        {title}
      </button>
      {open && (
        <pre className={styles.collapsibleContent}>
          {content}
        </pre>
      )}
    </div>
  );
}

function ConversationTab() {
  return (
    <div className={styles.conversationWrap}>
      <div className={styles.conversationEmpty}>
        对话功能开发中
      </div>
      <div className={styles.conversationInput}>
        <input
          disabled
          placeholder="输入消息..."
          className={styles.inputField}
        />
        <button disabled className={styles.sendBtn}>
          发送
        </button>
      </div>
    </div>
  );
}

function FilesTab() {
  return (
    <div className={styles.filesEmpty}>
      文件变更列表 - 开发中
    </div>
  );
}

function DetailsTab({ task }: { task: Task }) {
  return (
    <div className={styles.detailsWrap}>
      <div className={styles.infoCard}>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.infoLabel}>状态</div>
            <StatusBadge status={task.status} />
          </div>
          <div>
            <div className={styles.infoLabel}>类型</div>
            <div className={styles.infoValue}>{typeLabels[task.type] ?? task.type}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>创建时间</div>
            <div className={styles.infoValue}>{new Date(task.created_at).toLocaleString('zh-CN')}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Token 用量</div>
            <div className={styles.infoValue}>{task.token_total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <ActionButtons status={task.status} />

      <CollapsibleSection title="需求文档" content={task.requirement_doc} />
      <CollapsibleSection title="技术方案" content={task.technical_plan} />
    </div>
  );
}

export default function SidePanel({ task, onClose }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('conversation');
  const visible = task !== null;

  return (
    <div className={`${styles.panel} ${visible ? styles.panelVisible : styles.panelHidden}`}>
      {task && (
        <>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.taskTitle}>{task.name}</span>
              <StatusBadge status={task.status} />
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              X
            </button>
          </div>

          <div className={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${styles.tab}${activeTab === tab.key ? ` ${styles.tabActive}` : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'conversation' && <ConversationTab />}
            {activeTab === 'files' && <FilesTab />}
            {activeTab === 'details' && <DetailsTab task={task} />}
          </div>
        </>
      )}
    </div>
  );
}
