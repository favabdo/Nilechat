import { useState } from 'react';
import { X, Pencil, CalendarPlus, Phone, Tag } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import AssignSection from './AssignSection';
import LabelsSection from './LabelsSection';
import TeamsSection from './TeamsSection';
import useChatsStore from '../store/chatsStore';
import useScheduledTasksStore from '../../scheduled-tasks/store/scheduledTasksStore';
import AddTaskModal from '../../scheduled-tasks/components/AddTaskModal';
import DevicesSection from './DevicesSection';
import AddPhoneForm from './AddPhoneForm';
import PrevConversationCard from './PrevConversationCard';
import useToastStore from '../../../store/toastStore';
import useAuthStore from '../../../store/authStore';
import { contactsApi } from '../../contacts/services/contacts.service';

export default function CustomerPanel({ conversation, currentAgentName, onClose }) {
  const [tab, setTab] = useState('card');
  const { conversations, agents, allLabels, teams, patchConversation, refreshLabels, selectChat } = useChatsStore();
  const { modalOpen, modalMode, openModal, closeModal } = useScheduledTasksStore();
  const showToast = useToastStore((s) => s.showToast);
  const { user } = useAuthStore();
  const isOwnerOrAdmin = (user?.role ?? 2) <= 1;

  const c = conversation;

  // نفس فكرة editPhoneLabel الأصلية بالظبط: prompt بسيط لكتابة/تعديل اسم ثانوي للرقم
  async function editPhoneLabel(idx) {
    if (!c.contactId) return showToast('اربط الرقم بكونتاكت الأول', 'error');
    const p = c.phones[idx];
    if (!p) return;
    const newLabel = window.prompt('اكتب اسم ثانوي للرقم ده (مثلاً: الشغل، الرقم الشخصي) — سيبه فاضي عشان تمسح الاسم الثانوي', p.label || '');
    if (newLabel === null) return;
    try {
      const data = await contactsApi.updatePhoneLabel(c.contactId, p.number, newLabel.trim());
      patchConversation(c.id, { phones: data.contact.phones.map((ph) => ({ number: ph.phone_number, label: ph.label || null })) });
      showToast('تم حفظ الاسم الثانوي بنجاح', 'success');
    } catch (err) {
      console.error('[API] editPhoneLabel error:', err);
      showToast(err.response?.data?.error || 'فشل حفظ الاسم الثانوي', 'error');
    }
  }

  return (
    <div id="customer-panel">
      <div className="cp-header">
        <h3>Customer Details</h3>
        <button className="cp-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="cp-profile">
        <div className="cp-avatar">
          <Avatar name={c.name} seed={c.avatar} size={72} />
        </div>
        <div className="cp-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div className="cp-name">{c.name}</div>
          <button className="st-icon-btn" title="Edit name" aria-label="Edit name" style={{ width: 22, height: 22 }}>
            <Pencil size={12} />
          </button>
        </div>
        <div className="cp-phone">{c.phone}</div>
      </div>

      <div className="cp-tabs">
        <button className={`cp-tab${tab === 'card' ? ' active' : ''}`} onClick={() => setTab('card')}>
          Card
        </button>
        <button className={`cp-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>
          Info
        </button>
      </div>

      {tab === 'card' && (
        <div className="cp-tab-content active">
          <AssignSection
            conversation={c}
            agents={agents}
            currentAgentName={currentAgentName}
            onAssigned={(patch) => patchConversation(c.id, patch)}
          />

          <div className="cp-section" id="cp-section-sched">
            <div className="cp-section-header">
              <div className="cp-section-title">Scheduled Tasks</div>
            </div>
            <div className="cp-section-body">
              <button
                className="add-btn"
                id="sched-add-btn"
                disabled={!c.contactId}
                title={c.contactId ? '' : 'اربط المحادثة بعميل الأول'}
                onClick={() => c.contactId && openModal('card')}
              >
                <CalendarPlus size={16} /> Adding scheduled tasks
              </button>
            </div>
          </div>

          <LabelsSection
            conversation={c}
            allLabels={allLabels}
            onLabelsChange={(labels) => patchConversation(c.id, { labels })}
            onRefreshAllLabels={refreshLabels}
          />

          <TeamsSection conversation={c} teams={teams} onTeamsChange={(teams) => patchConversation(c.id, { teams })} />

          <div className="cp-section" id="cp-section-prevconv">
            <div className="cp-section-header">
              <div className="cp-section-title">Previous Conversations</div>
            </div>
            <div className="cp-section-body">
              <div className="prev-conv-list">
                {!c.prevConvs || c.prevConvs.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 12 }}>No previous conversations</div>
                ) : (
                  c.prevConvs.map((p) => (
                    <PrevConversationCard
                      key={p.id}
                      p={p}
                      onClick={() => {
                        const target = conversations.find((x) => x.id === p.id);
                        if (!target) return showToast('تعذر إيجاد المحادثة دي في القائمة الحالية', 'error');
                        selectChat(target.id);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="cp-tab-content active">
          <div className="cp-section">
            <div className="cp-section-title">Phone Numbers</div>
            <div className="info-list" id="phone-list">
              {(c.phones || []).map((p, i) => (
                <div key={p.number} className="info-item">
                  <div className="info-item-text">
                    <Phone size={16} />
                    <span>{p.number}</span>
                    {p.label && (
                      <span className="label-chip" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--primary)', padding: '2px 9px', fontSize: 11 }}>
                        {p.label}
                      </span>
                    )}
                  </div>
                  {isOwnerOrAdmin && (
                    <button className="info-item-del" title="حط/عدّل اسم ثانوي" aria-label="حط/عدّل اسم ثانوي" onClick={() => editPhoneLabel(i)}>
                      <Tag size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <AddPhoneForm contactId={c.contactId} onAdded={(phones) => patchConversation(c.id, { phones })} />
          </div>
          <div className="cp-section">
            <div className="cp-section-title">Devices</div>
            <DevicesSection contactId={c.contactId} />
          </div>
        </div>
      )}
      {modalOpen && modalMode === 'card' && <AddTaskModal mode="card" conversation={c} onClose={closeModal} />}
    </div>
  );
}
