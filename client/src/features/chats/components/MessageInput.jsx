import { useRef, useState } from 'react';
import { Smile, Paperclip, Mic, Square, Send, Lock, Sparkles, Loader2 } from 'lucide-react';
import useToastStore from '../../../store/toastStore';
import { conversationsApi } from '../services/chats.service';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ACCEPT_TYPES = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip';

function autoResize(el) {
  el.style.height = 'auto';
  const maxH = Math.min(window.innerHeight * 0.35, 160);
  el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
  el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
}
function isMobileLayout() {
  return window.matchMedia('(max-width:860px)').matches;
}
function pickVoiceMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const type of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export default function MessageInput({
  conversationId,
  resolved,
  noteMode,
  onToggleNoteMode,
  onSend,
  onSendFile,
  onTypingChange,
  cannedResponses,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const showToast = useToastStore((s) => s.showToast);

  const [generating, setGenerating] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  function handleChange(e) {
    setText(e.target.value);
    autoResize(e.target);
    onTypingChange(e.target.value.trim().length > 0);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isMobileLayout()) return;
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function insertReply(reply) {
    setText(reply.text);
    textareaRef.current?.focus();
    if (textareaRef.current) autoResize(textareaRef.current);
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast('الملف ده أكبر من 30MB — اختار ملف أصغر', 'error');
      return;
    }
    onSendFile(file);
  }

  function handlePaste(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items || !items.length) return;
    const imageItem = Array.from(items).find((item) => item.kind === 'file' && item.type?.startsWith('image/'));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast('الصورة دي أكبر من 30MB — اختار صورة أصغر', 'error');
      return;
    }
    onSendFile(file);
  }

  async function generateReply() {
    if (!conversationId || generating) return;
    setGenerating(true);
    try {
      const res = await conversationsApi.generateReply(conversationId);
      if (res.status === 204 || !res.data?.reply) return;
      setText(res.data.reply);
      textareaRef.current?.focus();
      if (textareaRef.current) autoResize(textareaRef.current);
    } catch (err) {
      console.error('[API] generateAIReply error:', err);
      showToast(err.response?.data?.error || 'تعذر توليد رد مقترح دلوقتي', 'error');
    } finally {
      setGenerating(false);
    }
  }

  function updateTimer() {
    if (!startedAtRef.current) return;
    setRecordSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
  }

  async function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast('المتصفح ده مش بيدعم تسجيل الصوت', 'error');
      return;
    }
    if (!conversationId) {
      showToast('افتح محادثة الأول عشان تبعت ريكورد', 'error');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showToast('مقدرناش نوصل للمايك — تأكد إنك سمحت للمتصفح بالوصول', 'error');
      return;
    }

    const mimeType = pickVoiceMimeType();
    streamRef.current = stream;
    chunksRef.current = [];
    cancelledRef.current = false;
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(false);
      setRecordSeconds(0);

      if (!cancelledRef.current && chunksRef.current.length) {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const ext = (recorder.mimeType || '').includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type });
        onSendFile(file);
      }
      chunksRef.current = [];
      recorderRef.current = null;
    };

    recorder.start();
    startedAtRef.current = Date.now();
    setRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(updateTimer, 250);
  }

  function toggleVoice() {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      cancelledRef.current = false;
      recorderRef.current.stop();
      return;
    }
    startVoiceRecording();
  }

  function cancelVoiceRecording() {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      cancelledRef.current = true;
      recorderRef.current.stop();
    }
  }

  if (resolved) {
    return (
      <div className="resolved-banner show">
        <Lock size={14} />
        <span>المحادثة دي متقفلة (Resolved) — لازم تعمل Reopen عشان تقدر تبعت رسالة</span>
      </div>
    );
  }

  const timeLabel = `${Math.floor(recordSeconds / 60)}:${String(recordSeconds % 60).padStart(2, '0')}`;

  return (
    <>
      {cannedResponses.length > 0 && (
        <div className="saved-replies-bar">
          <span className="sr-label">Quick Replies:</span>
          {cannedResponses.map((r) => (
            <button key={r.id} className="sr-chip" onClick={() => insertReply(r)}>
              {r.label}
            </button>
          ))}
        </div>
      )}
      <div className="note-toggle-bar">
        <button
          className={`note-toggle-btn${noteMode ? ' active' : ''}`}
          title="Private note (agents only, not sent to customer)"
          aria-label="Private note (agents only, not sent to customer)"
          onClick={onToggleNoteMode}
        >
          <Lock size={13} /> Private Note
        </button>
        <button
          className={`note-toggle-btn${generating ? ' loading' : ''}`}
          title="اقترح رد بالذكاء الاصطناعي بناءً على المحادثة"
          aria-label="اقترح رد بالذكاء الاصطناعي بناءً على المحادثة"
          onClick={generateReply}
        >
          {generating ? <Loader2 size={13} className="ai-spin" /> : <Sparkles size={13} />} Generate Reply
        </button>
      </div>
      <div className={`chat-input-area${noteMode ? ' note-mode' : ''}`} id="chat-input-area">
        <div className="input-actions">
          <button className="input-action-btn" title="Emoji" aria-label="Emoji">
            <Smile size={20} />
          </button>
          <button
            className="input-action-btn"
            title="Attach"
            aria-label="Attach"
            style={{ visibility: recording ? 'hidden' : 'visible' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept={ACCEPT_TYPES} onChange={handleFileChosen} />
        </div>

        {!recording && (
          <textarea
            id="msg-input"
            ref={textareaRef}
            rows={1}
            placeholder={noteMode ? 'Private Note' : 'Type a message...'}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        )}

        <div className={`voice-recording-bar${recording ? ' active' : ''}`}>
          <span className="voice-recording-dot"></span>
          <span className="voice-recording-time">{timeLabel}</span>
          <span className="voice-recording-hint">Recording voice note…</span>
          <button className="voice-cancel-btn" onClick={cancelVoiceRecording}>Cancel</button>
        </div>

        <button
          className={`input-action-btn${recording ? ' recording' : ''}`}
          title={recording ? 'Stop & send' : 'Voice note'}
          aria-label={recording ? 'Stop & send' : 'Voice note'}
          onClick={toggleVoice}
        >
          {recording ? <Square size={16} /> : <Mic size={20} />}
        </button>
        <button
          className="send-btn"
          title="Send"
          aria-label="Send"
          style={{ display: recording ? 'none' : 'flex' }}
          onClick={submit}
        >
          <Send size={18} />
        </button>
      </div>
    </>
  );
}
