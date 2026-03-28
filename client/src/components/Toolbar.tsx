import React from 'react';

interface ToolbarProps {
  gridVisible: boolean;
  onToggleGrid: () => void;
  autoExecute: boolean;
  onToggleAutoExecute: () => void;
  onAutoArrange: () => void;
  onNewIdea: () => void;
  onNewTask: () => void;
  onPlan: () => void;
}

interface ToolButton {
  label: string;
  title: string;
  active?: boolean;
  onClick: () => void;
}

export default function Toolbar({
  gridVisible,
  onToggleGrid,
  autoExecute,
  onToggleAutoExecute,
  onAutoArrange,
  onNewIdea,
  onNewTask,
  onPlan,
}: ToolbarProps) {
  const buttons: ToolButton[] = [
    { label: '网', title: '网格', active: gridVisible, onClick: onToggleGrid },
    { label: '自', title: '自动执行', active: autoExecute, onClick: onToggleAutoExecute },
    { label: '整', title: '整理', onClick: onAutoArrange },
    { label: '划', title: '规划', onClick: onPlan },
    { label: '+', title: '新建想法', onClick: onNewIdea },
    { label: '任', title: '新建任务', onClick: onNewTask },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      {buttons.map((btn, i) => (
        <div key={btn.title}>
          {i > 0 && (
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 4px' }} />
          )}
          <button
            title={btn.title}
            onClick={btn.onClick}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: btn.active ? '#4f46e5' : 'transparent',
              color: btn.active ? '#ffffff' : '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            {btn.label}
          </button>
        </div>
      ))}
    </div>
  );
}
