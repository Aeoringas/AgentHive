import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitAll: () => void;
}

const btnStyle: React.CSSProperties = {
  width: 36,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: '#374151',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset, onFitAll }: ZoomControlsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <button title="放大" onClick={onZoomIn} style={btnStyle}>+</button>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', width: '80%' }} />
      <div
        style={{
          width: 36,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#6b7280',
          userSelect: 'none',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', width: '80%' }} />
      <button title="缩小" onClick={onZoomOut} style={btnStyle}>-</button>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', width: '80%' }} />
      <button title="重置缩放" onClick={onZoomReset} style={{ ...btnStyle, fontSize: 11 }}>1:1</button>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', width: '80%' }} />
      <button title="适应全部" onClick={onFitAll} style={{ ...btnStyle, fontSize: 12 }}>全</button>
    </div>
  );
}
