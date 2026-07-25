import { useEffect, useState } from 'react';
import { Workflow, MessageCircle, Pencil, CalendarX, Star } from 'lucide-react';
import { companyApi } from '../services/settings.service';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import useTranslation from '../../../i18n/useTranslation';
import AutomationModal from '../components/AutomationModal';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

function autoAssignDesc(s, t) {
  return s.auto_assign_enabled && s.auto_assign_agent_name
    ? t('settings.ruleAutoAssignOnCreate', { agent: s.auto_assign_agent_name })
    : t('settings.ruleAutoAssignDisabled');
}
function welcomeDesc(s, t) {
  if (s.welcome_enabled && s.welcome_schedule_enabled && s.welcome_message) {
    return t('settings.ruleWelcomeSchedule');
  }
  if (s.welcome_enabled && s.welcome_message) {
    const message = `${s.welcome_message.slice(0, 60)}${s.welcome_message.length > 60 ? '…' : ''}`;
    return t('settings.ruleWelcomeSend', { message });
  }
  return t('settings.ruleWelcomeDisabled');
}
function csatDesc(s, t) {
  if (!(s.csat_enabled && s.csat_message)) return t('settings.ruleCsatDisabled');
  const message = `${s.csat_message.slice(0, 60)}${s.csat_message.length > 60 ? '…' : ''}`;
  return t('settings.ruleCsatSend', { message });
}
function keywordRoutingDesc(s, t) {
  const rules = (s.keyword_routing_rules || []).filter((r) => r.team_id && r.keywords && r.keywords.length);
  if (!(s.keyword_routing_enabled && rules.length)) return t('settings.ruleKeywordDisabled');
  if (rules.length === 1) {
    const kws = rules[0].keywords;
    const preview = kws
      .slice(0, 3)
      .map((k) => `"${k}"`)
      .join(` ${t('common.or')} `);
    return t('settings.ruleKeywordSingle', {
      preview: `${preview}${kws.length > 3 ? '…' : ''}`,
      team: rules[0].team_name || t('settings.ruleKeywordSelectedTeam'),
    });
  }
  return t('settings.ruleKeywordMultiple', {
    count: rules.length,
    teams: rules.map((r) => r.team_name || t('settings.ruleKeywordTeamFallback')).join(', '),
  });
}
function contractExpiredDesc(s, t) {
  const repeatSuffix = s.contract_expired_repeat_enabled ? t('settings.ruleContractExpiredRepeatSuffix') : '';
  if (s.contract_expired_enabled && s.contract_expired_message) {
    return t('settings.ruleContractExpiredOnce', { suffix: repeatSuffix });
  }
  if (s.contract_expired_repeat_enabled && s.contract_expired_message) {
    return t('settings.ruleContractExpiredRepeat');
  }
  return t('settings.ruleContractExpiredDisabled');
}
function ratingDesc(s, t) {
  return s.rating_enabled ? t('settings.ruleRatingEnabled') : t('settings.ruleRatingDisabled');
}

const RULES = [
  {
    key: 'auto_assign',
    titleKey: 'settings.ruleAutoAssignTitle',
    icon: Workflow,
    color: 'var(--primary)',
    bg: 'rgba(108,92,231,0.1)',
    desc: autoAssignDesc,
    enabledKey: 'auto_assign_enabled',
  },
  {
    key: 'welcome',
    titleKey: 'settings.ruleWelcomeTitle',
    icon: MessageCircle,
    color: 'var(--secondary)',
    bg: 'rgba(0,210,255,0.1)',
    desc: welcomeDesc,
    enabledKey: 'welcome_enabled',
  },
  {
    key: 'keyword_routing',
    titleKey: 'settings.ruleKeywordTitle',
    icon: Workflow,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.1)',
    desc: keywordRoutingDesc,
    enabledKey: 'keyword_routing_enabled',
  },
  {
    key: 'csat',
    titleKey: 'settings.ruleCsatTitle',
    icon: Workflow,
    color: 'var(--success)',
    bg: 'rgba(16,185,129,0.1)',
    desc: csatDesc,
    enabledKey: 'csat_enabled',
  },
  {
    key: 'contract_expired',
    titleKey: 'settings.ruleContractExpiredTitle',
    icon: CalendarX,
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.1)',
    desc: contractExpiredDesc,
    enabledKey: 'contract_expired_enabled',
  },
  {
    key: 'rating',
    titleKey: 'settings.ruleRatingTitle',
    icon: Star,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.1)',
    desc: ratingDesc,
    enabledKey: 'rating_enabled',
  },
];

export default function AutomationSection() {
  const { t } = useTranslation();
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
      showToast(err.response?.data?.error || t('settings.saveAutomationFailed'), 'error');
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
              <h2>{t('settings.automation')}</h2>
              <div className="settings-top-desc">{t('settings.automationDesc')}</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-content-section active" id="settings-sec-automation">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>{t('settings.automation')}</h2>
            <div className="settings-top-desc">{t('settings.automationDesc')}</div>
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
                  <div className="rule-row-title">{t(rule.titleKey)}</div>
                  <div className="rule-row-desc">{rule.desc(settings, t)}</div>
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
            showToast(t('settings.automationSavedSuccess'), 'success');
          }}
        />
      )}
    </div>
  );
}
