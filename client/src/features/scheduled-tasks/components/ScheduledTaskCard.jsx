import { UserRoundSearch, UserRound, Clock, Calendar, CalendarCheck, Check, AlarmClock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useChatsStore from '../../chats/store/chatsStore';
import useToastStore from '../../../store/toastStore';
import { formatSchedDate } from '../../../utils/dateFormat';

export default function ScheduledTaskCard({ t, ended, onEnd }) {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);
  const conversations = useChatsStore((s) => s.conversations);
  const selectChat = useChatsStore((s) => s.selectChat);
  const isLate = t.delivery_status === 'late';

  function goToTaskConversation() {
    const match = conversations.find((c) => String(c.contactId) === String(t.contact_id));
    if (!match) return showToast('محادثة العميل ده مش ظاهرة في القايمة دلوقتي', 'info');
    navigate('/dashboard/chats');
    selectChat(match.id);
  }

  return (
    <div className={`sched-task-card${ended ? ' ended' : ''}`}>
      <div className="sched-task-customer">
        <UserRoundSearch size={16} />
        <span
          onClick={goToTaskConversation}
          style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
        >
          {t.customer_name || 'Unknown customer'}
        </span>
      </div>
      <div className="sched-task-subrow">
        <span>
          <UserRound size={13} />
          {t.agent_name || 'Unknown'}
        </span>
        <span>
          <Clock size={13} />
          Due: {formatSchedDate(t.due_date)}
        </span>
      </div>
      <div className="sched-task-text">{t.task_text}</div>
      <div className="sched-task-meta">
        <Calendar size={13} />
        Added: {formatSchedDate(t.created_at)}
      </div>
      {ended && (
        <div className="sched-task-meta">
          <CalendarCheck size={13} />
          Ended: {formatSchedDate(t.ended_at)}
        </div>
      )}
      <div className="sched-task-actions">
        {ended ? (
          <span className={`sched-ended-tag${isLate ? ' late' : ''}`}>
            {t.delivery_status ? (
              <>
                {isLate ? <AlarmClock size={12} /> : <CheckCircle size={12} />}
                {isLate ? 'Late delivery' : 'Delivered on time'}
              </>
            ) : (
              <>
                <CheckCircle size={12} />
                Ended
              </>
            )}
          </span>
        ) : (
          <button className="sched-end-btn" onClick={() => onEnd(t.id, t.contact_id)}>
            <Check size={13} />
            End Task
          </button>
        )}
      </div>
    </div>
  );
}
