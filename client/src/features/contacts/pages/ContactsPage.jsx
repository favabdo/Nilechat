import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, AlertTriangle, ShieldCheck, BadgeCheck, Package, MessageCircle } from 'lucide-react';
import { contactsApi } from '../services/contacts.service';
import Avatar from '../../../components/ui/Avatar';
import Pagination from '../../../components/ui/Pagination';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import CustomerCardModal from '../components/CustomerCardModal';

const PAGE_SIZE = 20;
const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

// نفس فكرة resolveContactsCategory الأصلية: تاب "عملاء مسجلين" له سيكشنين
// فرعيين (عقد ساري/منتهي)، والتابين التانيين (بدون عقد / غير مسجلة) مالهمش سيكشنات
function resolveCategory(activeTab, registeredSubTab) {
  if (activeTab === 'registered') return registeredSubTab;
  return activeTab;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('registered');
  const [registeredSubTab, setRegisteredSubTab] = useState('active_contract');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ activeContract: 0, expiredContract: 0, noContract: 0, unregistered: 0 });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const canManage = isOwnerOrAdmin(user);
  const debounceRef = useRef(null);

  function load(targetPage) {
    setLoading(true);
    setFailed(false);
    contactsApi
      .listPaginated({ page: targetPage, pageSize: PAGE_SIZE, q: search, category: resolveCategory(activeTab, registeredSubTab) })
      .then((data) => {
        setContacts(data.contacts || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      })
      .catch((err) => {
        console.error('[API] loadContactsPage error:', err);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1), 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeTab, registeredSubTab]);

  function switchTab(tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await contactsApi.remove(deleteTarget.id);
      showToast('تم حذف العميل بنجاح', 'success');
      load(page);
    } catch (err) {
      console.error('[API] deleteContact error:', err);
      showToast(err.response?.data?.error || 'فشل حذف العميل', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const emptyMsg = search
    ? 'لا توجد نتائج مطابقة'
    : activeTab === 'registered'
      ? registeredSubTab === 'active_contract'
        ? 'لا يوجد عملاء بعقد صيانة ساري'
        : 'لا يوجد عملاء بعقد صيانة منتهي'
      : activeTab === 'no_contract'
        ? 'لا يوجد عملاء بدون عقد صيانة'
        : 'لا يوجد ارقام غير مسجله لعرضها';

  return (
    <div id="page-contacts" className="page">
      <div className="page-content">
        <div className="page-header">
          <h2>Contacts</h2>
          {canManage && (
            <button className="page-btn" onClick={() => setAddModalOpen(true)}>
              <Plus size={16} /> Add Contact
            </button>
          )}
        </div>

        <div className="contacts-tabs" id="contacts-tabs">
          <button className={`contacts-tab${activeTab === 'registered' ? ' active' : ''}`} onClick={() => switchTab('registered')}>
            <BadgeCheck size={14} /> عملاء مسجلين
            <span className="contacts-tab-count">{(counts.activeContract || 0) + (counts.expiredContract || 0)}</span>
          </button>
          <button className={`contacts-tab${activeTab === 'no_contract' ? ' active' : ''}`} onClick={() => switchTab('no_contract')}>
            <Package size={14} /> عملاء بدون عقد صيانة
            <span className="contacts-tab-count">{counts.noContract || 0}</span>
          </button>
          <button className={`contacts-tab${activeTab === 'unregistered' ? ' active' : ''}`} onClick={() => switchTab('unregistered')}>
            <MessageCircle size={14} /> ارقام غير مسجله
            <span className="contacts-tab-count">{counts.unregistered || 0}</span>
          </button>
        </div>

        {activeTab === 'registered' && (
          <div className="contacts-subtabs" id="contacts-subtabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`contacts-subtab${registeredSubTab === 'active_contract' ? ' active' : ''}`}
              onClick={() => setRegisteredSubTab('active_contract')}
            >
              <ShieldCheck size={13} /> عقد صيانة ساري
              <span className="contacts-tab-count">{counts.activeContract || 0}</span>
            </button>
            <button
              className={`contacts-subtab${registeredSubTab === 'expired_contract' ? ' active' : ''}`}
              onClick={() => setRegisteredSubTab('expired_contract')}
            >
              <AlertTriangle size={13} /> عقد صيانة منتهي
              <span className="contacts-tab-count">{counts.expiredContract || 0}</span>
            </button>
          </div>
        )}

        <div style={{ maxWidth: 500, marginBottom: 24 }}>
          <div className="cl-search-wrap">
            <Search size={16} className="cl-search-icon" />
            <input
              type="text"
              className="cl-search"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-grid" id="contacts-grid">
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13, gridColumn: '1/-1' }}>
              جاري التحميل...
            </div>
          )}
          {!loading && failed && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13, gridColumn: '1/-1' }}>
              تعذر تحميل جهات الاتصال
            </div>
          )}
          {!loading && !failed && contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13, gridColumn: '1/-1' }}>
              {emptyMsg}
            </div>
          )}
          {!loading &&
            !failed &&
            contacts.map((c) => {
              const hasMaintenanceInfo = !!c.maintenance_end_date;
              const isExpired = hasMaintenanceInfo && new Date(c.maintenance_end_date) < new Date(new Date().toDateString());
              return (
                <div key={c.id} className="contact-card" style={{ position: 'relative' }} onClick={() => navigate(`/dashboard/contacts/${c.id}`)}>
                  {canManage && (
                    <button
                      className="st-icon-btn"
                      style={{ position: 'absolute', top: 10, insetInlineStart: 10, color: 'var(--danger)' }}
                      title="حذف العميل"
                      aria-label="حذف العميل"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(c);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="contact-card-avatar">
                    <Avatar name={c.name} seed={`contact-${c.id}`} size={52} />
                  </div>
                  <div>
                    <div className="contact-card-name">{c.name || 'بدون اسم'}</div>
                    {(c.phones || []).map((p) => (
                      <div key={p.phone_number} className="contact-card-info">
                        {p.phone_number}
                        {p.label ? ` · ${p.label}` : ''}
                      </div>
                    ))}
                    {hasMaintenanceInfo && (
                      <div className="contact-card-info" style={{ marginTop: 4, fontWeight: 700, color: isExpired ? 'var(--danger)' : 'var(--success)' }}>
                        {isExpired ? <AlertTriangle size={12} style={{ verticalAlign: -2 }} /> : <ShieldCheck size={12} style={{ verticalAlign: -2 }} />}
                        {' '}
                        {isExpired ? 'عقد الصيانة منتهي' : 'عميل صيانة'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p)} />
      </div>

      {addModalOpen && (
        <CustomerCardModal
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSaved={() => {
            setAddModalOpen(false);
            showToast('تم إضافة العميل بنجاح', 'success');
            load(1);
          }}
        />
      )}

      {deleteTarget && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, width: 320, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 8 }}>حذف العميل</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              متأكد إنك عايز تحذف "{deleteTarget.name || 'العميل'}"؟ هيتحذف كل بياناته (زيارات، عقود صيانة، أجهزة).
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="tpl-cancel-btn" onClick={() => setDeleteTarget(null)}>إلغاء</button>
              <button className="resolve-confirm-btn" style={{ background: 'var(--danger)' }} onClick={confirmDelete}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
