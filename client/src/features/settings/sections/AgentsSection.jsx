import { useEffect, useState } from 'react';
import { UserPlus, Copy, Pencil, Trash2, Check } from 'lucide-react';
import { agentsSettingsApi } from '../services/settings.service';
import Avatar from '../../../components/ui/Avatar';
import { roleLabel, roleBadgeClass } from '../../../utils/roles';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import AddAgentModal from '../components/AddAgentModal';
import DeleteAgentModal from '../components/DeleteAgentModal';
import useTranslation from '../../../i18n/useTranslation';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function AgentsSection() {
  const { t, lang } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const canManage = isOwnerOrAdmin(user);

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [inviteLinks, setInviteLinks] = useState({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    setFailed(false);
    agentsSettingsApi
      .list()
      .then(setAgents)
      .catch((err) => {
        console.error('[API] loadAgentsSettings error:', err);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }

  async function copyInviteLink(id) {
    const link = inviteLinks[id];
    if (!link) return showToast(t('settings.inviteLinkUnavailable'), 'error');
    try {
      await navigator.clipboard.writeText(link);
      showToast(t('settings.inviteLinkCopied'), 'success');
    } catch (err) {
      console.error('[copyInviteLink] clipboard error:', err);
      showToast(t('settings.copyFailedWithLink', { link }), 'error');
    }
  }

  async function changeRole(id, role) {
    try {
      const data = await agentsSettingsApi.update(id, { role: Number(role) });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, role: data.user.role } : a)));
      showToast(t('settings.roleChangedSuccess'), 'success');
    } catch (err) {
      console.error('[API] changeAgentRole error:', err);
      showToast(err.response?.data?.error || t('settings.roleChangeFailed'), 'error');
    }
  }

  async function changeStatus(id, status) {
    try {
      const data = await agentsSettingsApi.update(id, { status });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: data.user.status } : a)));
      showToast(t('settings.statusUpdatedSuccess'), 'success');
    } catch (err) {
      console.error('[API] changeAgentStatus error:', err);
      showToast(err.response?.data?.error || t('settings.statusChangeFailed'), 'error');
    }
  }

  async function saveOwnName(id) {
    const trimmed = nameDraft.trim();
    if (!trimmed) return setEditingNameId(null);
    try {
      const data = await agentsSettingsApi.update(id, { display_name: trimmed });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, display_name: data.user.display_name } : a)));
      setEditingNameId(null);
      showToast(t('settings.nameUpdatedSuccess'), 'success');
    } catch (err) {
      showToast(err.response?.data?.error || t('settings.nameUpdateFailed'), 'error');
    }
  }

  function handleAdded(data) {
    setAddModalOpen(false);
    if (data.user?.id && data.invite_link) {
      setInviteLinks((prev) => ({ ...prev, [data.user.id]: data.invite_link }));
    }
    load();
  }

  return (
    <div className="settings-content-section active" id="settings-sec-agents">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>{t('settings.agents')}</h2>
            <div className="settings-top-desc">{t('settings.agentsDesc')}</div>
          </div>
          {canManage && (
            <button className="page-btn" onClick={() => setAddModalOpen(true)}>
              <UserPlus size={16} /> {t('settings.addAgentTitle')}
            </button>
          )}
        </div>
        <table className="settings-table">
          <thead>
            <tr>
              <th style={{ width: '26%' }}>{t('settings.agentCol')}</th>
              <th style={{ width: '32%' }}>{t('settings.emailCol')}</th>
              <th style={{ width: '16%' }}>{t('settings.roleCol')}</th>
              <th style={{ width: '16%' }}>{t('settings.statusCol')}</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  {t('settings.loadingAgentsTable')}
                </td>
              </tr>
            )}
            {!loading && failed && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  {t('settings.loadAgentsFailed')}
                </td>
              </tr>
            )}
            {!loading && !failed && agents.length === 0 && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  {t('settings.noAgentsRegisteredYet')}
                </td>
              </tr>
            )}
            {!loading &&
              !failed &&
              agents.map((a) => {
                const isMe = String(a.id) === String(user?.id);
                const isActive = a.status === 'active';
                const canEditThisAgent = canManage && !isMe;
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="st-person">
                        <div className="st-avatar">
                          <Avatar name={a.display_name} seed={`agent-${a.id}`} size={32} imageSrc={a.avatar_url || null} />
                        </div>
                        {editingNameId === a.id ? (
                          <input
                            className="iw-input"
                            style={{ padding: '4px 8px', fontSize: 12.5, width: 140 }}
                            value={nameDraft}
                            autoFocus
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveOwnName(a.id)}
                            onBlur={() => saveOwnName(a.id)}
                          />
                        ) : (
                          <span>
                            {a.display_name}
                            {isMe && <span className="agent-you-tag">{t('settings.you')}</span>}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {a.email}
                      {a.status === 'invited' && inviteLinks[a.id] && (
                        <div>
                          <button
                            className="sr-chip"
                            style={{ marginTop: 6, fontSize: 11, padding: '4px 10px' }}
                            onClick={() => copyInviteLink(a.id)}
                            title={t('settings.copyInviteLinkBtn')}
                            aria-label={t('settings.copyInviteLinkBtn')}
                          >
                            <Copy size={11} style={{ verticalAlign: -2, marginLeft: 4 }} />
                            {t('settings.copyInviteLinkBtn')}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {canEditThisAgent ? (
                        <select
                          className="iw-input"
                          style={{ padding: '6px 8px', fontSize: 12, width: 'auto' }}
                          value={a.role}
                          onChange={(e) => changeRole(a.id, e.target.value)}
                        >
                          <option value={2}>{t('settings.roleAgent')}</option>
                          <option value={1}>{t('settings.roleAdmin')}</option>
                          <option value={0}>{t('settings.roleOwnerShort')}</option>
                        </select>
                      ) : (
                        <span className={`st-pill ${roleBadgeClass(a.role)}`}>{roleLabel(a.role, lang)}</span>
                      )}
                    </td>
                    <td>
                      {canEditThisAgent ? (
                        <select
                          className="iw-input"
                          style={{ padding: '6px 8px', fontSize: 12, width: 'auto' }}
                          value={isActive ? 'active' : 'inactive'}
                          onChange={(e) => changeStatus(a.id, e.target.value)}
                        >
                          <option value="active">{t('settings.active')}</option>
                          <option value="inactive">{t('settings.inactive2')}</option>
                        </select>
                      ) : (
                        <span className={`st-pill ${isActive ? 'status-online' : 'status-offline'}`}>
                          <span
                            className="st-pill-dot"
                            style={{ background: isActive ? 'var(--success)' : 'var(--text-secondary)' }}
                          ></span>
                          {isActive ? t('settings.active') : a.status || t('settings.inactive2')}
                        </span>
                      )}
                    </td>
                    <td>
                      {isMe && editingNameId !== a.id && (
                        <button
                          className="st-icon-btn"
                          title={t('settings.editDisplayName')}
                          aria-label={t('settings.editDisplayName')}
                          onClick={() => {
                            setEditingNameId(a.id);
                            setNameDraft(a.display_name || '');
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {isMe && editingNameId === a.id && (
                        <button className="st-icon-btn" title={t('settings.saveBtn')} aria-label={t('settings.saveBtn')} onClick={() => saveOwnName(a.id)}>
                          <Check size={14} />
                        </button>
                      )}
                      {canEditThisAgent && (
                        <button
                          className="st-icon-btn"
                          title={t('settings.deleteAgentTitle2')}
                          aria-label={t('settings.deleteAgentTitle2')}
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {addModalOpen && <AddAgentModal onClose={() => setAddModalOpen(false)} onAdded={handleAdded} />}
      {deleteTarget && (
        <DeleteAgentModal
          agent={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setAgents((prev) => prev.filter((a) => a.id !== id));
            setDeleteTarget(null);
            showToast(t('settings.agentDeletedSuccess'), 'success');
          }}
        />
      )}
    </div>
  );
}
