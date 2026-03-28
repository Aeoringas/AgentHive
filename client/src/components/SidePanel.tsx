import React, { useState } from 'react';
import { Task, TaskStatus } from '@agenthive/shared';

interface SidePanelProps {
  task: Task | null;
  onClose: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  waiting: '#9ca3af',
  running: '#f59e0b',
  paused: '#f59e0b',
  reviewing: '#8b5cf6',
  completed: '#10b981',
  needs_intervention: '#ef4444',
  interrupted: '#6b7280',
  conflict_resolving: '#f59e0b',
};

const statusLabels: Record<TaskStatus, string> = {
  waiting: '等待中',
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
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        color: '#fff',
        backgroundColor: statusColors[status],
      }}
    >
      {statusLabels[status]}
    </span>
  );
}

function ActionButtons({ status }: { status: TaskStatus }) {
  const btn = (label: string) => (
    <button
      key={label}
      onClick={() => {}}
      style={{
        padding: '6px 16px',
        borderRadius: 6,
        border: '1px solid rgba(0,0,0,0.1)',
        background: '#fff',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

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
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      {labels.map(btn)}
    </div>
  );
}

function CollapsibleSection({ title, content }: { title: string; content: string | null }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>
          ▶
        </span>
        {title}
      </button>
      {open && (
        <pre
          style={{
            marginTop: 8,
            padding: 12,
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            maxHeight: 300,
          }}
        >
          {content}
        </pre>
      )}
    </div>
  );
}

function ConversationTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
        对话功能开发中
      </div>
      <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8 }}>
        <input
          disabled
          placeholder="输入消息..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 13,
            background: '#f9fafb',
            outline: 'none',
          }}
        />
        <button
          disabled
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#d1d5db',
            color: '#fff',
            fontSize: 13,
            cursor: 'not-allowed',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}

function FilesTab() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 14 }}>
      文件变更列表 - 开发中
    </div>
  );
}

function DetailsTab({ task }: { task: Task }) {
  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: 4 }}>状态</div>
            <StatusBadge status={task.status} />
          </div>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: 4 }}>类型</div>
            <div style={{ fontWeight: 500 }}>{typeLabels[task.type] ?? task.type}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: 4 }}>创建时间</div>
            <div>{new Date(task.created_at).toLocaleString('zh-CN')}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: 4 }}>Token 用量</div>
            <div style={{ fontWeight: 500 }}>{task.token_total.toLocaleString()}</div>
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
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 48,
        height: 'calc(100vh - 48px)',
        width: 480,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(0,0,0,0.06)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {task && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.name}
              </span>
              <StatusBadge status={task.status} />
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#6b7280',
                padding: '4px 8px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              X
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              flexShrink: 0,
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #4f46e5' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? '#4f46e5' : '#6b7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {activeTab === 'conversation' && <ConversationTab />}
            {activeTab === 'files' && <FilesTab />}
            {activeTab === 'details' && <DetailsTab task={task} />}
          </div>
        </>
      )}
    </div>
  );
}
