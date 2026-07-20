import { useState } from 'react';
import { UserPlus, Plus, X, Check } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { contactsApi } from '../services/contacts.service';

const CUSTOMER_PHONE_REGEX = /^(201[0125]\d{8}|9665\d{8})$/;

const CONTACT_MODULES_LIST = [
  'حسابات عامه',
  'اداره المخازن (مخزن)',
  'اداره المخازن (نقطة بيع)',
  'اداره المخازن(مطعم)',
  'اداره المخازن(ماركت)',
  'نقطة بيع فقط',
  'شئون موظفيين',
  'التوكيلات التجاريه',
  'الاداره التجاريه',
  'قطع الغيار',
  'السيارات',
  'شركات النقل',
  'المخازن(المخازن وحسابات)',
  'المخازن(التصنيع)',
  'المجوهرات',
  'فلاتر المياه',
  'المقاولات',
  'الحجوزات',
  'فاتوره الكترونيه ( مصريه )',
  'فاتوره الكترونيه ( سعوديه )',
];

export default function CustomerCardModal({ mode, contact, onClose, onSaved }) {
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
    if (!trimmedName) return setError('لازم تكتب اسم الشركة');
    if (!isEdit && !phone.trim()) return setError('لازم تكتب رقم تليفون العميل');
    if (!isEdit && !CUSTOMER_PHONE_REGEX.test(phone.trim())) {
      setPhoneInvalid(true);
      return setError('مثال: 201035292196');
    }
    if (!isEdit && (contractStart || contractEnd) && !(contractStart && contractEnd)) {
      return setError('لو هتحدد عقد صيانة، لازم تحدد تاريخ البدء والانتهاء مع بعض');
    }
    if (!isEdit && contractStart && contractEnd && new Date(contractEnd) < new Date(contractStart)) {
      return setError('تاريخ انتهاء العقد لازم يكون بعد تاريخ البدء');
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
      onSaved(data);
    } catch (err) {
      console.error('[API] submitCustomerCard error:', err);
      setError(err.response?.data?.error || 'حصل خطأ، حاول تاني');
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
        <div className="resolve-modal-title">{isEdit ? 'Edit Customer' : 'Add Customer'}</div>
      </div>
      <div className="resolve-modal-sub">بيانات العميل الأساسية{!isEdit && ' — وعقد الصيانة كمان لو حابب تسجله من هنا على طول'}</div>

      <div className="resolve-cats-label">اسم الشركة</div>
      <input type="text" className="iw-input" style={{ marginBottom: 12 }} value={name} onChange={(e) => setName(e.target.value)} />

      <div className="resolve-cats-label">الفروع</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {branches.map((b, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              className="iw-input"
              style={{ flex: 1 }}
              placeholder="اسم الفرع (مثال: فرع المعادي)"
              value={b.name}
              onChange={(e) => updateBranch(idx, 'name', e.target.value)}
            />
            <input
              type="text"
              className="iw-input"
              style={{ flex: 1.4 }}
              placeholder="عنوان الفرع"
              value={b.location}
              onChange={(e) => updateBranch(idx, 'location', e.target.value)}
            />
            <button type="button" className="st-icon-btn" title="حذف الفرع" onClick={() => removeBranchRow(idx)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="resolve-cancel-btn" style={{ padding: '6px 12px', fontSize: 12.5, marginBottom: 12 }} onClick={addBranchRow}>
        <Plus size={14} /> إضافة فرع
      </button>

      {!isEdit && (
        <>
          <div className="resolve-cats-label">رقم التليفون</div>
          <input
            type="text"
            className="iw-input"
            placeholder="مثال: 201001234567"
            maxLength={12}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneInvalid(false);
            }}
          />
          <div className="iw-form-hint" style={{ marginBottom: 12, color: phoneInvalid ? 'var(--danger)' : undefined }}>
            مثال: <b dir="ltr">201001234567</b>
          </div>
        </>
      )}

      <div className="st-modal-readonly-row">
        <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="resolve-cats-label">تاريخ التعاقد</div>
          <input type="date" className="iw-input" value={signedContractDate} onChange={(e) => setSignedContractDate(e.target.value)} />
        </div>
        <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="resolve-cats-label">اسم ورقم صاحب المؤسسة</div>
          <input
            type="text"
            className="iw-input"
            placeholder="اسم صاحب المؤسسة"
            style={{ marginBottom: 8 }}
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />
          <input type="text" className="iw-input" placeholder="رقم تليفون صاحب المؤسسة" value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} />
        </div>
      </div>
      <div className="iw-form-hint" style={{ marginTop: -8, marginBottom: 12 }}>
        معلومات مستقلة بس عشان نعرف امتى اتعاقدنا مع العميل ده لأول مرة — مالهاش أي علاقة بعقد الصيانة
      </div>

      {!isEdit && (
        <>
          <div className="st-modal-readonly-row">
            <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="resolve-cats-label">تاريخ بدء عقد الصيانة (اختياري)</div>
              <input type="date" className="iw-input" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
            </div>
            <div className="st-modal-readonly" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="resolve-cats-label">تاريخ انتهاء عقد الصيانة (اختياري)</div>
              <input type="date" className="iw-input" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
            </div>
          </div>
          <div className="iw-form-hint" style={{ marginTop: -8, marginBottom: 12 }}>هيتسجل كأول عقد صيانة للعميل فورًا.</div>
        </>
      )}

      <div className="resolve-cats-label">الموديولات اللي العميل مشترك فيها</div>
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
        placeholder="موديول تاني مش في القايمة؟ اكتبه هنا (افصل بفاصلة لو أكتر من واحد)"
        style={{ marginTop: 8, marginBottom: 12 }}
        value={customModules}
        onChange={(e) => setCustomModules(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>إلغاء</button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Check size={16} /> {saving ? 'جارِ الحفظ...' : isEdit ? 'Save Changes' : 'Add Customer'}
        </button>
      </div>
      {error && <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </Modal>
  );
}
