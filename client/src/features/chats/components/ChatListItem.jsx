import { UserRound, Crown } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import { hexToRgba } from '../utils/mappers';
import useTranslation from '../../../i18n/useTranslation';

export default function ChatListItem({ c, active, onClick }) {
  const { t } = useTranslation();
  return (
    <div className={`chat-item${active ? ' active' : ''}`} onClick={onClick}>
      <div className="chat-item-avatar">
        <Avatar name={c.name} seed={c.avatar} size={48} />
        <div className={`status-dot ${c.status}`}></div>
      </div>
      <div className="chat-item-info">
        <div className="chat-item-name">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {c.name}
            {c.isVip && (
              <span
                title={t('contacts.vip')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'rgba(245,166,35,0.15)',
                  color: '#f5a623',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 20,
                }}
              >
                <Crown size={10} /> {t('chats.vipBadge')}
              </span>
            )}
          </span>
          <span>{c.time}</span>
        </div>
        <div className="chat-item-msg">
          <span>{c.lastMsg}</span>
          {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
        </div>
        <div className={`chat-item-agent${c.assignedTo ? '' : ' unassigned'}`}>
          <UserRound size={11} />
          {c.assignedTo || t('chats.unassigned')}
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
            {(c.teams || []).map((team) => (
              <span
                key={`t${team.id}`}
                className="chat-item-label-chip"
                style={{ background: hexToRgba(team.color, 0.12), color: team.color || '#6C5CE7' }}
              >
                <span className="chat-item-label-dot" style={{ background: team.color || '#6C5CE7' }}></span>
                {team.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
