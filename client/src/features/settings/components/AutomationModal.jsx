import { useEffect, useState } from 'react';
import { Workflow, MessageCircle, Check, Trash2, CalendarX, Star } from 'lucide-react';
import { agentsSettingsApi, teamsApi } from '../services/settings.service';
import Modal from '../../../components/ui/Modal';

const WELCOME_SCHEDULE_DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WELCOME_SCHEDULE_DAY_LABELS = {
  sun: 'الأحد',
  mon: 'الاثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  sat: 'السبت',
};
const DEFAULT_DAY = { enabled: false, start: '09:00', end: '17:00' };

const RULE_META = {
  auto_assign: {
    title: 'Auto-assign new WhatsApp conversations',
    icon: Workflow,
    enableDesc: 'When a new conversation is created, assign it immediately',
  },
  welcome: {
    title: 'Send welcome message',
    icon: MessageCircle,
    enableDesc: 'Send a fixed reply automatically to every new conversation',
    messageLabel: 'Welcome message sent to the customer',
    messageHint: 'This exact text is sent automatically as soon as a new conversation is opened.',
    placeholder: 'شكراً لتواصلكم معنا! أحد ممثلي خدمة العملاء هيرد عليكم في أقرب وقت.',
  },
  csat: {
    title: 'Send CSAT after resolution',
    icon: Workflow,
    enableDesc: 'Send a satisfaction survey right after a conversation is resolved',
    messageLabel: 'CSAT message sent to the customer',
    messageHint: 'This exact text is sent automatically the moment an agent resolves the conversation.',
    placeholder: 'شكراً لتواصلكم معنا! برجاء تقييم تجربتكم اليوم من 1 لـ 5.',
  },
  keyword_routing: {
    title: 'Route conversations by keyword',
    icon: Workflow,
    enableDesc: 'When a customer message matches any of the keywords, move the conversation to the selected team',
  },
  contract_expired: {
    title: 'عقد الصيانة منتهي',
    icon: CalendarX,
    enableDesc:
      'لما عقد صيانة عميل يعدّي تاريخ نهايته من غير تجديد، ابعتله الرسالة دي أوتوماتيك مرة واحدة بس لكل عقد (تفعيل/إيقاف الرد على كل رسالة تاني متاح تحت كخيار منفصل)',
    messageLabel: 'الرسالة اللي هتتبعت للعميل',
    messageHint:
      'نفس النص ده بيتبعت مرة واحدة بس لكل عقد (الخيار فوق)، وكمان مع كل رسالة يبعتها العميل بعد كده لو فعّلت خيار "الرد على كل رسالة" تحت.',
    placeholder: 'عزيزي العميل، عقد الصيانة الخاص بيك انتهى. للتجديد وضمان استمرار الخدمة، برجاء التواصل معانا 🙏',
    repeatToggleLabel: 'الرد بنفس الرسالة على كل رسالة بعد كده',
    repeatToggleDesc: 'لو مفعّل، هيتبعت نفس النص للعميل مع كل رسالة يبعتها بعد انتهاء العقد (مش مرة واحدة بس) — لحد ما العقد يتجدد أو توقف الخيار ده',
  },
  rating: {
    title: 'تقييم بعد الحل (Post-Resolve Rating)',
    icon: Star,
    enableDesc: 'لما محادثة تتقفل (Resolve)، ابعت للعميل تقييم نجوم لحل المشكلة + تقييم نجوم لممثل الدعم + تعليق نصي اختياري',
  },
};

