import { useState } from 'react';
import { ArrowLeft, Settings2, Users, UsersRound, Inbox, Tag, Workflow, Plug } from 'lucide-react';
import GeneralSection from '../sections/GeneralSection';
import AgentsSection from '../sections/AgentsSection';
import TeamsSection from '../sections/TeamsSection';
import InboxesSection from '../sections/InboxesSection';
import LabelsSettingsSection from '../sections/LabelsSettingsSection';
import AutomationSection from '../sections/AutomationSection';
import IntegrationsSection from '../sections/IntegrationsSection';
import useTranslation from '../../../i18n/useTranslation';

const NAV_ITEMS = [
  { key: 'general', labelKey: 'settings.accountSettings', icon: Settings2 },
  { key: 'agents', labelKey: 'settings.agents', icon: Users },
  { key: 'teams', labelKey: 'settings.teams', icon: UsersRound },
  { key: 'inboxes', labelKey: 'settings.inboxes', icon: Inbox },
  { key: 'labels', labelKey: 'settings.labels', icon: Tag },
  { key: 'automation', labelKey: 'settings.automation', icon: Workflow },
  { key: 'integrations', labelKey: 'settings.integrations', icon: Plug },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState('general');
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(key) {
    setSection(key);
    setMobileOpen(true);
  }

  return (
    <div id="page-settings" className="page">
      <div id="settings-layout" className={mobileOpen ? 'mobile-section-open' : ''}>
        <aside id="settings-sidebar">
          <div className="settings-sidebar-title">{t('sidebar.settings')}</div>
          {NAV_ITEMS.map(({ key, labelKey, icon: Icon }) => (
            <button key={key} className={`settings-nav-item${section === key ? ' active' : ''}`} onClick={() => navigate(key)}>
              <Icon size={16} /> {t(labelKey)}
            </button>
          ))}
        </aside>

        <div id="settings-content-panel">
          <div className="settings-back-row">
            <button
              className="mobile-back-btn"
              title={t('settings.backToSettingsMenu')}
              aria-label={t('settings.backToSettingsMenu')}
              onClick={() => setMobileOpen(false)}
            >
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('sidebar.settings')}</span>
          </div>

          {section === 'general' && <GeneralSection />}
          {section === 'agents' && <AgentsSection />}
          {section === 'teams' && <TeamsSection />}
          {section === 'inboxes' && <InboxesSection />}
          {section === 'labels' && <LabelsSettingsSection />}
          {section === 'automation' && <AutomationSection />}
          {section === 'integrations' && <IntegrationsSection />}
        </div>
      </div>
    </div>
  );
}
