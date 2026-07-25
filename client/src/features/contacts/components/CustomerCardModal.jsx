import { useState } from 'react';
import { UserPlus, Plus, X, Check, Crown, UserX } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ContractDurationPicker from '../../../components/shared/ContractDurationPicker';
import { contactsApi } from '../services/contacts.service';
import { CONTACT_MODULES_LIST } from '../constants';
import useTranslation from '../../../i18n/useTranslation';

const CUSTOMER_PHONE_REGEX = /^(201[0125]\d{8}|9665\d{8})$/;

export default function CustomerCardModal({ mode, contact, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';
  const [name, setName] = useState(contact?.name || '');
  const [branches, setBranches] = useState(
    contact?.branches?.length ? contact.branches.map((b) => ({ name: b.name || '', location: b.location || '' })) : [{ name: '', location: '' }]
  );
  const [phone, setPhone] = useState('');
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [signedContractDate, setSignedContractDate] = useState(contact?.contract_date ? contact.contract_date.slice(0, 10) : '');
  const [managerName, setManagerName] = useState(contact?.manager_name || '');
  const [managerPhone, setManagerPhone] = useState(contact?.manager_phone || '');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [selectedModules, setSelectedModules] = useState(new Set((contact?.modules || []).map((m) => m.name || m)));
  const [customModules, setCustomModules] = useState('');
  const initialIsVip = contact?.is_vip === 1;
  const initialIsInactive = contact?.is_inactive === 1;
  const [isVip, setIsVip] = useState(initialIsVip);
  const [isInactive, setIsInactive] = useState(initialIsInactive);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateBranch(idx, field, value) {
    setBranches((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  }
  function addBranchRow() {
    setBranches((prev) => [...prev, { name: '', location: '' }]);
  }
  function removeBranchRow(idx) {
    setBranches((prev) => prev.filter((_, i) => i !== idx));
  }
  function toggleModule(name) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function submit() {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) return setError(t('contacts.modalCompanyNameRequired'));
    if (!isEdit && !phone.trim()) return setError(t('contacts.modalPhoneRequired'));
    if (!isEdit && !CUSTOMER_PHONE_REGEX.test(phone.trim())) {
      setPhoneInvalid(true);
      return setError(t('contacts.modalPhoneExample'));
    }
    if (!isEdit && (contractStart || contractEnd) && !(contractStart && contractEnd)) {
      return setError(t('contacts.modalContractDatesRequired'));
    }
    if (!isEdit && contractStart && contractEnd && new Date(contractEnd) < new Date(contractStart)) {
      return setError(t('contacts.modalContractEndAfterStart'));
    }

    const cleanBranches = branches.map((b) => ({ name: b.name.trim(), location: b.location.trim() })).filter((b) => b.name || b.location);
    const custom = customModules.split(',').map((s) => s.trim()).filter(Boolean);
    const modules = [...new Set([...selectedModules, ...custom])];

    const body = isEdit
      ? {
          name: trimmedName,
          branches: cleanBranches,
          signedContractDate: signedContractDate || undefined,
          managerName: managerName.trim() || undefined,
          managerPhone: managerPhone.trim() || undefined,
          modules,
        }
      : {
          name: trimmedName,
          branches: cleanBranches,
          phone: phone.trim(),
          signedContractDate: signedContractDate || undefined,
          managerName: managerName.trim() || undefined,
          managerPhone: managerPhone.trim() || undefined,
          contractDate: contractStart || undefined,
          maintenanceEndDate: contractEnd || undefined,
          modules,
        };

    setSaving(true);
    try {
      const data = isEdit ? await contactsApi.updateCustomerCard(contact.id, body) : await contactsApi.createCustomerCard(body);
      const savedContactId = isEdit ? contact.id : data?.contact?.id;
      // is_vip و is_inactive أعمدة مستقلة عن باقي بيانات الكارت، ليهم endpoints
      // خاصة بيهم (setVip/setInactive) — بننادي عليهم بس لو القيمة اتغيرت فعلاً
      // (في وضع التعديل) أو لو اتحطت من الأول (في وضع الإضافة)
      if (savedContactId) {
        if (isEdit ? isVip !== initialIsVip : isVip) {
          await contactsApi.setVip(savedContactId, isVip);
        }
        if (isEdit ? isInactive !== initialIsInactive : isInactive) {
          await contactsApi.setInactive(savedContactId, isInactive);
        }
      }
      onSaved(data);
    } catch (err) {
      console.error('[API] submitCustomerCard error:', err);
      setError(err.response?.data?.error || t('contacts.modalGenericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <UserPlus size={22} />
        </div>
        <div className="resolve-modal-title">{isEdit ? t('contacts.modalEditCustomer') : t('contacts.modalAddCustomer')}</div>
      </div>
      <div className="resolve-modal-sub">{t('contacts.modalSubtitleBase')}{!isEdit && t('contacts.modalSubtitleContractHint')}</div>

      <div className="resolve-cats-label">{t('contacts.modalCompanyName')}</div>
      <input type="text" className="iw-input" style={{ marginBottom: 12 }} value={name} onChange={(e) => setName(e.target.value)} />

      <div className="resolve-cats-label">{t('contacts.modalBranches')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {branches.map((b, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              className="iw-input"
              style={{ flex: 1 }}
              placeholder={t('contacts.modalBranchNamePlaceholder')}
              value={b.name}
              onChange={(e) => updateBranch(idx, 'name', e.target.value)}
            />
            <input
              type="text"
              className="iw-input"
              style={{ flex: 1.4 }}
              placeholder={t('contacts.modalBranchAddressPlaceholder')}
              value={b.location}
              onChange={(e) => updateBranch(idx, 'location', e.target.value)}
            />
            <button type="button" className="st-icon-btn" title={t('contacts.modalDeleteBranch')} onClick={() => removeBranchRow(idx)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="resolve-cancel-btn" style={{ padding: '6px 12px', fontSize: 12.5, marginBottom: 12 }} onClick={addBranchRow}>
        <Plus size={14} /> {t('contacts.modalAddBranch')}
      </button>

      {!isEdit && (
        <>
          <div className="resolve-cats-label">{t('contacts.modalPhoneLabel')}</div>
          <input
            type="text"
            className="iw-input"
            placeholder={t('contacts.modalPhonePlaceholder')}
            maxLength={12}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneInvalid(false);
            }}
          />
          <div className="iw-form-hint" style={{ marginBottom: 12, color: phoneInvalid ? 'var(--danger)' : undefined }}>
            {t('contacts.modalPhoneHintExample')} <b dir="ltr">201001234567</b>
          </div>
        </>
      )}

      <div className="st-modal-readonly-row">
        <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="resolve-cats-label">{t('contacts.modalContractDateLabel')}</div>
          <input type="date" className="iw-input" value={signedContractDate} onChange={(e) => setSignedContractDate(e.target.value)} />
        </div>
        <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="resolve-cats-label">{t('contacts.modalManagerLabel')}</div>
          <input
            type="text"
            className="iw-input"
            placeholder={t('contacts.modalManagerNamePlaceholder')}
            style={{ marginBottom: 8 }}
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />
          <input type="text" className="iw-input" placeholder={t('contacts.modalManagerPhonePlaceholder')} value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} />
        </div>
      </div>
      <div className="iw-form-hint" style={{ marginTop: -8, marginBottom: 12 }}>
        {t('contacts.modalContractDateHint')}
      </div>

      {!isEdit && (
        <>
          <div className="st-modal-readonly-row">
            <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="resolve-cats-label">{t('contacts.modalContractStartLabel')}</div>
              <input type="date" className="iw-input" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
            </div>
            <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="resolve-cats-label">{t('contacts.modalContractEndLabel')}</div>
              <input type="date" className="iw-input" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
            </div>
          </div>

          <div className="resolve-cats-label" style={{ marginTop: 4 }}>{t('contacts.modalContractDurationLabel')}</div>
          <ContractDurationPicker startDate={contractStart} onEndDateChange={setContractEnd} />

          <div className="iw-form-hint" style={{ marginTop: -2, marginBottom: 12 }}>{t('contacts.modalContractDurationHint')}</div>
        </>
      )}

      <div className="resolve-cats-label">{t('contacts.customerStatus')}</div>
      <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
        <label className="contact-modules-item">
          <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
          <Crown size={13} style={{ verticalAlign: -2, color: '#f5a623' }} /> {t('contacts.vip')}
        </label>
        <label className="contact-modules-item">
          <input type="checkbox" checked={isInactive} onChange={(e) => setIsInactive(e.target.checked)} />
          <UserX size={13} style={{ verticalAlign: -2 }} /> {t('contacts.inactive')}
        </label>
      </div>

      <div className="resolve-cats-label">{t('contacts.modulesSubscribed')}</div>
      <div className="contact-modules-grid">
        {CONTACT_MODULES_LIST.map((m) => (
          <label className="contact-modules-item" key={m}>
            <input type="checkbox" checked={selectedModules.has(m)} onChange={() => toggleModule(m)} />
            {m}
          </label>
        ))}
      </div>
      <input
        type="text"
        className="iw-input"
        placeholder={t('contacts.modalCustomModulesPlaceholder')}
        style={{ marginTop: 8, marginBottom: 12 }}
        value={customModules}
        onChange={(e) => setCustomModules(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>{t('common.cancel')}</button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Check size={16} /> {saving ? t('common.saving') : isEdit ? t('contacts.modalSaveChanges') : t('contacts.modalAddCustomer')}
        </button>
      </div>
      {error && <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </Modal>
  );
}
