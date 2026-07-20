import { Lock } from 'lucide-react';
import { findPhoneLabel } from '../utils/mappers';
import MediaBubbleContent from './MediaBubbleContent';

const MEDIA_TYPES = ['image', 'video', 'audio', 'document', 'sticker'];

// بيبني span النص مع تمييز نتايج البحث (بديل عن performChatSearch اللي كانت
// بتلاعب في innerHTML مباشرة) — بنقسم النص لأجزاء ونعمل <mark> على الجزء المطابق بس
function HighlightedText({ text, query, isActiveMatch }) {
  if (!query) return <span className="msg-text">{text}</span>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts = [];
  let idx = 0;
  while (true) {
    const found = lower.indexOf(q, idx);
    if (found === -1) {
      parts.push(text.slice(idx));
      break;
    }
    parts.push(text.slice(idx, found));
    parts.push(
      <mark key={found} className={`search-hit${isActiveMatch ? ' active' : ''}`}>
        {text.slice(found, found + query.length)}
      </mark>
    );
    idx = found + query.length;
  }
  return <span className="msg-text">{parts}</span>;
}

export default function MessageBubble({ m, c, searchQuery, onOpenLightbox }) {
  if (m.from === 'note') {
    return (
      <div className="msg-row note-row fade-in">
        <div className="note-bubble">
          <div className="note-label">
            <Lock size={11} /> Private note{m.senderName ? ` — ${m.senderName}` : ''}
          </div>
          <div className="note-text">{m.text}</div>
          <div className="note-time">{m.time}</div>
        </div>
      </div>
    );
  }
  if (m.from === 'system') {
    return (
      <div className="msg-row system-row fade-in">
        <div className="system-bubble">
          {m.text}
          <div className="system-time">{m.time}</div>
        </div>
      </div>
    );
  }
  const senderLabel =
    m.from === 'agent' && m.senderName
      ? m.senderName
      : m.from === 'customer'
        ? findPhoneLabel(c, m.phone) || m.phone || c.phone || ''
        : null;

  if (m.type && MEDIA_TYPES.includes(m.type)) {
    return (
      <div className={`msg-row ${m.from === 'agent' ? 'sent' : 'received'} fade-in`}>
        <div className={`msg-col${m.type === 'audio' ? ' msg-col-audio' : ''}`}>
          {senderLabel && <div className="msg-sender-name">{senderLabel}</div>}
          <div className={`msg-bubble media-bubble${m._pending ? ' msg-pending' : ''}${m.failed ? ' msg-failed' : ''}`}>
            <MediaBubbleContent m={m} onOpenLightbox={onOpenLightbox} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`msg-row ${m.from === 'agent' ? 'sent' : 'received'} fade-in`}>
      <div className="msg-col">
        {senderLabel && <div className="msg-sender-name">{senderLabel}</div>}
        <div className="msg-bubble">
          <HighlightedText text={m.text} query={searchQuery} isActiveMatch={false} />
          <div className="msg-time">{m.time}</div>
        </div>
      </div>
    </div>
  );
}
