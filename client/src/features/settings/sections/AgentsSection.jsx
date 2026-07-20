import { useEffect, useState } from 'react';
import { UserPlus, Copy, Pencil, Trash2, Check } from 'lucide-react';
import { agentsSettingsApi } from '../services/settings.service';
import Avatar from '../../../components/ui/Avatar';
import { roleLabel, roleBadgeClass } from '../../../utils/roles';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import AddAgentModal from '../components/AddAgentModal';
import DeleteAgentModal from '../components/DeleteAgentModal';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function AgentsSection() {
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
    if (!link) return showToast('لينك الدعوة مش متاح دلوقتي', 'error');
    try {
      await navigator.clipboard.writeText(link);
      showToast('تم نسخ لينك الدعوة، ابعته للإيجنت', 'success');
    } catch (err) {
      console.error('[copyInviteLink] clipboard error:', err);
      showToast('تعذر النسخ التلقائي — اللينك: ' + link, 'error');
    }
  }

  async function changeRole(id, role) {
    try {
      const data = await agentsSettingsApi.update(id, { role: Number(role) });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, role: data.user.role } : a)));
      showToast('تم تغيير الرول بنجاح', 'success');
    } catch (err) {
      console.error('[API] changeAgentRole error:', err);
      showToast(err.response?.data?.error || 'فشل تغيير الرول', 'error');
    }
  }

  async function changeStatus(id, status) {
    try {
      const data = await agentsSettingsApi.update(id, { status });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: data.user.status } : a)));
      showToast('تم تحديث الحالة بنجاح', 'success');
    } catch (err) {
      console.error('[API] changeAgentStatus error:', err);
      showToast(err.response?.data?.error || 'فشل تغيير الحالة', 'error');
    }
  }

  async function saveOwnName(id) {
    const trimmed = nameDraft.trim();
    if (!trimmed) return setEditingNameId(null);
    try {
      const data = await agentsSettingsApi.update(id, { display_name: trimmed });
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, display_name: data.user.display_name } : a)));
      setEditingNameId(null);
      showToast('تم تحديث اسمك', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل تحديث الاسم', 'error');
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
            <h2>Agents</h2>
            <div className="settings-top-desc">Manage agents and what they can access</div>
          </div>
          {canManage && (
            <button className="page-btn" onClick={() => setAddModalOpen(true)}>
              <UserPlus size={16} /> Add Agent
            </button>
          )}
        </div>
        <table className="settings-table">
          <thead>
            <tr>
              <th style={{ width: '26%' }}>Agent</th>
              <th style={{ width: '32%' }}>Email</th>
              <th style={{ width: '16%' }}>Role</th>
              <th style={{ width: '16%' }}>Status</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  جارِ تحميل الإيجنتس...
                </td>
              </tr>
            )}
            {!loading && failed && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  تعذر تحميل الإيجنتس — تأكد إن الباك إند شغال
                </td>
              </tr>
            )}
            {!loading && !failed && agents.length === 0 && (
              <tr>
                <td colSpan={5} className="iw-empty">
                  مفيش إيجنتس متسجلين لسه
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
                            {isMe && <span className="agent-you-tag">You</span>}
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
                            title="نسخ لينك الدعوة"
                            aria-label="نسخ لينك الدعوة"
                          >
                            <Copy size={11} style={{ verticalAlign: -2, marginLeft: 4 }} />
                            نسخ لينك الدعوة
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
                          <option value={2}>Agent</option>
                          <option value={1}>Admin</option>
                          <option value={0}>Owner</option>
                        </select>
                      ) : (
                        <span className={`st-pill ${roleBadgeClass(a.role)}`}>{roleLabel(a.role)}</span>
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
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`st-pill ${isActive ? 'status-online' : 'status-offline'}`}>
                          <span
                            className="st-pill-dot"
                            style={{ background: isActive ? 'var(--success)' : 'var(--text-secondary)' }}
                          ></span>
                          {isActive ? 'Active' : a.status || 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isMe && editingNameId !== a.id && (
                        <button
                          className="st-icon-btn"
                          title="Edit your display name"
                          aria-label="Edit your display name"
                          onClick={() => {
                            setEditingNameId(a.id);
                            setNameDraft(a.display_name || '');
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {isMe && editingNameId === a.id && (
                        <button className="st-icon-btn" title="Save" aria-label="Save" onClick={() => saveOwnName(a.id)}>
                          <Check size={14} />
                        </button>
                      )}
                      {canEditThisAgent && (
                        <button
                          className="st-icon-btn"
                          title="Delete agent"
                          aria-label="Delete agent"
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
            showToast('تم مسح الإيجنت بنجاح', 'success');
          }}
        />
      )}
    </div>
  );
}
