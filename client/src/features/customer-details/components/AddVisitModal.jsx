import { useState } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { customerDetailsApi } from '../services/customerDetails.service';

export default function AddVisitModal({ contactId, contactName, onClose, onAdded }) {
  const [visitDate, setVisitDate] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError('');
    if (!visitDate) return setError('لازم تحدد تاريخ الزيارة');
    if (!workDone.trim()) return setError('لازم تكتب اللي اتعمل في الزيارة');

    setSaving(true);
    try {
      await customerDetailsApi.addVisit(contactId, {
        visitDate,
        workDone: workDone.trim(),
        arrivalTime: arrivalTime || null,
        departureTime: departureTime || null,
      });
      onAdded();
    } catch (err) {
      console.error('[API] submitVisit error:', err);
      setError(err.response?.data?.error || 'فشل إضافة الزيارة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <CalendarPlus size={22} />
        </div>
        <div className="resolve-modal-title">إضافة زيارة</div>
      </div>

      <div className="resolve-cats-label">العميل</div>
      <div className="st-modal-readonly-value" style={{ marginBottom: 14 }}>{contactName}</div>

      <div className="resolve-cats-label">تاريخ الزيارة</div>
      <input type="date" className="iw-input" style={{ marginBottom: 14 }} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />

      <div className="resolve-cats-label">اللي اتعمل في الزيارة</div>
      <textarea className="resolve-notes" style={{ marginBottom: 14 }} value={workDone} onChange={(e) => setWorkDone(e.target.value)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
        <div>
          <div className="resolve-cats-label" style={{ marginTop: 0 }}>وقت الوصول (اختياري)</div>
          <input type="time" className="iw-input" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
        </div>
        <div>
          <div className="resolve-cats-label" style={{ marginTop: 0 }}>وقت الانصراف (اختياري)</div>
          <input type="time" className="iw-input" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
        </div>
      </div>

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>إلغاء</button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Check size={16} /> {saving ? 'جارِ الحفظ...' : 'حفظ الزيارة'}
        </button>
      </div>
      {error && <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{error}</div>}
    </Modal>
  );
}
