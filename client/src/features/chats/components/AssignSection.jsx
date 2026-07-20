import { useState } from 'react';
import { UserCheck, ChevronDown, Search } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import useToastStore from '../../../store/toastStore';
import { conversationsApi } from '../services/chats.service';

export default function AssignSection({ conversation, agents, currentAgentName, onAssigned }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const showToast = useToastStore((s) => s.showToast);

  const assignedToMe = conversation.assignedTo === currentAgentName;
  const filteredAgents = query ? agents.filter((a) => (a.name || '').toLowerCase().includes(query.toLowerCase())) : agents;

  async function assignToMe() {
    try {
      const data = await conversationsApi.assign(conversation.id);
      onAssigned({
        assignedTo: data.conversation?.assigned_agent_name || currentAgentName,
        rawStatus: data.conversation?.status || 'assigned',
        status: (data.conversation?.status || 'assigned') === 'closed' ? 'resolved' : 'open',
      });
      showToast('Assigned to me', 'success');
    } catch (err) {
      console.error('[API] assignToMe error:', err);
      showToast('فشل استلام المحادثة', 'error');
    }
  }

  async function assignAgent(agent) {
    setOpen(false);
    try {
      const data = await conversationsApi.assign(conversation.id, agent.id);
      onAssigned({
        assignedTo: data.conversation?.assigned_agent_name || agent.name,
        rawStatus: data.conversation?.status || 'assigned',
        status: (data.conversation?.status || 'assigned') === 'closed' ? 'resolved' : 'open',
      });
      showToast(`تم تعيين المحادثة لـ ${agent.name}`, 'success');
    } catch (err) {
      console.error('[API] assignAgent error:', err);
      showToast(err.response?.data?.error || 'فشل تعيين الموظف', 'error');
    }
  }

  return (
    <div className="cp-section">
      <div className="cp-section-title">Assign to Agent</div>
      <button className={`assign-me-btn${assignedToMe ? ' assigned' : ''}`} onClick={assignToMe}>
        <UserCheck size={16} />
        <span>{assignedToMe ? 'Assigned to Me' : 'Assign to Me'}</span>
      </button>
      <div className="agent-select-wrap">
        <button
          className="agent-select-btn"
          onClick={() => {
            setOpen((v) => !v);
            setQuery('');
          }}
        >
          <span>{conversation.assignedTo || 'Unassigned'}</span>
          <ChevronDown size={16} color="var(--text-secondary)" />
        </button>
        <div className={`agent-dropdown${open ? ' open' : ''}`}>
          <div className="agent-dropdown-search-wrap">
            <Search className="agent-dropdown-search-icon" size={14} />
            <input
              type="text"
              className="agent-dropdown-search"
              placeholder="اكتب اسم الإيجنت..."
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="agent-dropdown-list">
            {filteredAgents.length === 0 ? (
              <div className="agent-dropdown-empty">لا يوجد إيجنتس مطابقين</div>
            ) : (
              filteredAgents.map((a) => (
                <div
                  key={a.id}
                  className={`agent-option${conversation.assignedTo === a.name ? ' selected' : ''}`}
                  onClick={() => assignAgent(a)}
                >
                  <div className="agent-option-avatar">
                    <Avatar name={a.name} seed={a.avatar || a.id} size={32} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
