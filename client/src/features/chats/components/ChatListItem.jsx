import { UserRound } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import { hexToRgba } from '../utils/mappers';

export default function ChatListItem({ c, active, onClick }) {
  return (
    <div className={`chat-item${active ? ' active' : ''}`} onClick={onClick}>
      <div className="chat-item-avatar">
        <Avatar name={c.name} seed={c.avatar} size={48} />
        <div className={`status-dot ${c.status}`}></div>
      </div>
      <div className="chat-item-info">
        <div className="chat-item-name">
          <span>{c.name}</span>
          <span>{c.time}</span>
        </div>
        <div className="chat-item-msg">
          <span>{c.lastMsg}</span>
          {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
        </div>
        <div className={`chat-item-agent${c.assignedTo ? '' : ' unassigned'}`}>
          <UserRound size={11} />
          {c.assignedTo || 'Unassigned'}
        </div>
        {((c.labels && c.labels.length > 0) || (c.teams && c.teams.length > 0)) && (
          <div className="chat-item-labels">
            {(c.labels || []).map((l) => (
              <span
                key={`l${l.id}`}
                className="chat-item-label-chip"
                style={{ background: hexToRgba(l.color, 0.12), color: l.color || '#6C5CE7' }}
              >
                <span className="chat-item-label-dot" style={{ background: l.color || '#6C5CE7' }}></span>
                {l.name}
              </span>
            ))}
            {(c.teams || []).map((t) => (
              <span
                key={`t${t.id}`}
                className="chat-item-label-chip"
                style={{ background: hexToRgba(t.color, 0.12), color: t.color || '#6C5CE7' }}
              >
                <span className="chat-item-label-dot" style={{ background: t.color || '#6C5CE7' }}></span>
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
