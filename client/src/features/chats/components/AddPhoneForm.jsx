import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import { contactsApi } from '../../contacts/services/contacts.service';
import { CUSTOMER_PHONE_REGEX } from '../../contacts/phoneCountries';
import useToastStore from '../../../store/toastStore';

export default function AddPhoneForm({ contactId, onAdded }) {
  const { t } = useTranslation('chats');
  const showToast = useToastStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  async function submit() {
    if (!contactId) return showToast(t('addPhone.linkCustomerFirst'), 'error');
    const phone = value.trim();
    if (!phone) return showToast(t('addPhone.phoneRequired'), 'error');
    if (!CUSTOMER_PHONE_REGEX.test(phone)) {
      setInvalid(true);
      return showToast(t('addPhone.phoneInvalid'), 'error');
    }
    try {
      const data = await contactsApi.addPhone(contactId, phone);
      onAdded(data.contact.phones.map((ph) => ({ number: ph.phone_number, label: ph.label || null })));
      setOpen(false);
      setValue('');
      setInvalid(false);
      showToast(t('addPhone.addSuccess'), 'success');
    } catch (err) {
      console.error('[API] addPhoneNumber error:', err);
      showToast(err.response?.data?.error || t('addPhone.addFailed'), 'error');
    }
  }

  if (!open) {
    return (
      <button id="add-phone-btn" className="add-btn" onClick={() => setOpen(true)}>
        <Plus size={16} /> {t('addPhone.addButton')}
      </button>
    );
  }

  return (
    <div id="add-phone-form" className="show">
      <input
        type="text"
        id="new-phone-number"
        className="device-edit-input"
        placeholder={t('addPhone.placeholder')}
        value={value}
        autoFocus
        onChange={(e) => {
          setValue(e.target.value);
          setInvalid(false);
        }}
      />
      <div id="new-phone-hint" style={{ fontSize: 11, color: invalid ? 'var(--danger)' : 'var(--text-secondary)', margin: '4px 0 6px' }}>
        {t('addPhone.hint')}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="tpl-save-btn" onClick={submit}>
          <Check size={12} /> {t('addPhone.save')}
        </button>
        <button
          className="tpl-cancel-btn"
          onClick={() => {
            setOpen(false);
            setValue('');
            setInvalid(false);
          }}
        >
          {t('addPhone.cancel')}
        </button>
      </div>
    </div>
  );
}
