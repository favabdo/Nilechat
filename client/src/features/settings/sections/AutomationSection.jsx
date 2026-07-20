import { useEffect, useState } from 'react';
import { Workflow, MessageCircle, Pencil, CalendarX, Star } from 'lucide-react';
import { companyApi } from '../services/settings.service';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import AutomationModal from '../components/AutomationModal';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

function autoAssignDesc(s) {
  return s.auto_assign_enabled && s.auto_assign_agent_name
    ? `When conversation is created → Assign to ${s.auto_assign_agent_name}`
    : 'When conversation is created → Assign to selected agent (disabled)';
}
function welcomeDesc(s) {
  if (s.welcome_enabled && s.welcome_schedule_enabled && s.welcome_message) {
    return 'When conversation is created → Send message based on business hours schedule (2 messages)';
  }
  if (s.welcome_enabled && s.welcome_message) {
    return `When conversation is created → Send: "${s.welcome_message.slice(0, 60)}${s.welcome_message.length > 60 ? '…' : ''}"`;
  }
  return 'When conversation is created → Send a fixed auto-reply (disabled)';
}
function csatDesc(s) {
  return s.csat_enabled && s.csat_message
    ? `When conversation is resolved → Send: "${s.csat_message.slice(0, 60)}${s.csat_message.length > 60 ? '…' : ''}"`
    : 'When conversation is resolved → Send satisfaction survey (disabled)';
}
function keywordRoutingDesc(s) {
  const rules = (s.keyword_routing_rules || []).filter((r) => r.team_id && r.keywords && r.keywords.length);
  if (!(s.keyword_routing_enabled && rules.length))
    return 'When message contains chosen keywords → Assign to selected team (disabled)';
  if (rules.length === 1) {
    const kws = rules[0].keywords;
    const preview = kws
      .slice(0, 3)
      .map((k) => `"${k}"`)
      .join(' or ');
    return `When message contains ${preview}${kws.length > 3 ? '…' : ''} → Assign to ${rules[0].team_name || 'selected team'}`;
  }
  return `${rules.length} keyword rules active → Routes to: ${rules.map((r) => r.team_name || 'team').join(', ')}`;
}
function contractExpiredDesc(s) {
  const repeatSuffix = s.contract_expired_repeat_enabled ? ' + رد على كل رسالة بعد كده' : '';
  if (s.contract_expired_enabled && s.contract_expired_message) {
    return `لما عقد الصيانة ينتهي → رسالة واحدة${repeatSuffix}`;
  }
  if (s.contract_expired_repeat_enabled && s.contract_expired_message) {
    return `لما عقد الصيانة ينتهي → رد على كل رسالة`;
  }
  return 'لما عقد صيانة عميل يعدّي تاريخ نهايته من غير تجديد → يتبعتله رسالة أتمتة مرة واحدة (معطّل)';
}
function ratingDesc(s) {
  return s.rating_enabled
    ? 'لما محادثة تتقفل (Resolve) → يتبعت تقييم نجوم لحل المشكلة + تقييم نجوم لممثل الدعم + تعليق نصي اختياري'
    : 'لما محادثة تتقفل (Resolve) → تقييم نجوم لحل المشكلة وللدعم (معطّل)';
}

