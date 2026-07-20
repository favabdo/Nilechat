import { FileWarning, FileText } from 'lucide-react';
import { docKindLabel } from '../utils/mappers';

export default function MediaBubbleContent({ m, onOpenLightbox }) {
  if (!m.mediaUrl) {
    return (
      <>
        <div className="msg-media-unavailable">
          <FileWarning size={14} /> Media unavailable
        </div>
        {m.text && <div className="msg-media-caption">{m.text}</div>}
        <div className="msg-time" style={{ padding: '0 8px 6px' }}>{m.time}</div>
      </>
    );
  }

  let body;
  if (m.type === 'image' || m.type === 'sticker') {
    body = <img className="msg-media-image" src={m.mediaUrl} alt="image" onClick={() => onOpenLightbox(m.mediaUrl)} />;
  } else if (m.type === 'video') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    body = <video className="msg-media-video" src={m.mediaUrl} controls preload="metadata" />;
  } else if (m.type === 'audio') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    body = <audio className="msg-media-audio" src={m.mediaUrl} controls preload="metadata" />;
  } else {
    const kind = docKindLabel(m.mediaMime, m.fileName);
    body = (
      <a className="msg-media-doc" href={m.mediaUrl} target="_blank" rel="noopener noreferrer">
        <div className="msg-media-doc-icon"><FileText size={18} /></div>
        <div className="msg-media-doc-info">
          <span className="msg-media-doc-name">{m.fileName || kind}</span>
          <span className="msg-media-doc-hint">{kind} — tap to open</span>
        </div>
      </a>
    );
  }

  return (
    <>
      {body}
      {m._pending && <div className="msg-upload-progress">{m.failed ? 'Failed' : 'Sending…'}</div>}
      {m.text && <div className="msg-media-caption">{m.text}</div>}
      <div className="msg-time" style={{ padding: '0 8px 6px' }}>{m.time}</div>
    </>
  );
}
