import { useState, useEffect, useCallback, useRef } from 'react';
import Overlay from './Overlay';
import styles from './ChatOverlay.module.css';

interface ChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
}

interface SessionItem {
  id: string;
  title: string | null;
  model: string | null;
  messageCount: number;
  category: string;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
}

interface ToolCall {
  name: string;
  isAgent?: boolean;
  agentDesc?: string;
  agentType?: string;
}

interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
}

interface Message {
  type: 'user' | 'assistant';
  timestamp: string;
  texts: string[];
  model?: string;
  usage?: Usage;
  toolCalls?: ToolCall[];
}

type FilterKey = 'all' | 'dev' | 'hr' | 'assistant';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'dev', label: '开发' },
  { key: 'hr', label: 'HR' },
  { key: 'assistant', label: '助理' },
];

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatTime(ts: string | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function isRecent(ts: string | null): boolean {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < 24 * 60 * 60 * 1000;
}

function categoryLabel(cat: string): string {
  if (cat === 'dev') return '开发';
  if (cat === 'hr') return 'HR';
  return '助理';
}

function UserMsg({ msg }: { msg: Message }) {
  const text = msg.texts.join('\n').replace(/<ide_opened_file>.*?<\/ide_opened_file>/gs, '').replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gs, '').trim();
  if (!text) return null;
  return (
    <div className={`${styles.message} ${styles.userMsg}`}>
      <div className={styles.msgHeader}>
        <span className={`${styles.role} ${styles.roleUser}`}>用户</span>
        <span>{formatTime(msg.timestamp)}</span>
      </div>
      <div className={styles.msgContent}>{text}</div>
    </div>
  );
}

function AssistantMsg({ msg }: { msg: Message }) {
  const [showTools, setShowTools] = useState(false);
  const text = msg.texts.join('\n');
  const tools = msg.toolCalls || [];
  const usage = msg.usage;

  return (
    <div className={`${styles.message} ${styles.assistantMsg}`}>
      <div className={styles.msgHeader}>
        <span className={`${styles.role} ${styles.roleAssistant}`}>助手</span>
        {msg.model && <span>{msg.model.replace('claude-', '')}</span>}
        <span>{formatTime(msg.timestamp)}</span>
      </div>
      {text && <div className={styles.msgContent}>{text}</div>}
      {tools.length > 0 && (
        <>
          <button className={styles.toggleBtn} onClick={() => setShowTools(!showTools)}>
            {showTools ? '收起' : '展开'} {tools.length} 个工具调用
          </button>
          {showTools && tools.map((tc, i) => (
            <div key={i} className={`${styles.toolCall} ${tc.isAgent ? styles.agentCall : ''}`}>
              <span className={styles.toolName}>
                {tc.isAgent ? `SubAgent: ${tc.agentDesc}` : tc.name}
              </span>
              {tc.isAgent && tc.agentType && <span className={styles.toolDetail}>{tc.agentType}</span>}
            </div>
          ))}
        </>
      )}
      {usage && (
        <div className={styles.msgUsage}>
          <span>入 {formatTokens(usage.input_tokens || 0)}</span>
          <span>出 {formatTokens(usage.output_tokens || 0)}</span>
          {(usage.cache_read_input_tokens || 0) > 0 && <span>缓存 {formatTokens(usage.cache_read_input_tokens!)}</span>}
        </div>
      )}
    </div>
  );
}