const RULES = [
  {
    key: 'auto_assign',
    title: 'Auto-assign new WhatsApp conversations',
    icon: Workflow,
    color: 'var(--primary)',
    bg: 'rgba(108,92,231,0.1)',
    desc: autoAssignDesc,
    enabledKey: 'auto_assign_enabled',
  },
  {
    key: 'welcome',
    title: 'Send welcome message',
    icon: MessageCircle,
    color: 'var(--secondary)',
    bg: 'rgba(0,210,255,0.1)',
    desc: welcomeDesc,
    enabledKey: 'welcome_enabled',
  },
  {
    key: 'keyword_routing',
    title: 'Route conversations by keyword',
    icon: Workflow,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.1)',
    desc: keywordRoutingDesc,
    enabledKey: 'keyword_routing_enabled',
  },
  {
    key: 'csat',
    title: 'Send CSAT after resolution',
    icon: Workflow,
    color: 'var(--success)',
    bg: 'rgba(16,185,129,0.1)',
    desc: csatDesc,
    enabledKey: 'csat_enabled',
  },
  {
    key: 'contract_expired',
    title: 'عقد الصيانة منتهي',
    icon: CalendarX,
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.1)',
    desc: contractExpiredDesc,
    enabledKey: 'contract_expired_enabled',
  },
  {
    key: 'rating',
    title: 'تقييم بعد الحل (Post-Resolve Rating)',
    icon: Star,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.1)',
    desc: ratingDesc,
    enabledKey: 'rating_enabled',
  },
];

export default function AutomationSection() {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const canEdit = isOwnerOrAdmin(user);

  const [settings, setSettings] = useState(null);
  const [modalType, setModalType] = useState(null);

  function load() {
    companyApi
      .getAutomationSettings()
      .then(setSettings)
      .catch((err) => console.error('[API] loadAutomationSettings error:', err));
  }
  useEffect(load, []);

  async function patch(body) {
    try {
      const data = await companyApi.updateAutomationSettings(body);
      setSettings(data);
      return data;
    } catch (err) {
      console.error('[API] patchAutomationSettings error:', err);
      showToast(err.response?.data?.error || 'فشل حفظ إعدادات الأتمتة', 'error');
      throw err;
    }
  }

  async function quickToggle(rule) {
    if (!canEdit || !settings) return;
    const s = settings;
    if (rule.key === 'auto_assign' && !s.auto_assign_enabled && !s.auto_assign_agent_id) return setModalType('auto_assign');
    if (rule.key === 'welcome' && !s.welcome_enabled && !s.welcome_message) return setModalType('welcome');
    if (rule.key === 'csat' && !s.csat_enabled && !s.csat_message) return setModalType('csat');
    if (rule.key === 'contract_expired' && !s.contract_expired_enabled && !s.contract_expired_message) return setModalType('contract_expired');
    if (rule.key === 'keyword_routing') {
      const hasComplete = (s.keyword_routing_rules || []).some((r) => r.team_id && r.keywords && r.keywords.length);
      if (!s.keyword_routing_enabled && !hasComplete) return setModalType('keyword_routing');
    }
    await patch({ [rule.enabledKey]: !s[rule.enabledKey] }).catch(() => {});
  }

  if (!settings) {
    return (
      <div className="settings-content-section active" id="settings-sec-automation">
        <div className="page-content">
          <div className="settings-top-row">
            <div>
              <h2>Automation</h2>
              <div className="settings-top-desc">Rules that act automatically on conversations</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>جارِ التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-content-section active" id="settings-sec-automation">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>Automation</h2>
            <div className="settings-top-desc">Rules that act automatically on conversations</div>
          </div>
        </div>

        {RULES.map((rule) => {
          const Icon = rule.icon;
          return (
            <div className="rule-row" key={rule.key}>
              <div className="rule-row-left">
                <div className="rule-row-icon" style={{ background: rule.bg, color: rule.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="rule-row-title">{rule.title}</div>
                  <div className="rule-row-desc">{rule.desc(settings)}</div>
                </div>
              </div>
              <div className="rule-row-right">
                <button
                  className={`toggle${settings[rule.enabledKey] ? ' on' : ''}`}
                  disabled={!canEdit}
                  onClick={() => quickToggle(rule)}
                ></button>
                {canEdit && (
                  <button className="st-icon-btn" onClick={() => setModalType(rule.key)}>
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalType && (
        <AutomationModal
          type={modalType}
          settings={settings}
          onClose={() => setModalType(null)}
          onSaved={async (body) => {
            await patch(body);
            setModalType(null);
            showToast('اتحفظت إعدادات الأتمتة بنجاح', 'success');
          }}
        />
      )}
    </div>
  );
}
