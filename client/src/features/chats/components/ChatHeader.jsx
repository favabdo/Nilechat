import { ArrowLeft, Search, CheckCircle, RotateCcw, User, X, ChevronUp, ChevronDown } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';

export default function ChatHeader({
  conversation,
  typingNames,
  onBack,
  onToggleSearch,
  searchOpen,
  searchQuery,
  onSearchChange,
  matchCount,
  matchIndex,
  onNextMatch,
  onPrevMatch,
  onResolveClick,
  onCustomerPanelToggle,
}) {
  const c = conversation;
  const statusText =
    typingNames.length > 0
      ? typingNames.length === 1
        ? `${typingNames[0]} is typing...`
        : `${typingNames.join(', ')} are typing...`
      : c.status === 'open'
        ? 'Online'
        : c.status === 'pending'
          ? 'Pending'
          : 'Resolved';
  const statusColor =
    typingNames.length > 0
      ? 'var(--primary)'
      : c.status === 'open'
        ? 'var(--success)'
        : c.status === 'pending'
          ? 'var(--warning)'
          : 'var(--text-secondary)';

  const activeLabel = c.labels && c.labels.length > 0 ? c.labels[0] : null;

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="mobile-back-btn" title="رجوع لكل المحادثات" aria-label="رجوع لكل المحادثات" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <Avatar name={c.name} seed={c.avatar} size={40} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="chat-header-name">{c.name}</div>
            <div className="chat-header-status" style={{ color: statusColor }}>
              {statusText}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="ch-action-btn" title="Search in chat" aria-label="Search in chat" onClick={onToggleSearch}>
            <Search size={18} />
          </button>
          <button
            className={`resolve-btn${c.status === 'resolved' ? ' resolved-state' : ''}`}
            title={c.status === 'resolved' ? 'Reopen Conversation' : 'Resolve Conversation'}
            onClick={onResolveClick}
          >
            {c.status === 'resolved' ? <RotateCcw size={15} /> : <CheckCircle size={15} />}
            <span>{c.status === 'resolved' ? 'Reopen' : 'Resolve'}</span>
          </button>
          <button className="ch-action-btn" title="Customer Info" aria-label="Customer Info" onClick={onCustomerPanelToggle}>
            <User size={18} />
          </button>
        </div>
      </div>

      {activeLabel && activeLabel.description && (
        <div className="chat-header-labels show" style={{ borderRightColor: activeLabel.color || '#6C5CE7' }}>
          <span className="chlbl-dot" style={{ background: activeLabel.color || '#6C5CE7' }}></span>
          <span className="chlbl-name">{activeLabel.name}:</span>
          <span className="chlbl-desc">{activeLabel.description}</span>
        </div>
      )}

      <div className={`chat-search-bar${searchOpen ? ' show' : ''}`}>
        <Search size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="ابحث في الرسايل..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) onPrevMatch();
              else onNextMatch();
            } else if (e.key === 'Escape') {
              onToggleSearch();
            }
          }}
        />
        <span className="chat-search-counter">{matchCount ? `${matchIndex + 1}/${matchCount}` : searchQuery ? '0/0' : ''}</span>
        <button className="ch-action-btn" title="السابق" aria-label="السابق" onClick={onPrevMatch}>
          <ChevronUp size={16} />
        </button>
        <button className="ch-action-btn" title="التالي" aria-label="التالي" onClick={onNextMatch}>
          <ChevronDown size={16} />
        </button>
        <button className="ch-action-btn" title="إغلاق" aria-label="إغلاق" onClick={onToggleSearch}>
          <X size={16} />
        </button>
      </div>
    </>
  );
}
