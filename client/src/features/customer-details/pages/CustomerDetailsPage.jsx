import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, User, CalendarClock, Layers, CalendarPlus, FilePlus2, Briefcase, Pencil, Tag, Unlink, Crown, UserX } from 'lucide-react';
import { customerDetailsApi } from '../services/customerDetails.service';
import { contactsApi } from '../../contacts/services/contacts.service';
import { formatSchedDate, formatDurationDays } from '../../../utils/dateFormat';
import useChatsStore from '../../chats/store/chatsStore';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import AddPhoneForm from '../../chats/components/AddPhoneForm';
import VisitCard from '../components/VisitCard';
import MaintenanceContractCard from '../components/MaintenanceContractCard';
import AddVisitModal from '../components/AddVisitModal';
import AddMaintenanceContractModal from '../components/AddMaintenanceContractModal';
import UnlinkPhoneModal from '../components/UnlinkPhoneModal';
import CustomerCardModal from '../../contacts/components/CustomerCardModal';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function CustomerDetailsPage() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);
  const { conversations, selectChat } = useChatsStore();
  const { user } = useAuthStore();
  const canManage = isOwnerOrAdmin(user);

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('visits');
  const [editOpen, setEditOpen] = useState(false);

  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  const [addVisitOpen, setAddVisitOpen] = useState(false);
  const [addContractOpen, setAddContractOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);

  function loadContact() {
    setLoading(true);
    customerDetailsApi
      .getContact(contactId)
      .then(setContact)
      .catch((err) => console.error('[API] loadCustomerDetails error:', err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadContact();
    setVisitsLoading(true);
    customerDetailsApi
      .listVisits(contactId)
      .then(setVisits)
      .catch((err) => console.error('[API] loadCustomerVisits error:', err))
      .finally(() => setVisitsLoading(false));
    setContractsLoading(true);
    customerDetailsApi
      .listMaintenanceContracts(contactId)
      .then(setContracts)
      .catch((err) => console.error('[API] loadCustomerMaintenanceContracts error:', err))
      .finally(() => setContractsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  function openConversation() {
    const conv = conversations.find((c) => String(c.contactId) === String(contactId));
    if (!conv) return showToast('مفيش محادثات مسجلة لجهة الاتصال دي لسه', 'info');
    navigate('/dashboard/chats');
    selectChat(conv.id);
  }

  // نفس بالظبط لوجيك editCustomerDetailsPhoneLabel الأصلية — prompt بسيط
  // لكتابة/تعديل اسم ثانوي للرقم، بيشتغل هنا على contact مباشرة (بدل ما
  // يبقى محتاج محادثة مفتوحة أصلًا)
  async function editPhoneLabel(phoneNumber) {
    if (!contact) return;
    const p = (contact.phones || []).find((ph) => ph.phone_number === phoneNumber);
    const newLabel = window.prompt('اكتب اسم ثانوي للرقم ده (مثلاً: الشغل، الرقم الشخصي) — سيبه فاضي عشان تمسح الاسم الثانوي', (p && p.label) || '');
    if (newLabel === null) return;
    try {
      await contactsApi.updatePhoneLabel(contactId, phoneNumber, newLabel.trim());
      loadContact();
      showToast('تم حفظ الاسم الثانوي بنجاح', 'success');
    } catch (err) {
      console.error('[API] editPhoneLabel error:', err);
      showToast(err.response?.data?.error || 'فشل حفظ الاسم الثانوي', 'error');
    }
  }

  if (loading) {
    return (
      <div id="page-customer-details" className="page">
        <div className="page-content" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>جارِ التحميل...</div>
      </div>
    );
  }
  if (!contact) {
    return (
      <div id="page-customer-details" className="page">
        <div className="page-content" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>تعذر تحميل بيانات العميل</div>
      </div>
    );
  }

  const currentContract = contracts.find((c) => c.status !== 'stopped');
  const remainingLabel = currentContract ? formatDurationDays(new Date().toISOString(), currentContract.end_date) : null;
  // اسم/أسماء الفروع لو مسجلة، وإلا بنرجع لعمود location القديم بتاع العميل
  // كأنه هو الفرع، عشان صف "الفروع" في الصفحة دي يفضل معروض له قيمة لكل
  // العملاء بدل ما يفضل فاضي للعملاء اللي معندهمش فروع متعددة مسجلة
  const branchNames = (contact.branches || []).map((b) => b.name || b.location).filter(Boolean);
  const branchesDisplay = branchNames.length > 0 ? branchNames.join('، ') : contact.location || '-';

  return (
    <div id="page-customer-details" className="page">
      <div className="page-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-back-btn" title="رجوع" aria-label="رجوع" onClick={() => navigate('/dashboard/contacts')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {contact.name || 'بدون اسم'}
                {contact.is_vip === 1 && (
                  <span className="label-chip" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', fontSize: 11.5 }}>
                    <Crown size={12} style={{ verticalAlign: -2 }} /> VIP
                  </span>
                )}
                {contact.is_inactive === 1 && (
                  <span className="label-chip" style={{ background: 'rgba(148,163,184,0.18)', color: 'var(--text-secondary)', fontSize: 11.5 }}>
                    <UserX size={12} style={{ verticalAlign: -2 }} /> غير نشط
                  </span>
                )}
              </h2>
              {contact.location && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{contact.location}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canManage && (
              <button className="page-btn" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={() => setEditOpen(true)}>
                <Pencil size={15} /> Edit
              </button>
            )}
            <button className="page-btn" onClick={openConversation}>فتح المحادثة</button>
          </div>
        </div>

        <div className="settings-section">
          <h3>بيانات العميل</h3>
          <div className="setting-row">
            <div><div className="setting-label"><Briefcase size={13} style={{ verticalAlign: -2 }} /> المدير المسؤول</div></div>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
              {contact.manager_name || '-'}{contact.manager_phone ? ` · ${contact.manager_phone}` : ''}
            </span>
          </div>
          <div className="setting-row">
            <div><div className="setting-label"><CalendarClock size={13} style={{ verticalAlign: -2 }} /> تاريخ التعاقد</div></div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{formatSchedDate(contact.contract_date)}</span>
              {contact.created_by && (
                <div style={{ opacity: 0.65, fontSize: 12, marginTop: 2 }}>
                  {contact.created_by_name || `Agent ID: ${contact.created_by}`}
                </div>
              )}
            </div>
          </div>
          {currentContract && (
            <div className="setting-row">
              <div><div className="setting-label"><CalendarClock size={13} style={{ verticalAlign: -2 }} /> عقد الصيانة الحالي</div></div>
              <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                {formatSchedDate(currentContract.start_date)} → {formatSchedDate(currentContract.end_date)} ({remainingLabel})
              </span>
            </div>
          )}
          <div className="setting-row">
            <div><div className="setting-label"><Building2 size={13} style={{ verticalAlign: -2 }} /> الفروع</div></div>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{branchesDisplay}</span>
          </div>
          {contact.modules && contact.modules.length > 0 && (
            <div style={{ padding: '12px 0 4px' }}>
              <div className="setting-label" style={{ marginBottom: 8 }}><Layers size={13} style={{ verticalAlign: -2 }} /> الموديولات المشترك فيها</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {contact.modules.map((m) => (
                  <span key={m.name || m} className="label-chip" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--primary)' }}>
                    {m.name || m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>أرقام التليفون</h3>
          <div className="info-list" style={{ marginBottom: 10 }}>
            {(contact.phones || []).map((p) => (
              <div key={p.phone_number} className="info-item">
                <div className="info-item-text">
                  <Phone size={14} />
                  <span>{p.phone_number}</span>
                  {p.label && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({p.label})</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {canManage && (
                    <button
                      className="resolve-cancel-btn"
                      style={{ padding: '4px 9px', fontSize: 11.5 }}
                      title="حط/عدّل اسم ثانوي للرقم"
                      onClick={() => editPhoneLabel(p.phone_number)}
                    >
                      <Tag size={12} /> اسم ثانوي
                    </button>
                  )}
                  {canManage && (contact.phones || []).length > 1 && (
                    <button
                      className="resolve-cancel-btn"
                      style={{ padding: '4px 9px', fontSize: 11.5 }}
                      onClick={() => setUnlinkTarget(p.phone_number)}
                    >
                      <Unlink size={12} /> فصل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <AddPhoneForm contactId={contactId} onAdded={() => loadContact()} />
        </div>

        <div className="sched-page-tabs">
          <button className={`sched-page-tab${tab === 'visits' ? ' active' : ''}`} onClick={() => setTab('visits')}>
            <User size={14} /> Visits <span className="sched-subhead-count">({visits.length})</span>
          </button>
          <button className={`sched-page-tab${tab === 'contracts' ? ' active' : ''}`} onClick={() => setTab('contracts')}>
            <FilePlus2 size={14} /> Maintenance History <span className="sched-subhead-count">({contracts.length})</span>
          </button>
        </div>

        {tab === 'visits' && (
          <div>
            <button className="page-btn" style={{ marginBottom: 12 }} onClick={() => setAddVisitOpen(true)}>
              <CalendarPlus size={16} /> إضافة زيارة
            </button>
            <div className="sched-tasks-grid">
              {visitsLoading ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>جارِ التحميل...</div>
              ) : visits.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>لا توجد زيارات مسجلة</div>
              ) : (
                visits.map((v) => <VisitCard key={v.id} v={v} />)
              )}
            </div>
          </div>
        )}

        {tab === 'contracts' && (
          <div>
            <button className="page-btn" style={{ marginBottom: 12 }} onClick={() => setAddContractOpen(true)}>
              <FilePlus2 size={16} /> إضافة عقد صيانة
            </button>
            <div className="sched-tasks-grid">
              {contractsLoading ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>جارِ التحميل...</div>
              ) : contracts.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>لا توجد عقود صيانة مسجلة</div>
              ) : (
                contracts.map((c) => (
                  <MaintenanceContractCard
                    key={c.id}
                    contract={c}
                    contactId={contactId}
                    onChanged={() => {
                      customerDetailsApi.listMaintenanceContracts(contactId).then(setContracts);
                      loadContact();
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {addVisitOpen && (
        <AddVisitModal
          contactId={contactId}
          contactName={contact.name}
          onClose={() => setAddVisitOpen(false)}
          onAdded={() => {
            setAddVisitOpen(false);
            showToast('تم إضافة الزيارة بنجاح', 'success');
            customerDetailsApi.listVisits(contactId).then(setVisits);
          }}
        />
      )}
      {addContractOpen && (
        <AddMaintenanceContractModal
          contactId={contactId}
          contactName={contact.name}
          onClose={() => setAddContractOpen(false)}
          onAdded={() => {
            setAddContractOpen(false);
            showToast('تم إضافة عقد الصيانة بنجاح', 'success');
            customerDetailsApi.listMaintenanceContracts(contactId).then(setContracts);
            loadContact();
          }}
        />
      )}
      {editOpen && (
        <CustomerCardModal
          mode="edit"
          contact={contact}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            showToast('تم تحديث بيانات العميل بنجاح', 'success');
            loadContact();
          }}
        />
      )}
      {unlinkTarget && (
        <UnlinkPhoneModal
          contactId={contactId}
          phone={unlinkTarget}
          defaultName={contact.name}
          onClose={() => setUnlinkTarget(null)}
          onUnlinked={() => {
            setUnlinkTarget(null);
            showToast('تم فصل الرقم لعميل جديد منفصل', 'success');
            loadContact();
          }}
        />
      )}
    </div>
  );
}
