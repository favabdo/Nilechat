import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { iconKeyToComponent } from '../../../utils/iconMap';
import { teamsApi, agentsSettingsApi } from '../services/settings.service';
import { hexToRgba } from '../../chats/utils/mappers';
import { roleLabel } from '../../../utils/roles';
import Modal from '../../../components/ui/Modal';

const TEAM_ICON_OPTIONS = ['users-round', 'headset', 'credit-card', 'sparkles', 'shield', 'globe', 'wrench', 'star'];
const TEAM_COLOR_OPTIONS = ['#6C5CE7', '#f59e0b', '#10b981', '#00D2FF', '#ef4444', '#64748b'];

export default function TeamModal({ team, onClose, onSaved }) {
  const [name, setName] = useState(team?.name || '');
  const [desc, setDesc] = useState(team?.description || '');
  const [icon, setIcon] = useState(team?.icon || 'users-round');
  const [color, setColor] = useState(team?.color || '#6C5CE7');
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const requests = [agentsSettingsApi.list()];
        if (team?.id) requests.push(teamsApi.getMembers(team.id));
        const [agentsList, members] = await Promise.all(requests);
        setAgents(agentsList);
        if (members) setSelectedIds(new Set(members.map((m) => String(m.id))));
      } catch (err) {
        console.error('[API] loadTeamFormAgents error:', err);
      } finally {
        setAgentsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleAgent(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return setError('لازم تكتب اسم التيم');

    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        description: desc.trim() || null,
        icon,
        color,
        agentIds: Array.from(selectedIds).map(Number),
      };
      if (team?.id) await teamsApi.update(team.id, payload);
      else await teamsApi.create(payload);
      onSaved();
    } catch (err) {
      console.error('[API] saveTeam error:', err);
      setError(err.response?.data?.error || 'فشل حفظ التيم');
    } finally {
      setSaving(false);
    }
  }

  const PreviewIcon = iconKeyToComponent(icon);

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: hexToRgba(color, 0.12), color }}>
          <PreviewIcon size={22} />
        </div>
        <div className="resolve-modal-title">{team ? 'Edit Team' : 'Add Team'}</div>
      </div>

      <div className="resolve-cats-label">Team Name</div>
      <input
        type="text"
        className="iw-input"
        placeholder="e.g. Tech Support"
        maxLength={150}
        style={{ marginBottom: 14 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="resolve-cats-label">Description</div>
      <textarea
        className="resolve-notes"
        placeholder="What does this team handle?"
        maxLength={300}
        style={{ marginBottom: 14 }}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <div className="resolve-cats-label">Icon</div>
      <div className="team-icon-grid" style={{ marginBottom: 14 }}>
        {TEAM_ICON_OPTIONS.map((k) => {
          const IconComp = iconKeyToComponent(k);
          return (
            <div key={k} className={`team-icon-opt${icon === k ? ' selected' : ''}`} onClick={() => setIcon(k)}>
              <IconComp size={17} />
            </div>
          );
        })}
      </div>

      <div className="resolve-cats-label">Color</div>
      <div className="team-color-grid" style={{ marginBottom: 14 }}>
        {TEAM_COLOR_OPTIONS.map((c) => (
          <div
            key={c}
            className={`team-color-opt${color === c ? ' selected' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="resolve-cats-label">Agents</div>
      <div className="iw-agent-list" style={{ marginBottom: 14 }}>
        {agentsLoading ? (
          <div className="iw-empty">جارِ تحميل الموظفين...</div>
        ) : agents.length === 0 ? (
          <div className="iw-empty">مفيش إيجنتس متسجلين لسه — ضيف إيجنت من صفحة Agents الأول</div>
        ) : (
          agents.map((a) => {
            const isSelected = selectedIds.has(String(a.id));
            return (
              <div key={a.id} className={`iw-agent-row${isSelected ? ' selected' : ''}`} onClick={() => toggleAgent(a.id)}>
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
          <Check size={16} /> Save Team
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
