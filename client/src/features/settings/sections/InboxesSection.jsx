import { useEffect, useState } from 'react';
import { Plus, MessageCircle, Trash2, Inbox as InboxIcon } from 'lucide-react';
import { inboxesApi } from '../services/settings.service';
import useToastStore from '../../../store/toastStore';
import InboxWizard from '../components/InboxWizard';
import useTranslation from '../../../i18n/useTranslation';

export default function InboxesSection() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [inboxes, setInboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  function load() {
    setLoading(true);
    setFailed(false);
    inboxesApi
      .list()
      .then(setInboxes)
      .catch((err) => {
        console.error('[Inboxes] load error:', err);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleStatus(inbox) {
    const newStatus = inbox.status === 'active' ? 'inactive' : 'active';
    setInboxes((prev) => prev.map((i) => (i.id === inbox.id ? { ...i, status: newStatus } : i)));
    try {
      await inboxesApi.updateStatus(inbox.id, newStatus);
    } catch (err) {
      console.error('[API] iwToggleInboxStatus error:', err);
      showToast(err.response?.data?.error || t('settings.updateFailed'), 'error');
      setInboxes((prev) => prev.map((i) => (i.id === inbox.id ? { ...i, status: inbox.status } : i)));
    }
  }

  async function deleteInbox(id) {
    if (!window.confirm(t('settings.deleteInboxConfirm'))) return;
    try {
      await inboxesApi.remove(id);
      load();
    } catch (err) {
      console.error('[API] iwDeleteInbox error:', err);
      showToast(err.response?.data?.error || t('settings.deleteFailed'), 'error');
    }
  }

  return (
    <div className="settings-content-section active" id="settings-sec-inboxes">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>{t('settings.inboxes')}</h2>
            <div className="settings-top-desc">{t('settings.inboxesDesc')}</div>
          </div>
          <button className="page-btn" onClick={() => setWizardOpen(true)}>
            <Plus size={16} /> {t('settings.addInbox')}
          </button>
        </div>
        <table className="settings-table">
          <thead>
            <tr>
              <th>{t('settings.inboxCol')}</th>
              <th>{t('settings.channelCol')}</th>
              <th>{t('settings.agentsCol')}</th>
              <th>{t('settings.statusCol')}</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  {t('settings.loadingInboxes')}
                </td>
              </tr>
            )}
            {!loading && failed && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  {t('settings.loadInboxesFailed')}
                </td>
              </tr>
            )}
            {!loading && !failed && inboxes.length === 0 && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  <InboxIcon size={28} style={{ opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                  {t('settings.noInboxesYet')}
                </td>
              </tr>
            )}
            {!loading &&
              !failed &&
              inboxes.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="st-person">
                      <div
                        className="settings-card-icon"
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                      >
                        <MessageCircle size={15} />
                      </div>
                      {i.name}
                    </div>
                  </td>
                  <td>
                    WhatsApp
                    {i.phone_number ? ` · ${i.phone_number}` : i.display_phone_number ? ` · ${i.display_phone_number}` : ''}
                  </td>
                  <td>{i.agents_count}</td>
                  <td>
                    <button className={`toggle${i.status === 'active' ? ' on' : ''}`} onClick={() => toggleStatus(i)}></button>
                  </td>
                  <td>
                    <button className="st-icon-btn danger" onClick={() => deleteInbox(i.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {wizardOpen && (
        <InboxWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
