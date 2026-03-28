import styles from './Toolbar.module.css';

interface ToolbarProps {
  gridVisible: boolean;
  onToggleGrid: () => void;
  depVisible: boolean;
  onToggleDep: () => void;
  autoExecute: boolean;
  onToggleAutoExecute: () => void;
  onAutoArrange: () => void;
  onAnalyze: () => void;
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
  depVisible,
  onToggleDep,
  autoExecute,
  onToggleAutoExecute,
  onAutoArrange,
  onAnalyze,
  onNewIdea,
  onNewTask,
  onPlan,
}: ToolbarProps) {
  const buttons: ToolButton[] = [
    { label: '网格', active: gridVisible, onClick: onToggleGrid },
    { label: '依赖', active: depVisible, onClick: onToggleDep },
    { label: '整理', onClick: onAutoArrange },
    { label: '分析', onClick: onAnalyze },
    { label: '自动', active: autoExecute, onClick: onToggleAutoExecute },
    { label: '规划', onClick: onPlan },
    { label: '+想法', onClick: onNewIdea },
    { label: '+任务', onClick: onNewTask },
  ];

  return (
    <div className={styles.toolbar}>
      {buttons.map((btn) => (
        <button
          key={btn.label}
          className={`${styles.btn}${btn.active ? ` ${styles.btnActive}` : ''}`}
          onClick={btn.onClick}
          title={btn.label}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
