import { useState } from 'react';
import { ArrowLeft, Settings2, Users, UsersRound, Inbox, Tag, Workflow, Plug } from 'lucide-react';
import GeneralSection from '../sections/GeneralSection';
import AgentsSection from '../sections/AgentsSection';
import TeamsSection from '../sections/TeamsSection';
import InboxesSection from '../sections/InboxesSection';
import LabelsSettingsSection from '../sections/LabelsSettingsSection';
import AutomationSection from '../sections/AutomationSection';
import IntegrationsSection from '../sections/IntegrationsSection';

const NAV_ITEMS = [
  { key: 'general', label: 'Account Settings', icon: Settings2 },
  { key: 'agents', label: 'Agents', icon: Users },
  { key: 'teams', label: 'Teams', icon: UsersRound },
  { key: 'inboxes', label: 'Inboxes', icon: Inbox },
  { key: 'labels', label: 'Labels', icon: Tag },
  { key: 'automation', label: 'Automation', icon: Workflow },
  { key: 'integrations', label: 'Integrations', icon: Plug },
];

export default function SettingsPage() {
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
          <div className="settings-sidebar-title">Settings</div>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`settings-nav-item${section === key ? ' active' : ''}`} onClick={() => navigate(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </aside>

        <div id="settings-content-panel">
          <div className="settings-back-row">
            <button
              className="mobile-back-btn"
              title="رجوع لقائمة الإعدادات"
              aria-label="رجوع لقائمة الإعدادات"
              onClick={() => setMobileOpen(false)}
            >
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Settings</span>
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
