import { useEffect, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { teamsApi, agentsSettingsApi } from '../services/settings.service';
import { roleLabel } from '../../../utils/roles';
import Modal from '../../../components/ui/Modal';

export default function TeamMembersModal({ team, onClose, onSaved }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([agentsSettingsApi.list(), teamsApi.getMembers(team.id)])
      .then(([agentsList, members]) => {
        setAgents(agentsList);
        setSelectedIds(new Set(members.map((m) => String(m.id))));
      })
      .catch((err) => console.error('[API] openTeamMembersModal error:', err))
      .finally(() => setLoading(false));
  }, [team.id]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await teamsApi.setMembers(team.id, Array.from(selectedIds).map(Number));
      onSaved();
    } catch (err) {
      console.error('[API] saveTeamMembers error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon">
          <Users size={22} />
        </div>
        <div className="resolve-modal-title">Manage Agents — {team.name}</div>
      </div>

      <div className="iw-agent-list">
        {loading ? (
          <div className="iw-empty">جارِ تحميل الموظفين...</div>
        ) : agents.length === 0 ? (
          <div className="iw-empty">مفيش إيجنتس متسجلين لسه</div>
        ) : (
          agents.map((a) => {
            const isSelected = selectedIds.has(String(a.id));
            return (
              <div key={a.id} className={`iw-agent-row${isSelected ? ' selected' : ''}`} onClick={() => toggle(a.id)}>
                <div className="iw-agent-check">{isSelected && <Check size={12} />}</div>
                <div className="iw-agent-name">{a.display_name || a.email}</div>
                <div className="iw-agent-role">{roleLabel(a.role)}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          إلغاء
        </button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={save}>
          <Check size={16} /> Save Agents
        </button>
      </div>
    </Modal>
  );
}
