import { UserRound, CircleSlash, Clock, AlertTriangle, ShieldCheck, Square, Trash2 } from 'lucide-react';
import { formatSchedDate } from '../../../utils/dateFormat';
import { customerDetailsApi } from '../services/customerDetails.service';
import useToastStore from '../../../store/toastStore';
import useAuthStore from '../../../store/authStore';

function contractStatus(contract) {
  if (contract.status === 'stopped') {
    return { label: 'متوقف', color: 'var(--text-secondary)', Icon: CircleSlash };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(contract.start_date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(contract.end_date);
  end.setHours(0, 0, 0, 0);
  if (today < start) return { label: 'لسه هيبدأ', color: 'var(--text-secondary)', Icon: Clock };
  if (today > end) return { label: 'منتهي', color: 'var(--danger)', Icon: AlertTriangle };
  return { label: 'ساري', color: 'var(--success)', Icon: ShieldCheck };
}

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function MaintenanceContractCard({ contract, contactId, onChanged }) {
  const status = contractStatus(contract);
  const showToast = useToastStore((s) => s.showToast);
  const { user } = useAuthStore();
  const canManage = isOwnerOrAdmin(user);

  async function handleStop() {
    if (!window.confirm('متأكد إنك عايز توقف عقد الصيانة ده؟')) return;
    try {
      await customerDetailsApi.stopMaintenanceContract(contactId, contract.id);
      showToast('تم إيقاف عقد الصيانة', 'success');
      onChanged();
    } catch (err) {
      console.error('[API] stopMaintenanceContract error:', err);
      showToast(err.response?.data?.error || 'فشل إيقاف عقد الصيانة', 'error');
    }
  }

  async function handleDelete() {
    if (!window.confirm('متأكد إنك عايز تمسح عقد الصيانة ده؟ الإجراء ده نهائي.')) return;
    try {
      await customerDetailsApi.deleteMaintenanceContract(contactId, contract.id);
      showToast('تم حذف عقد الصيانة', 'success');
      onChanged();
    } catch (err) {
      console.error('[API] deleteMaintenanceContract error:', err);
      showToast(err.response?.data?.error || 'فشل حذف عقد الصيانة', 'error');
    }
  }
  return (
    <div className="sched-task-card">
      <div className="sched-task-subrow">
        <span style={{ fontWeight: 700, color: status.color }}>
          <status.Icon size={13} />
          {status.label}
        </span>
        {contract.created_by_name && (
          <span>
            <UserRound size={13} />
            {contract.created_by_name}
          </span>
        )}
      </div>
      <div className="st-modal-readonly-row" style={{ marginTop: 8 }}>
        <div className="st-modal-readonly">
          <div className="st-modal-readonly-label">تاريخ البدء</div>
          <div className="st-modal-readonly-value">{formatSchedDate(contract.start_date)}</div>
        </div>
        <div className="st-modal-readonly">
          <div className="st-modal-readonly-label">تاريخ الانتهاء</div>
          <div className="st-modal-readonly-value">{formatSchedDate(contract.end_date)}</div>
        </div>
      </div>
      {contract.notes && (
        <div className="sched-task-text" style={{ marginTop: 8 }}>
          {contract.notes}
        </div>
      )}
      {canManage && (
        <div className="sched-task-actions">
          {contract.status !== 'stopped' && (
            <button className="sched-end-btn" onClick={handleStop}>
              <Square size={13} /> إيقاف
            </button>
          )}
          <button className="sched-end-btn" style={{ color: 'var(--danger)' }} onClick={handleDelete}>
            <Trash2 size={13} /> حذف
          </button>
        </div>
      )}
    </div>
  );
}