export default function ChatOverlay({ visible, onClose, projectId }: ChatOverlayProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/chat/sessions?project_id=${projectId}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (visible && projectId) {
      fetchSessions();
      setSelectedId(null);
      setMessages([]);
    }
  }, [visible, projectId, fetchSessions]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMsgLoading(true);
    fetch(`/api/chat/messages?project_id=${projectId}&session_id=${id}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages ?? []);
        setTimeout(() => msgEndRef.current?.scrollIntoView(), 50);
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [projectId]);

  const handleNew = useCallback(() => {
    if (!projectId) return;
    const title = prompt('对话标题');
    if (!title) return;
    fetch('/api/chat/sessions', {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, title }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.session) {
          fetchSessions();
          setSelectedId(data.session.id);
        }
      })
      .catch(() => {});
  }, [projectId, fetchSessions]);

  const [sending, setSending] = useState(false);

  const handleSend = useCallback(() => {
    if (!projectId || !selectedId || !inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    setMessages(prev => [...prev, { type: 'user', timestamp: new Date().toISOString(), texts: [text] }]);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    fetch('/api/chat/messages', {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, session_id: selectedId, content: text }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.reply) {
          setMessages(prev => [...prev, {
            type: 'assistant',
            timestamp: new Date().toISOString(),
            texts: [data.reply],
          }]);
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      })
      .catch(() => {})
      .finally(() => setSending(false));
  }, [projectId, selectedId, inputText, sending]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('删除此对话?')) return;
    fetch(`/api/chat/sessions/${id}?project_id=${projectId}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    })
      .then(() => {
        if (selectedId === id) { setSelectedId(null); setMessages([]); }
        fetchSessions();
      })
      .catch(() => {});
  }, [projectId, selectedId, fetchSessions]);

  const filtered = sessions.filter(s => filter === 'all' || s.category === filter);
  const recent = filtered.filter(s => isRecent(s.lastTimestamp));
  const history = filtered.filter(s => !isRecent(s.lastTimestamp));
  const selectedSession = sessions.find(s => s.id === selectedId);

  return (
    <Overlay visible={visible} onClose={onClose} title="对话">
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.filterBar}>
              {FILTERS.map(f => (
                <button key={f.key}
                  className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ''}`}
                  onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <button className={styles.newBtn} onClick={handleNew}>+ 新建</button>
          </div>

          <div className={styles.sessionList}>
            {loading && <div className={styles.empty}>加载中...</div>}

            {!loading && recent.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupTitle}>活跃会话</div>
                {recent.map(s => (
                  <div key={s.id}
                    className={`${styles.sessionItem} ${selectedId === s.id ? styles.sessionItemActive : ''}`}
                    onClick={() => handleSelect(s.id)}>
                    <div className={styles.sessionTop}>
                      <span className={styles.sessionTitle}>{s.title || s.id.slice(0, 8)}</span>
                      <span className={`${styles.catBadge} ${styles[`cat_${s.category}`]}`}>{categoryLabel(s.category)}</span>
                      <button className={styles.delBtn} onClick={(e) => handleDelete(s.id, e)} title="删除">x</button>
                    </div>
                    <div className={styles.sessionMeta}>
                      <span>{s.messageCount} 条</span>
                      <span>{formatTime(s.lastTimestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && history.length > 0 && (
              <div className={styles.group}>
                <button className={styles.groupToggle} onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? '\u25BE' : '\u25B8'} 历史会话 ({history.length})
                </button>
                {showHistory && history.map(s => (
                  <div key={s.id}
                    className={`${styles.sessionItem} ${selectedId === s.id ? styles.sessionItemActive : ''}`}
                    onClick={() => handleSelect(s.id)}>
                    <div className={styles.sessionTop}>
                      <span className={styles.sessionTitle}>{s.title || s.id.slice(0, 8)}</span>
                      <span className={`${styles.catBadge} ${styles[`cat_${s.category}`]}`}>{categoryLabel(s.category)}</span>
                      <button className={styles.delBtn} onClick={(e) => handleDelete(s.id, e)} title="删除">x</button>
                    </div>
                    <div className={styles.sessionMeta}>
                      <span>{s.messageCount} 条</span>
                      <span>{formatTime(s.lastTimestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && <div className={styles.empty}>暂无会话</div>}
          </div>
        </div>

        <div className={styles.content}>
          {!selectedId && <div className={styles.placeholder}>选择会话查看对话</div>}
          {selectedId && msgLoading && <div className={styles.placeholder}>加载中...</div>}
          {selectedId && !msgLoading && (
            <>
              {selectedSession && (
                <div className={styles.contentHeader}>
                  <span>{selectedSession.title || selectedSession.id.slice(0, 8)}</span>
                  <span className={styles.headerMeta}>
                    {selectedSession.messageCount} 条 | {formatTime(selectedSession.firstTimestamp)} - {formatTime(selectedSession.lastTimestamp)}
                  </span>
                </div>
              )}
              <div className={styles.messageList}>
                {messages.map((msg, i) =>
                  msg.type === 'user' ? <UserMsg key={i} msg={msg} /> : <AssistantMsg key={i} msg={msg} />
                )}
                <div ref={msgEndRef} />
              </div>
              <div className={styles.inputBar}>
                {sending && <div className={styles.thinking}>思考中...</div>}
                <input
                  className={styles.chatInput}
                  placeholder={sending ? '等待回复...' : '输入消息...'}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && inputText.trim() && !sending) handleSend(); }}
                  disabled={sending}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim() || sending}>
                  {sending ? '...' : '发送'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
