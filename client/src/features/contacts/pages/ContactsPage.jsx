import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, AlertTriangle, ShieldCheck, BadgeCheck, Package, MessageCircle, LayoutGrid, Crown, UserX, Layers } from 'lucide-react';
import { contactsApi } from '../services/contacts.service';
import Avatar from '../../../components/ui/Avatar';
import Pagination from '../../../components/ui/Pagination';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import useTranslation from '../../../i18n/useTranslation';
import CustomerCardModal from '../components/CustomerCardModal';
import { CONTACT_MODULES_LIST } from '../constants';

const PAGE_SIZE = 20;
const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

// نفس فكرة resolveContactsCategory الأصلية: تاب "عملاء مسجلين" له 4 سيكشنات
// فرعية (الكل / عقد ساري / عقد منتهي / بدون عقد)، وتاب "أرقام غير مسجلة"
// مالوش سيكشنات فرعية
function resolveCategory(activeTab, registeredSubTab) {
  if (activeTab === 'registered') return registeredSubTab === 'all' ? 'registered' : registeredSubTab;
  return activeTab;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('registered');
  const [registeredSubTab, setRegisteredSubTab] = useState('all');
  // فلتر بالموديول — بيتعرض بس تحت تاب "الكل" (عملاء مسجلين)
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ activeContract: 0, expiredContract: 0, noContract: 0, unregistered: 0 });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { t } = useTranslation();
  const canManage = isOwnerOrAdmin(user);
  const debounceRef = useRef(null);

  function load(targetPage) {
    setLoading(true);
    setFailed(false);
    contactsApi
      .listPaginated({
        page: targetPage,
        pageSize: PAGE_SIZE,
        q: search,
        category: resolveCategory(activeTab, registeredSubTab),
        module: activeTab === 'registered' && registeredSubTab === 'all' ? moduleFilter : undefined,
      })
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
  }, [search, activeTab, registeredSubTab, moduleFilter]);

  function switchTab(tab) {
    if (tab === activeTab) return;
    setModuleFilter('');
    setActiveTab(tab);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await contactsApi.remove(deleteTarget.id);
      showToast(t('contacts.deleteSuccess'), 'success');
      load(page);
    } catch (err) {
      console.error('[API] deleteContact error:', err);
      showToast(err.response?.data?.error || t('contacts.deleteFailed'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const emptyMsg = search
    ? t('common.noResults')
    : activeTab === 'registered'
      ? registeredSubTab === 'active_contract'
        ? t('contacts.noRegisteredCustomers')
        : registeredSubTab === 'expired_contract'
          ? t('contacts.noRegisteredCustomers')
          : registeredSubTab === 'no_contract'
            ? t('contacts.noRegisteredCustomers')
            : t('contacts.noRegisteredCustomers')
      : t('contacts.noUnregisteredNumbers');

  return (
    <div id="page-contacts" className="page">
      <div className="page-content">
        <div className="page-header">
          <h2>{t('contacts.pageTitle')}</h2>
          {canManage && (
            <button className="page-btn" onClick={() => setAddModalOpen(true)}>
              <Plus size={16} /> {t('contacts.addContact')}
            </button>
          )}
        </div>

        <div className="contacts-tabs" id="contacts-tabs">
          <button className={`contacts-tab${activeTab === 'registered' ? ' active' : ''}`} onClick={() => switchTab('registered')}>
            <BadgeCheck size={14} /> {t('contacts.registeredCustomers')}
            <span className="contacts-tab-count">
              {(counts.activeContract || 0) + (counts.expiredContract || 0) + (counts.noContract || 0)}
            </span>
          </button>
          <button className={`contacts-tab${activeTab === 'unregistered' ? ' active' : ''}`} onClick={() => switchTab('unregistered')}>
            <MessageCircle size={14} /> {t('contacts.unregisteredNumbers')}
            <span className="contacts-tab-count">{counts.unregistered || 0}</span>
          </button>
        </div>

        {activeTab === 'registered' && (
          <div className="contacts-subtabs" id="contacts-subtabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              className={`contacts-subtab${registeredSubTab === 'all' ? ' active' : ''}`}
              onClick={() => setRegisteredSubTab('all')}
            >
              <LayoutGrid size={13} /> {t('common.all')}
              <span className="contacts-tab-count">
                {(counts.activeContract || 0) + (counts.expiredContract || 0) + (counts.noContract || 0)}
              </span>
            </button>
            <button
              className={`contacts-subtab${registeredSubTab === 'active_contract' ? ' active' : ''}`}
              onClick={() => {
                setModuleFilter('');
                setRegisteredSubTab('active_contract');
              }}
            >
              <ShieldCheck size={13} /> {t('contacts.activeContract')}
              <span className="contacts-tab-count">{counts.activeContract || 0}</span>
            </button>
            <button
              className={`contacts-subtab${registeredSubTab === 'expired_contract' ? ' active' : ''}`}
              onClick={() => {
                setModuleFilter('');
                setRegisteredSubTab('expired_contract');
              }}
            >
              <AlertTriangle size={13} /> {t('contacts.expiredContract')}
              <span className="contacts-tab-count">{counts.expiredContract || 0}</span>
            </button>
            <button
              className={`contacts-subtab${registeredSubTab === 'no_contract' ? ' active' : ''}`}
              onClick={() => {
                setModuleFilter('');
                setRegisteredSubTab('no_contract');
              }}
            >
              <Package size={13} /> {t('contacts.noContract')}
              <span className="contacts-tab-count">{counts.noContract || 0}</span>
            </button>
          </div>
        )}

        {activeTab === 'registered' && registeredSubTab === 'all' && (
          <div style={{ maxWidth: 320, marginBottom: 16 }}>
            <div className="cl-search-wrap">
              <Layers size={16} className="cl-search-icon" />
              <select
                className="cl-search"
                style={{ cursor: 'pointer' }}
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="">{t('contacts.moduleFilterAll')}</option>
                {CONTACT_MODULES_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ maxWidth: 500, marginBottom: 24 }}>
          <div className="cl-search-wrap">
            <Search size={16} className="cl-search-icon" />
            <input
              type="text"
              className="cl-search"
              placeholder={t('contacts.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-grid" id="contacts-grid">
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13, gridColumn: '1/-1' }}>
              {t('common.loading')}
            </div>
          )}
          {!loading && failed && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13, gridColumn: '1/-1' }}>
              {t('contacts.loadFailed')}
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
                      title={t('contacts.deleteCustomerTitle')}
                      aria-label={t('contacts.deleteCustomerAria')}
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
                    <div className="contact-card-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {c.name || t('contacts.noName')}
                      {c.is_vip === 1 && (
                        <span className="label-chip" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', fontSize: 10.5, padding: '2px 6px' }}>
                          <Crown size={10} style={{ verticalAlign: -1 }} /> {t('chats.vipBadge')}
                        </span>
                      )}
                      {c.is_inactive === 1 && (
                        <span className="label-chip" style={{ background: 'rgba(148,163,184,0.18)', color: 'var(--text-secondary)', fontSize: 10.5, padding: '2px 6px' }}>
                          <UserX size={10} style={{ verticalAlign: -1 }} /> {t('contacts.inactiveBadge')}
                        </span>
                      )}
                    </div>
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
                        {isExpired ? t('contacts.contractExpiredBadge') : t('contacts.contractActiveBadge')}
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
            showToast(t('contacts.addSuccess'), 'success');
            load(1);
          }}
        />
      )}

      {deleteTarget && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, width: 320, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 8 }}>{t('contacts.deleteCustomerTitle')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              {t('contacts.deleteConfirmBodyPrefix')} "{deleteTarget.name || t('contacts.theCustomer')}"{t('contacts.deleteConfirmBodySuffix')}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="tpl-cancel-btn" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
              <button className="resolve-confirm-btn" style={{ background: 'var(--danger)' }} onClick={confirmDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
