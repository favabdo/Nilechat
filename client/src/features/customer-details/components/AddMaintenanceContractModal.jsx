import { useState } from 'react';
import { FilePlus2, Check } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { customerDetailsApi } from '../services/customerDetails.service';

export default function AddMaintenanceContractModal({ contactId, contactName, onClose, onAdded }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError('');
    if (!startDate) return setError('لازم تحدد تاريخ بدء العقد');
    if (!endDate) return setError('لازم تحدد تاريخ انتهاء العقد');
    if (new Date(endDate) < new Date(startDate)) return setError('تاريخ انتهاء العقد لازم يكون بعد تاريخ البدء');

    setSaving(true);
    try {
      const data = await customerDetailsApi.addMaintenanceContract(contactId, { startDate, endDate, notes: notes.trim() || undefined });
      onAdded(data.contact);
    } catch (err) {
      console.error('[API] submitMaintenanceContract error:', err);
      setError(err.response?.data?.error || 'فشل إضافة عقد الصيانة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <FilePlus2 size={22} />
        </div>
        <div className="resolve-modal-title">إضافة عقد صيانة</div>
      </div>

      <div className="resolve-cats-label">العميل</div>
      <div className="st-modal-readonly-value" style={{ marginBottom: 14 }}>{contactName}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div className="resolve-cats-label" style={{ marginTop: 0 }}>تاريخ البدء</div>
          <input type="date" className="iw-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <div className="resolve-cats-label" style={{ marginTop: 0 }}>تاريخ الانتهاء</div>
          <input type="date" className="iw-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="resolve-cats-label">ملاحظات (اختياري)</div>
      <textarea className="resolve-notes" style={{ marginBottom: 6 }} value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>إلغاء</button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Check size={16} /> {saving ? 'جارِ الحفظ...' : 'حفظ العقد'}
        </button>
      </div>
      {error && <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{error}</div>}
    </Modal>
  );
}
