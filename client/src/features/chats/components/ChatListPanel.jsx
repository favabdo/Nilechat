import { Search, Inbox } from 'lucide-react';
import useChatsStore from '../store/chatsStore';
import ChatListItem from './ChatListItem';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'me', label: 'Me' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ChatListPanel({ currentAgentName }) {
  const { conversations, filter, search, selectedChatId, setFilter, setSearch, selectChat } = useChatsStore();

  let filtered = conversations;
  if (filter === 'me') {
    filtered = filtered.filter((c) => c.status === 'open' && c.assignedTo === currentAgentName);
  } else if (filter !== 'all') {
    filtered = filtered.filter((c) => c.status === filter);
  }
  if (search) filtered = filtered.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    me: conversations.filter((c) => c.status === 'open' && c.assignedTo === currentAgentName).length,
    open: conversations.filter((c) => c.status === 'open').length,
  };

  return (
    <div id="chat-list-panel">
      <div className="cl-header">
        <div className="cl-search-wrap">
          <Search size={16} className="cl-search-icon" />
          <input
            type="text"
            className="cl-search"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="cl-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cl-filter-btn${filter === f.key ? ' active' : ''}`}
            data-filter={f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label} {(f.key === 'me' || f.key === 'open') && <span className="cl-filter-count">{counts[f.key]}</span>}
          </button>
        ))}
      </div>
      <div className="cl-list" id="chat-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Inbox size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>No conversations found</div>
          </div>
        ) : (
          filtered.map((c) => <ChatListItem key={c.id} c={c} active={c.id === selectedChatId} onClick={() => selectChat(c.id)} />)
        )}
      </div>
    </div>
  );
}
