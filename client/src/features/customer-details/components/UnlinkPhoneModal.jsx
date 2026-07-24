import { useState } from 'react';
import { Unlink, Check } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { contactsApi } from '../../contacts/services/contacts.service';

// فصل رقم تليفون من عميل عنده أكتر من رقم — بيتحول الرقم لكارت عميل جديد
// منفصل (بنفس الاسم افتراضيًا)، والمحادثات القديمة بتاعة الرقم ده بتتبع
// الكارت الجديد بدل القديم. نفس بالظبط لوجيك render.
export default function UnlinkPhoneModal({ contactId, phone, defaultName, onClose, onUnlinked }) {
  const [newName, setNewName] = useState(defaultName || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError('');
    setSaving(true);
    try {
      await contactsApi.unlinkPhone(contactId, phone, newName.trim() || undefined);
      onUnlinked();
    } catch (err) {
      console.error('[API] confirmUnlinkPhone error:', err);
      setError(err.response?.data?.error || 'فشل فصل الرقم');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(214,69,69,0.12)', color: 'var(--danger)' }}>
          <Unlink size={22} />
        </div>
        <div className="resolve-modal-title">فصل رقم تليفون</div>
      </div>
      <div className="resolve-modal-sub">
        هيتفصل الرقم <b>{phone}</b> عن العميل الحالي، وهيتحول لكارت عميل جديد منفصل
      </div>

      <div className="resolve-cats-label">اسم العميل الجديد</div>
      <input
        type="text"
        className="iw-input"
        placeholder="اسم العميل الجديد"
        style={{ marginBottom: 6 }}
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>إلغاء</button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Check size={16} /> {saving ? 'جارِ الفصل...' : 'تأكيد الفصل'}
        </button>
      </div>
      {error && <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </Modal>
  );
}
