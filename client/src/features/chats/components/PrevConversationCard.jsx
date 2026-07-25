import { Phone, User } from 'lucide-react';
import useTranslation from '../../../i18n/useTranslation';

export default function PrevConversationCard({ p, onClick }) {
  const { t } = useTranslation();
  return (
    <div className="prev-conv-item" onClick={onClick}>
      <div className="prev-conv-top-row">
        <div className="prev-conv-date">{p.date}</div>
        {p.daysAgo && <div className="prev-conv-days-ago">{p.daysAgo}</div>}
      </div>
      {p.phone && (
        <div className="prev-conv-phone">
          <Phone size={11} /> {p.phone}
        </div>
      )}
      <div className="prev-conv-preview">{p.preview}</div>
      <div className="prev-conv-footer">
        <span className="prev-conv-count">{p.count} {t('chats.messagesCount')}</span>
        {p.handledBy && (
          <span className="prev-conv-agent">
            <User size={11} /> {p.handledBy}
          </span>
        )}
      </div>
    </div>
  );
}
