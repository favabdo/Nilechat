import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, RefreshCw, CalendarPlus, UserRound, UserRoundSearch, CircleDot, CheckCircle } from 'lucide-react';
import useScheduledTasksStore from '../store/scheduledTasksStore';
import useToastStore from '../../../store/toastStore';
import ScheduledTaskCard from '../components/ScheduledTaskCard';
import AddTaskModal from '../components/AddTaskModal';

export default function ScheduledTasksPage() {
  const { tasks, loaded, modalOpen, modalMode, loadTasks, openModal, closeModal, endTask } = useScheduledTasksStore();
  const showToast = useToastStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState('open');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  useEffect(() => {
    loadTasks().catch(() => showToast('تعذر تحميل التاسكات', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agentOptions = useMemo(
    () => [...new Set(tasks.map((t) => t.agent_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [tasks]
  );
  const customerOptions = useMemo(
    () => [...new Set(tasks.map((t) => t.customer_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const filtered = tasks.filter(
    (t) =>
      (!filterAgent || (t.agent_name || '').toLowerCase().includes(filterAgent.toLowerCase())) &&
      (!filterCustomer || (t.customer_name || '').toLowerCase().includes(filterCustomer.toLowerCase()))
  );
  const openTasks = filtered.filter((t) => t.status === 'open');
  const endedTasks = filtered.filter((t) => t.status === 'ended');

  async function handleEnd(taskId, contactId) {
    try {
      await endTask(taskId, contactId);
      showToast('Task moved to Ended', 'success');
    } catch (err) {
      console.error('[API] endScheduledTask error:', err);
      showToast(err.response?.data?.error || 'فشل قفل التاسك', 'error');
    }
  }

  return (
    <div id="page-scheduled-tasks" className="page">
      <div className="page-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg,var(--primary),var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(108,92,231,0.35)',
                flexShrink: 0,
              }}
            >
              <CalendarClock size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, lineHeight: 1.1 }}>Scheduled Tasks</h2>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>
                Tasks agents scheduled from customer cards
              </div>
            </div>
          </div>
          <div className="sched-header-actions">
            <button className="page-btn" onClick={() => loadTasks()}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="page-btn" onClick={() => openModal('page')}>
              <CalendarPlus size={16} /> Add Task
            </button>
          </div>
        </div>

        <div className="sched-filters-bar">
          <div className="sched-filter-group">
            <label>
              <UserRound size={13} /> Agent
            </label>
            <input
              type="text"
              className="iw-input"
              list="sched-agents-list"
              placeholder="كل الايجنتس..."
              autoComplete="off"
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
            />
            <datalist id="sched-agents-list">
              {agentOptions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
          <div className="sched-filter-group">
            <label>
              <UserRoundSearch size={13} /> Customer
            </label>
            <input
              type="text"
              className="iw-input"
              list="sched-customers-list"
              placeholder="كل العملاء..."
              autoComplete="off"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
            />
            <datalist id="sched-customers-list">
              {customerOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="sched-page-tabs">
          <button className={`sched-page-tab${activeTab === 'open' ? ' active' : ''}`} onClick={() => setActiveTab('open')}>
            <CircleDot size={14} /> Open Tasks <span className="sched-subhead-count">({openTasks.length})</span>
          </button>
          <button className={`sched-page-tab${activeTab === 'ended' ? ' active' : ''}`} onClick={() => setActiveTab('ended')}>
            <CheckCircle size={14} /> Ended Tasks <span className="sched-subhead-count">({endedTasks.length})</span>
          </button>
        </div>

        <div className="chart-container">
          <div className="sched-tasks-grid" style={{ display: activeTab === 'open' ? '' : 'none' }}>
            {loaded && openTasks.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No open tasks</div>
            ) : (
              openTasks.map((t) => <ScheduledTaskCard key={t.id} t={t} ended={false} onEnd={handleEnd} />)
            )}
          </div>
          <div className="sched-tasks-grid" style={{ display: activeTab === 'ended' ? '' : 'none' }}>
            {loaded && endedTasks.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No ended tasks</div>
            ) : (
              endedTasks.map((t) => <ScheduledTaskCard key={t.id} t={t} ended onEnd={handleEnd} />)
            )}
          </div>
        </div>
      </div>

      {modalOpen && modalMode === 'page' && <AddTaskModal mode="page" onClose={closeModal} />}
    </div>
  );
}
