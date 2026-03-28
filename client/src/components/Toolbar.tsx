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
    { label: '网格', active: gridVisible, onClick: onToggleGrid },
    { label: '自动', active: autoExecute, onClick: onToggleAutoExecute },
    { label: '整理', onClick: onAutoArrange },
    { label: '规划', onClick: onPlan },
    { label: '想法', onClick: onNewIdea },
    { label: '任务', onClick: onNewTask },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        top: 60,
        display: 'flex',
        flexDirection: 'row',
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
        <div key={btn.label} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && (
            <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.06)' }} />
          )}
          <button
            onClick={btn.onClick}
            style={{
              padding: '0 14px',
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: btn.active ? '#4f46e5' : 'transparent',
              color: btn.active ? '#ffffff' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {btn.label}
          </button>
        </div>
      ))}
    </div>
  );
}
