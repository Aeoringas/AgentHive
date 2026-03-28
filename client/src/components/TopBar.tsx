import styles from './TopBar.module.css';

interface TopBarProps {
  onLogout: () => void;
}

export default function TopBar({ onLogout }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M8 0L14.93 4v8L8 16L1.07 12V4Z"
            fill="var(--honey-500)"
          />
        </svg>
        <span className={styles.brandText}>AgentHive</span>
      </div>
      <button className={styles.logoutBtn} onClick={onLogout}>
        退出
      </button>
    </header>
  );
}