export default function AutomationModal({ type, settings, onClose, onSaved }) {
  const meta = RULE_META[type];
  const s = settings || {};

  const [enabled, setEnabled] = useState(
    type === 'auto_assign'
      ? !!s.auto_assign_enabled
      : type === 'welcome'
        ? !!s.welcome_enabled
        : type === 'csat'
          ? !!s.csat_enabled
          : type === 'contract_expired'
            ? !!s.contract_expired_enabled
            : type === 'rating'
              ? !!s.rating_enabled
              : !!s.keyword_routing_enabled
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(!!s.contract_expired_repeat_enabled);

  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState(s.auto_assign_agent_id || '');

  const [message, setMessage] = useState((type === 'welcome' ? s.welcome_message : type === 'contract_expired' ? s.contract_expired_message : s.csat_message) || '');
  const [useSchedule, setUseSchedule] = useState(!!s.welcome_schedule_enabled);
  const [offHoursMessage, setOffHoursMessage] = useState(s.welcome_offhours_message || '');
  const [days, setDays] = useState(() => {
    const existing = (s.welcome_schedule && s.welcome_schedule.days) || {};
    const merged = {};
    WELCOME_SCHEDULE_DAY_ORDER.forEach((k) => {
      merged[k] = { ...DEFAULT_DAY, ...(existing[k] || {}) };
    });
    return merged;
  });

  const [teams, setTeams] = useState([]);
  const [rules, setRules] = useState(
    Array.isArray(s.keyword_routing_rules)
      ? s.keyword_routing_rules.map((r) => ({ team_id: r.team_id || null, keywords: [...(r.keywords || [])] }))
      : []
  );
  const [kwDraft, setKwDraft] = useState({});

  useEffect(() => {
    if (type === 'auto_assign')
      agentsSettingsApi
        .list()
        .then(setAgents)
        .catch(() => {});
    if (type === 'keyword_routing')
      teamsApi
        .list()
        .then(setTeams)
        .catch(() => {});
  }, [type]);

  function updateDay(key, patch) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function addRule() {
    setRules((prev) => [...prev, { team_id: null, keywords: [] }]);
  }
  function removeRule(idx) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }
  function setRuleTeam(idx, teamId) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, team_id: teamId ? Number(teamId) : null } : r)));
  }
  function addKeyword(idx) {
    const value = (kwDraft[idx] || '').trim();
    if (!value) return;
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (r.keywords.some((k) => k.toLowerCase() === value.toLowerCase())) return r;
        return { ...r, keywords: [...r.keywords, value] };
      })
    );
    setKwDraft((prev) => ({ ...prev, [idx]: '' }));
  }
  function removeKeyword(idx, kwIdx) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, keywords: r.keywords.filter((_, k) => k !== kwIdx) } : r)));
  }

  async function save() {
    setError('');
    const body = {};

    if (type === 'auto_assign') {
      if (enabled && !agentId) return setError('لازم تختار الإيجنت اللي هيتعينله المحادثات الجديدة الأول');
      body.auto_assign_enabled = enabled;
      body.auto_assign_agent_id = agentId ? Number(agentId) : null;
    } else if (type === 'rating') {
      body.rating_enabled = enabled;
    } else if (type === 'keyword_routing') {
      const completeRules = rules.filter((r) => r.team_id && r.keywords.length);
      if (enabled && !completeRules.length) return setError('لازم تضيف قاعدة واحدة كاملة على الأقل (تيم + كلمة مفتاحية)');
      body.keyword_routing_enabled = enabled;
      body.keyword_routing_rules = completeRules;
    } else if (type === 'contract_expired') {
      const text = message.trim();
      if ((enabled || repeatEnabled) && !text) return setError('لازم تكتب نص الرسالة الأول');
      body.contract_expired_enabled = enabled;
      body.contract_expired_message = text;
      body.contract_expired_repeat_enabled = repeatEnabled;
    } else {
      const text = message.trim();
      if (enabled && !text) return setError('لازم تكتب نص الرسالة الأول');
      if (type === 'welcome') {
        body.welcome_enabled = enabled;
        body.welcome_message = text;
        body.welcome_schedule_enabled = useSchedule;
        if (useSchedule) {
          const offText = offHoursMessage.trim();
          if (enabled && !offText) return setError('لازم تكتب رسالة "خارج أوقات العمل" الأول');
          const hasEnabledDay = WELCOME_SCHEDULE_DAY_ORDER.some((k) => days[k].enabled);
          if (enabled && !hasEnabledDay) return setError('لازم تفعّل يوم واحد على الأقل في جدول أوقات العمل');
          body.welcome_offhours_message = offText;
          body.welcome_schedule = { timezone: 'Africa/Cairo', days };
        }
      } else {
        body.csat_enabled = enabled;
        body.csat_message = text;
      }
    }

    setSaving(true);
    try {
      await onSaved(body);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }

  const Icon = meta.icon;

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <Icon size={22} />
        </div>
        <div className="resolve-modal-title">{meta.title}</div>
      </div>

      <div className="setting-row" style={{ border: 'none', paddingTop: 0 }}>
        <div className="setting-desc">{meta.enableDesc}</div>
        <button className={`toggle${enabled ? ' on' : ''}`} onClick={() => setEnabled((v) => !v)}></button>
      </div>

      {type === 'auto_assign' && (
        <div style={{ marginTop: 8 }}>
          <div className="resolve-cats-label">Assign new conversations to</div>
          <select className="iw-input" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Select an agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.display_name || a.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {(type === 'welcome' || type === 'csat' || type === 'contract_expired') && (
        <div style={{ marginTop: 8 }}>
          <div className="resolve-cats-label">
            {useSchedule && type === 'welcome' ? 'رسالة الترحيب في أوقات العمل' : meta.messageLabel}
          </div>
          <textarea
            className="resolve-notes"
            style={{ marginBottom: 6 }}
            placeholder={meta.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="iw-form-hint" style={{ marginBottom: 12 }}>
            {useSchedule && type === 'welcome'
              ? 'بتتبعت للعميل لو المحادثة الجديدة اتفتحت داخل الجدول المحدد تحت.'
              : meta.messageHint}
          </div>

          {type === 'welcome' && (
            <>
              <div className="setting-row" style={{ border: 'none', padding: '6px 0' }}>
                <div className="setting-label" style={{ fontSize: 12.5 }}>
                  استخدام رسالتين حسب أوقات العمل
                </div>
                <button className={`toggle${useSchedule ? ' on' : ''}`} onClick={() => setUseSchedule((v) => !v)}></button>
              </div>
              {useSchedule && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {WELCOME_SCHEDULE_DAY_ORDER.map((key) => (
                      <div
                        key={key}
                        className="setting-row"
                        style={{ padding: '6px 0', border: 'none', flexWrap: 'wrap', gap: 8 }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            minWidth: 90,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={days[key].enabled}
                            onChange={(e) => updateDay(key, { enabled: e.target.checked })}
                            style={{ width: 16, height: 16 }}
                          />
                          {WELCOME_SCHEDULE_DAY_LABELS[key]}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="time"
                            className="iw-input"
                            style={{ width: 'auto', padding: '6px 8px', fontSize: 12.5 }}
                            value={days[key].start}
                            onChange={(e) => updateDay(key, { start: e.target.value })}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>إلى</span>
                          <input
                            type="time"
                            className="iw-input"
                            style={{ width: 'auto', padding: '6px 8px', fontSize: 12.5 }}
                            value={days[key].end}
                            onChange={(e) => updateDay(key, { end: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="resolve-cats-label">رسالة خارج أوقات العمل</div>
                  <textarea
                    className="resolve-notes"
                    placeholder="رسالة تتبعت لو العميل كتب خارج جدول أوقات العمل"
                    value={offHoursMessage}
                    onChange={(e) => setOffHoursMessage(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {type === 'contract_expired' && (
            <div className="setting-row" style={{ border: 'none', padding: '6px 0 14px' }}>
              <div>
                <div className="setting-label">{meta.repeatToggleLabel}</div>
                <div className="setting-desc">{meta.repeatToggleDesc}</div>
              </div>
              <button className={`toggle${repeatEnabled ? ' on' : ''}`} onClick={() => setRepeatEnabled((v) => !v)}></button>
            </div>
          )}
        </div>
      )}

      {type === 'keyword_routing' && (
        <div style={{ marginTop: 8 }}>
          {rules.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              لسه مفيش قواعد مضافة — دوس "Add another team rule" عشان تبدأ
            </div>
          )}
          {rules.map((rule, idx) => (
            <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <select
                  className="iw-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  value={rule.team_id || ''}
                  onChange={(e) => setRuleTeam(idx, e.target.value)}
                >
                  <option value="">Select a team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  className="st-icon-btn"
                  title="مسح القاعدة دي"
                  aria-label="مسح القاعدة دي"
                  onClick={() => removeRule(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {rule.keywords.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>لسه مفيش كلمات مضافة لقاعدة التيم دي</div>
                ) : (
                  rule.keywords.map((kw, kwIdx) => (
                    <span
                      key={kwIdx}
                      className="label-chip"
                      style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--primary)' }}
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(idx, kwIdx)}
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(0,0,0,0.08)',
                          color: 'inherit',
                          cursor: 'pointer',
                          marginInlineStart: 2,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <input
                className="iw-input"
                style={{ marginBottom: 0 }}
                placeholder="اكتب كلمة واضغط Enter عشان تضيفها"
                value={kwDraft[idx] || ''}
                onChange={(e) => setKwDraft((prev) => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
                    e.preventDefault();
                    addKeyword(idx);
                  }
                }}
              />
            </div>
          ))}
          <button className="resolve-cancel-btn" style={{ width: '100%' }} onClick={addRule}>
            + Add another team rule
          </button>
        </div>
      )}

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          إلغاء
        </button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={save}>
          <Check size={16} /> {saving ? 'جارِ الحفظ...' : 'Save'}
        </button>
      </div>
      {error && (
        <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
