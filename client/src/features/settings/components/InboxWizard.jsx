import { useEffect, useState } from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  PartyPopper,
  Check,
  Zap,
  Hash,
  Key,
  MessageCircle,
} from 'lucide-react';
import { iconKeyToComponent } from '../../../utils/iconMap';
import { inboxesApi } from '../services/settings.service';
import useToastStore from '../../../store/toastStore';
import { roleLabel } from '../../../utils/roles';

const IW_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const STEPS = [
  { n: 1, label: 'Choose Channel' },
  { n: 2, label: 'Create Inbox' },
  { n: 3, label: 'Add Agents' },
  { n: 4, label: 'Voilà!' },
];

export default function InboxWizard({ onClose, onCreated }) {
  const showToast = useToastStore((s) => s.showToast);
  const [step, setStep] = useState(1);

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  const [inboxName, setInboxName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [authenticated, setAuthenticated] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createdInbox, setCreatedInbox] = useState(null);

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());
  const [savingAgents, setSavingAgents] = useState(false);

  useEffect(() => {
    inboxesApi
      .channels()
      .then(setChannels)
      .catch((err) => {
        console.error('[InboxWizard] channels load error:', err);
        setChannels([]);
      });
  }, []);

  useEffect(() => {
    if (step === 3) {
      setAgentsLoading(true);
      inboxesApi
        .availableAgents()
        .then(setAgents)
        .catch(() => setAgents([]))
        .finally(() => setAgentsLoading(false));
    }
  }, [step]);

  const phoneValid = !phoneNumber || IW_PHONE_REGEX.test(phoneNumber);

  function selectChannel(c) {
    if (!c.available) {
      showToast(`قناة ${c.name} قريبًا — دلوقتي واتساب بس هو الشغال فعليًا`, 'info');
      return;
    }
    setSelectedChannel(c.key);
  }

  function resetAuth() {
    setAuthenticated(null);
    setAuthStatus(null);
  }

  async function authenticate() {
    if (!phoneNumber || !phoneNumberId || !accessToken) {
      showToast('لازم تملأ الرقم و Phone Number ID و API key التلاتة الأول', 'error');
      return;
    }
    if (!IW_PHONE_REGEX.test(phoneNumber)) {
      showToast('رقم التليفون لازم يبدأ بعلامة + وميكونش فيه مسافات', 'error');
      return;
    }
    setAuthStatus({ state: 'pending', text: 'جارِ التحقق من تطابق البيانات مع ميتا...' });
    try {
      const data = await inboxesApi.authenticateWhatsapp({ phoneNumber, phoneNumberId, accessToken });
      setAuthenticated({
        phoneNumber,
        phoneNumberId,
        accessToken,
        verifiedName: data.verifiedName,
        displayPhoneNumber: data.displayPhoneNumber,
      });
      setAuthStatus({
        state: 'ok',
        text: `اتأكدنا إن الرقم متطابق: ${data.verifiedName || data.displayPhoneNumber || 'الحساب شغال'}`,
      });
    } catch (err) {
      setAuthenticated(null);
      setAuthStatus({ state: 'err', text: err.response?.data?.error || 'فشل التحقق' });
    }
  }

  function toggleAgent(id) {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function goNext() {
    if (step === 1) {
      if (!selectedChannel) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setCreating(true);
      try {
        const data = await inboxesApi.create({
          name: inboxName.trim(),
          channelType: 'whatsapp',
          phoneNumber: authenticated.phoneNumber,
          phoneNumberId: authenticated.phoneNumberId,
          accessToken: authenticated.accessToken,
        });
        setCreatedInbox(data.inbox);
        showToast('تم إنشاء الـ Inbox بنجاح ✅', 'success');
        setStep(3);
      } catch (err) {
        showToast(err.response?.data?.error || 'فشل إنشاء الـ Inbox', 'error');
      } finally {
        setCreating(false);
      }
      return;
    }
    if (step === 3) {
      setSavingAgents(true);
      try {
        await inboxesApi.setAgents(createdInbox.id, Array.from(selectedAgentIds).map(Number));
      } catch (err) {
        showToast(err.response?.data?.error || 'فشل إضافة الموظفين', 'error');
      } finally {
        setSavingAgents(false);
        setStep(4);
      }
      return;
    }
    if (step === 4) {
      onCreated();
    }
  }

  const step2Valid = inboxName.trim() && phoneNumber && phoneValid && authenticated;

  const groupedChannels = channels.reduce((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="iw-overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="iw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="iw-head">
          <div className="iw-head-title">Add Inbox</div>
          <button className="iw-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="iw-steps">
          {STEPS.map((s) => (
            <div key={s.n} className={`iw-step${step === s.n ? ' active' : ''}${step > s.n ? ' done' : ''}`}>
              <div className="iw-step-num">{s.n}</div>
              <div className="iw-step-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="iw-body">
          {step === 1 && (
            <div className="iw-panel active">
              {channels.length === 0 ? (
                <div className="iw-empty">جارِ تحميل القنوات...</div>
              ) : (
                <>
                  {Object.keys(groupedChannels).map((groupName) => (
                    <div key={groupName}>
                      <div className="iw-channel-group-title">{groupName}</div>
                      <div className="iw-channel-grid">
                        {groupedChannels[groupName].map((c) => {
                          const ChIcon = iconKeyToComponent(c.icon);
                          return (
                            <div
                              key={c.key}
                              className={`iw-channel-card${c.available ? '' : ' disabled'}${selectedChannel === c.key ? ' selected' : ''}`}
                              onClick={() => selectChannel(c)}
                            >
                              <span className={`iw-channel-badge${c.available ? '' : ' soon'}`}>
                                {c.available ? 'شغالة الآن' : 'قريبًا'}
                              </span>
                              <div className="iw-channel-icon" style={{ background: c.color }}>
                                <ChIcon size={18} />
                              </div>
                              <div className="iw-channel-name">{c.name}</div>
                              <div className="iw-channel-desc">{c.description}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="iw-protocol-note">
                    <Zap size={16} />
                    <div>
                      <b>WhatsApp Cloud API</b> بتستخدم بروتوكول Webhook (Push) الرسمي من ميتا مباشرة، وده أسرع طريقة ممكنة
                      للرسائل اللحظية.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="iw-panel active">
              <div className="iw-form-row">
                <div className="iw-form-label">API Provider</div>
                <select className="iw-input" defaultValue="whatsapp_cloud">
                  <option value="whatsapp_cloud">WhatsApp Cloud API (Meta)</option>
                  <option disabled>360Dialog — قريبًا</option>
                  <option disabled>Baileys (Unofficial) — قريبًا</option>
                </select>
              </div>
              <div className="iw-form-row">
                <div className="iw-form-label">Inbox Name</div>
                <input
                  type="text"
                  className="iw-input"
                  placeholder="مثال: واتساب الدعم الفني"
                  value={inboxName}
                  onChange={(e) => setInboxName(e.target.value)}
                />
              </div>
              <div className="iw-form-row">
                <div className="iw-form-label">Phone number</div>
                <input
                  type="text"
                  className="iw-input"
                  placeholder="+201001234567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    resetAuth();
                  }}
                />
                <div className="iw-form-hint" style={{ color: phoneValid ? 'var(--text-secondary)' : 'var(--danger)' }}>
                  لازم يبدأ بعلامة <b>+</b> وميكونش فيه أي مسافات (مثال: +201001234567).
                </div>
              </div>
              <div className="iw-form-row">
                <div className="iw-form-label">
                  <Hash size={13} /> Phone number ID
                </div>
                <input
                  type="text"
                  className="iw-input"
                  placeholder="من Meta App → WhatsApp → API Setup"
                  value={phoneNumberId}
                  onChange={(e) => {
                    setPhoneNumberId(e.target.value);
                    resetAuth();
                  }}
                />
              </div>
              <div className="iw-form-row">
                <div className="iw-form-label">
                  <Key size={13} /> API key
                </div>
                <input
                  type="password"
                  className="iw-input"
                  placeholder="Permanent Access Token"
                  value={accessToken}
                  onChange={(e) => {
                    setAccessToken(e.target.value);
                    resetAuth();
                  }}
                />
                <div className="iw-form-hint">
                  هنتأكد من ميتا إن الرقم و الـ Phone Number ID والـ API key التلاتة دول بتوع بعض فعلاً قبل ما ننشئ الـ Inbox.
                </div>
              </div>
              <div className="iw-verify-row">
                <button className="iw-btn iw-btn-primary" style={{ flexShrink: 0 }} onClick={authenticate}>
                  <ShieldCheck size={14} /> Authenticate
                </button>
                {authStatus && (
                  <div className={`iw-verify-status ${authStatus.state}`}>
                    {authStatus.state === 'pending' && <Loader2 size={14} style={{ animation: 'iw-spin .7s linear infinite' }} />}
                    {authStatus.state === 'ok' && <CheckCircle2 size={15} />}
                    {authStatus.state === 'err' && <XCircle size={15} />} {authStatus.text}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="iw-panel active">
              <div className="iw-form-label" style={{ marginBottom: 12 }}>
                اختار الموظفين اللي هيشتغلوا على الـ Inbox ده
              </div>
              <div className="iw-agent-list">
                {agentsLoading ? (
                  <div className="iw-empty">جارِ تحميل الموظفين...</div>
                ) : agents.length === 0 ? (
                  <div className="iw-empty">مفيش موظفين متاحين — ضيف موظف من صفحة Agents الأول</div>
                ) : (
                  agents.map((a) => {
                    const isSelected = selectedAgentIds.has(String(a.id));
                    return (
                      <div
                        key={a.id}
                        className={`iw-agent-row${isSelected ? ' selected' : ''}`}
                        onClick={() => toggleAgent(a.id)}
                      >
                        <div className="iw-agent-check">{isSelected && <Check size={12} />}</div>
                        <div className="iw-agent-name">{a.display_name || a.email}</div>
                        <div className="iw-agent-role">{roleLabel(a.role)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="iw-panel active">
              <div className="iw-success">
                <div className="iw-success-icon">
                  <PartyPopper size={34} />
                </div>
                <div className="iw-success-title">Voilà! You are all set to go!</div>
                <div className="iw-success-desc">
                  الـ Inbox جاهز فعليًا ومتربط بحساب واتساب الحقيقي بتاعك — أي رسالة توصل على الرقم ده هتظهر لايف في المحادثات
                  فورًا.
                </div>
                {createdInbox && (
                  <div className="iw-success-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <MessageCircle size={16} color="var(--success)" />
                      <b>{createdInbox.name}</b>
                    </div>
                    <div>
                      الرقم:{' '}
                      {createdInbox.phone_number || createdInbox.display_phone_number || createdInbox.phone_number_id || '—'}
                    </div>
                    <div>الموظفين المضافين: {selectedAgentIds.size}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="iw-foot">
          <button
            className="iw-btn iw-btn-ghost"
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ArrowRight size={14} /> رجوع
          </button>
          <button
            className="iw-btn iw-btn-primary"
            disabled={(step === 1 && !selectedChannel) || (step === 2 && (!step2Valid || creating)) || savingAgents}
            onClick={goNext}
          >
            {step === 2 && creating
              ? 'جارِ الإنشاء...'
              : step === 3 && savingAgents
                ? 'جارِ الحفظ...'
                : step === 3
                  ? 'إضافة الموظفين والمتابعة'
                  : step === 4
                    ? 'تمام، يلا بينا'
                    : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  );
}
