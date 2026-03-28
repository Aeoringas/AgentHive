import { useState } from 'react';

const STATUS_ITEMS = [
  { color: '#9ca3af', label: '等待中' },
  { color: '#f59e0b', label: '运行中' },
  { color: '#8b5cf6', label: '审查中' },
  { color: '#10b981', label: '已完成' },
  { color: '#ef4444', label: '需介入' },
  { color: '#6b7280', label: '已中断' },
];

export default function StatusLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        left: 20,
        top: 60,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: collapsed ? 8 : 10,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setCollapsed((v) => !v)}
    >
      {collapsed ? (
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', width: 16, justifyContent: 'center' }}>
            {STATUS_ITEMS.slice(0, 4).map((item) => (
              <div
                key={item.label}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: item.color,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px' }}>
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
