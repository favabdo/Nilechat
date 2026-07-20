import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { contactsApi } from '../../contacts/services/contacts.service';
import useToastStore from '../../../store/toastStore';

const CUSTOMER_PHONE_REGEX = /^(201[0125]\d{8}|9665\d{8})$/;

export default function AddPhoneForm({ contactId, onAdded }) {
  const showToast = useToastStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  async function submit() {
    if (!contactId) return showToast('اربط المحادثة بعميل الأول', 'error');
    const phone = value.trim();
    if (!phone) return showToast('لازم تكتب رقم التليفون', 'error');
    if (!CUSTOMER_PHONE_REGEX.test(phone)) {
      setInvalid(true);
      return showToast('رقم التليفون لازم يكون بالصيغة الدولية بدون + وبدون مسافات، مثال: 201010293696', 'error');
    }
    try {
      const data = await contactsApi.addPhone(contactId, phone);
      onAdded(data.contact.phones.map((ph) => ({ number: ph.phone_number, label: ph.label || null })));
      setOpen(false);
      setValue('');
      setInvalid(false);
      showToast('تم إضافة الرقم بنجاح', 'success');
    } catch (err) {
      console.error('[API] addPhoneNumber error:', err);
      showToast(err.response?.data?.error || 'فشل إضافة الرقم', 'error');
    }
  }

  if (!open) {
    return (
      <button id="add-phone-btn" className="add-btn" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add Phone Number
      </button>
    );
  }

  return (
    <div id="add-phone-form" className="show">
      <input
        type="text"
        id="new-phone-number"
        className="device-edit-input"
        placeholder="201010293696"
        value={value}
        autoFocus
        onChange={(e) => {
          setValue(e.target.value);
          setInvalid(false);
        }}
      />
      <div id="new-phone-hint" style={{ fontSize: 11, color: invalid ? 'var(--danger)' : 'var(--text-secondary)', margin: '4px 0 6px' }}>
        بالصيغة الدولية بدون + وبدون مسافات (مثال: 201010293696)
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="tpl-save-btn" onClick={submit}>
          <Check size={12} /> حفظ
        </button>
        <button
          className="tpl-cancel-btn"
          onClick={() => {
            setOpen(false);
            setValue('');
            setInvalid(false);
          }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
