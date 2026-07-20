import { useEffect, useState } from 'react';
import { Webhook, Plus, Copy } from 'lucide-react';
import { webhooksApi } from '../services/settings.service';
import { formatMessageTimestamp } from '../../../utils/dateFormat';
import useToastStore from '../../../store/toastStore';
import Modal from '../../../components/ui/Modal';

const WEBHOOK_EVENT_LABELS = {
  conversation_created: 'Conversation Created',
  conversation_status_changed: 'Conversation Status Changed',
  conversation_updated: 'Conversation Updated',
  message_created: 'Message created',
  message_updated: 'Message updated',
  webwidget_triggered: 'Live chat widget opened by the user',
  contact_created: 'Contact created',
  contact_updated: 'Contact updated',
};

export default function WebhooksModal({ onClose, onChanged }) {
  const showToast = useToastStore((s) => s.showToast);
  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [addError, setAddError] = useState('');
  const [testingId, setTestingId] = useState(null);

  function load() {
    setLoading(true);
    webhooksApi
      .list()
      .then((data) => {
        setWebhooks(data.webhooks || []);
        setAvailableEvents(data.available_events || []);
        onChanged?.((data.webhooks || []).length);
      })
      .catch((err) => console.error('[API] loadWebhooksList error:', err))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  function toggleEventChoice(evt) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(evt)) next.delete(evt);
      else next.add(evt);
      return next;
    });
  }

  async function createWebhook() {
    setAddError('');
    const trimmed = url.trim();
    if (!trimmed) return setAddError('لازم تكتب رابط الـ Webhook الأول');
    if (selectedEvents.size === 0) return setAddError('لازم تختار حدث واحد على الأقل');
    try {
      await webhooksApi.create({ url: trimmed, events: Array.from(selectedEvents) });
      setUrl('');
      setSelectedEvents(new Set());
      showToast('تمت إضافة الـ Webhook بنجاح', 'success');
      load();
    } catch (err) {
      setAddError(err.response?.data?.error || 'فشل إضافة الـ Webhook');
    }
  }

  async function toggleEnabled(wh) {
    setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? { ...w, enabled: !w.enabled } : w)));
    try {
      await webhooksApi.update(wh.id, { enabled: !wh.enabled });
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل تحديث حالة الـ Webhook', 'error');
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? { ...w, enabled: wh.enabled } : w)));
    }
  }

  async function testNow(id) {
    setTestingId(id);
    try {
      const data = await webhooksApi.test(id);
      showToast(
        data.delivered ? 'وصل الحدث التجريبي بنجاح ✅' : 'اتبعت الحدث بس السيرفر بتاعك رد بخطأ ⚠️',
        data.delivered ? 'success' : 'error'
      );
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل إرسال حدث تجريبي', 'error');
    } finally {
      setTestingId(null);
    }
  }

  async function deleteWebhook(id) {
    if (!window.confirm('متأكد إنك عايز تمسح الـ Webhook ده؟ الإجراء ده نهائي.')) return;
    try {
      await webhooksApi.remove(id);
      showToast('تم مسح الـ Webhook', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل مسح الـ Webhook', 'error');
    }
  }

  function copySecret(secret) {
    navigator.clipboard
      .writeText(secret)
      .then(() => showToast('اتنسخ الـ Secret كامل', 'success'))
      .catch(() => showToast('تعذر النسخ — انسخه يدويًا: ' + secret, 'error'));
  }

  return (
    <Modal onClose={onClose} width={520}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <Webhook size={22} />
        </div>
        <div className="resolve-modal-title">Webhooks</div>
      </div>
      <div className="resolve-modal-sub" style={{ paddingRight: 0, marginBottom: 16 }}>
        Get a real HTTP POST request sent to your own server the moment a conversation event happens (new message, reply,
        resolve...), signed so you can verify it's really from NileChat.
      </div>

      <div style={{ marginBottom: 6 }}>
        {loading && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '8px 0' }}>جارِ التحميل…</div>}
        {!loading && webhooks.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '8px 0' }}>
            لسه مفيش Webhooks متسجلة — ضيف واحد تحت
          </div>
        )}
        {!loading &&
          webhooks.map((wh) => (
            <div key={wh.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, wordBreak: 'break-all' }}>{wh.url}</div>
                <button
                  className={`toggle${wh.enabled ? ' on' : ''}`}
                  title="تفعيل/إيقاف"
                  aria-label="تفعيل/إيقاف"
                  onClick={() => toggleEnabled(wh)}
                ></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {wh.events.map((e) => (
                  <span key={e} className="label-chip" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--primary)' }}>
                    {WEBHOOK_EVENT_LABELS[e] || e}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11.5, marginBottom: 8 }}>
                {!wh.last_triggered_at ? (
                  <span style={{ color: 'var(--text-secondary)' }}>لسه معملش أي محاولة إرسال</span>
                ) : wh.last_error ? (
                  <span style={{ color: 'var(--danger)' }}>
                    آخر محاولة ({formatMessageTimestamp(wh.last_triggered_at)}) فشلت: {wh.last_error}
                  </span>
                ) : (
                  <span style={{ color: 'var(--success)' }}>
                    آخر محاولة ({formatMessageTimestamp(wh.last_triggered_at)}) نجحت — HTTP {wh.last_status_code}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                }}
              >
                <span>Secret:</span>
                <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 6, fontSize: 11 }}>
                  {wh.secret.slice(0, 8)}••••••••
                </code>
                <button
                  className="st-icon-btn"
                  title="نسخ الـ Secret كامل"
                  aria-label="نسخ الـ Secret كامل"
                  onClick={() => copySecret(wh.secret)}
                >
                  <Copy size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="resolve-cancel-btn"
                  style={{ flex: 1, padding: 7 }}
                  disabled={testingId === wh.id}
                  onClick={() => testNow(wh.id)}
                >
                  {testingId === wh.id ? 'جارِ الإرسال…' : 'Send test event'}
                </button>
                <button
                  className="resolve-cancel-btn"
                  style={{ flex: 1, padding: 7, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => deleteWebhook(wh.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 16 }}>
        <div className="resolve-cats-label">Add a new webhook</div>
        <input
          className="iw-input"
          placeholder="https://your-server.com/nilechat-events"
          style={{ marginBottom: 12 }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="resolve-cats-label" style={{ marginTop: 0 }}>
          Events to send
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, margin: '8px 0 12px' }}>
          {availableEvents.map((evt) => (
            <label key={evt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedEvents.has(evt)}
                onChange={() => toggleEventChoice(evt)}
                style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
              />
              {WEBHOOK_EVENT_LABELS[evt] || evt}
            </label>
          ))}
        </div>
        {addError && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 8 }}>{addError}</div>}
        <button className="resolve-confirm-btn" style={{ width: '100%' }} onClick={createWebhook}>
          <Plus size={15} /> Add Webhook
        </button>
      </div>

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
