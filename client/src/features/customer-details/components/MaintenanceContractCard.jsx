import { useTranslation } from 'react-i18next';
import { UserRound, CircleSlash, Clock, AlertTriangle, ShieldCheck, OctagonPause, Trash2 } from 'lucide-react';
import { formatSchedDate } from '../../../utils/dateFormat';
import { customerDetailsApi } from '../services/customerDetails.service';
import useToastStore from '../../../store/toastStore';
import useAuthStore from '../../../store/authStore';

function contractStatus(contract, t) {
  if (contract.status === 'stopped') {
    return { label: t('contractStatus.stopped'), color: 'var(--text-secondary)', Icon: CircleSlash };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(contract.start_date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(contract.end_date);
  end.setHours(0, 0, 0, 0);
  if (today < start) return { label: t('contractStatus.upcoming'), color: 'var(--text-secondary)', Icon: Clock };
  if (today > end) return { label: t('contractStatus.expired'), color: 'var(--danger)', Icon: AlertTriangle };
  return { label: t('contractStatus.active'), color: 'var(--success)', Icon: ShieldCheck };
}

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function MaintenanceContractCard({ contract, contactId, onChanged }) {
  const { t } = useTranslation('customerDetails');
  const status = contractStatus(contract, t);
  const showToast = useToastStore((s) => s.showToast);
  const { user } = useAuthStore();
  const canManage = isOwnerOrAdmin(user);

  async function handleStop() {
    if (!window.confirm(t('contractCard.confirmStop'))) return;
    try {
      await customerDetailsApi.stopMaintenanceContract(contactId, contract.id);
      showToast(t('contractCard.stopSuccess'), 'success');
      onChanged();
    } catch (err) {
      console.error('[API] stopMaintenanceContract error:', err);
      showToast(err.response?.data?.error || t('contractCard.stopFailed'), 'error');
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('contractCard.confirmDelete'))) return;
    try {
      await customerDetailsApi.deleteMaintenanceContract(contactId, contract.id);
      showToast(t('contractCard.deleteSuccess'), 'success');
      onChanged();
    } catch (err) {
      console.error('[API] deleteMaintenanceContract error:', err);
      showToast(err.response?.data?.error || t('contractCard.deleteFailed'), 'error');
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
          <div className="st-modal-readonly-label">{t('contractCard.startDate')}</div>
          <div className="st-modal-readonly-value">{formatSchedDate(contract.start_date)}</div>
        </div>
        <div className="st-modal-readonly">
          <div className="st-modal-readonly-label">{t('contractCard.endDate')}</div>
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
              <OctagonPause size={13} /> {t('contractCard.stopContract')}
            </button>
          )}
          <button className="sched-end-btn" style={{ background: 'var(--danger)', marginInlineStart: 8 }} onClick={handleDelete}>
            <Trash2 size={13} /> {t('contractCard.delete')}
          </button>
        </div>
      )}
    </div>
  );
}
