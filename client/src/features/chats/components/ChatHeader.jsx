import { ArrowLeft, Search, CheckCircle, RotateCcw, User, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import useTranslation from '../../../i18n/useTranslation';

export default function ChatHeader({
  conversation,
  typingNames,
  onBack,
  onToggleSearch,
  searchOpen,
  searchQuery,
  onSearchChange,
  matchCount,
  matchIndex,
  onNextMatch,
  onPrevMatch,
  onResolveClick,
  onCustomerPanelToggle,
}) {
  const { t } = useTranslation();
  const c = conversation;
  const statusText =
    typingNames.length > 0
      ? typingNames.length === 1
        ? `${typingNames[0]} ${t('chats.typingOne')}`
        : `${typingNames.join(', ')} ${t('chats.typingMany')}`
      : c.status === 'open'
        ? t('chats.online')
        : c.status === 'pending'
          ? t('chats.pending')
          : t('chats.resolvedStatus');
  const statusColor =
    typingNames.length > 0
      ? 'var(--primary)'
      : c.status === 'open'
        ? 'var(--success)'
        : c.status === 'pending'
          ? 'var(--warning)'
          : 'var(--text-secondary)';

  const activeLabel = c.labels && c.labels.length > 0 ? c.labels[0] : null;

  // لو العميل ده كارت "عميل صيانة" (له maintenanceEndDate) وعقد الصيانة بتاعه
  // عدى معاده، بنوري شريط تحذير أحمر فوق الشات عشان الإيجنت ياخد باله ومايكملش
  // معاه عادي من غير ما يعرف إن العقد منتهي (نفس منطق applyMaintenanceBanner
  // في النسخة القديمة قبل React، اللي وقع سهوًا وقت النقل)
  let maintenanceBannerText = null;
  if (c.maintenanceEndDate) {
    const endDate = new Date(c.maintenanceEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - endDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      const endDateStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      maintenanceBannerText = t('chats.maintenanceExpiredBanner', { days: diffDays, date: endDateStr });
    }
  }

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="mobile-back-btn" title={t('chats.backToAllChats')} aria-label={t('chats.backToAllChats')} onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <Avatar name={c.name} seed={c.avatar} size={40} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="chat-header-name">{c.name}</div>
            <div className="chat-header-status" style={{ color: statusColor }}>
              {statusText}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="ch-action-btn" title={t('chats.searchInChat')} aria-label={t('chats.searchInChat')} onClick={onToggleSearch}>
            <Search size={18} />
          </button>
          <button
            className={`resolve-btn${c.status === 'resolved' ? ' resolved-state' : ''}`}
            title={c.status === 'resolved' ? t('chats.reopenConversation') : t('chats.resolveConversation')}
            onClick={onResolveClick}
          >
            {c.status === 'resolved' ? <RotateCcw size={15} /> : <CheckCircle size={15} />}
            <span>{c.status === 'resolved' ? t('chats.reopen') : t('chats.resolve')}</span>
          </button>
          <button className="ch-action-btn" title={t('chats.customerInfo')} aria-label={t('chats.customerInfo')} onClick={onCustomerPanelToggle}>
            <User size={18} />
          </button>
        </div>
      </div>

      {activeLabel && activeLabel.description && (
        <div className="chat-header-labels show" style={{ borderRightColor: activeLabel.color || '#6C5CE7' }}>
          <span className="chlbl-dot" style={{ background: activeLabel.color || '#6C5CE7' }}></span>
          <span className="chlbl-name">{activeLabel.name}:</span>
          <span className="chlbl-desc">{activeLabel.description}</span>
        </div>
      )}

      {maintenanceBannerText && (
        <div className="chat-maintenance-banner show">
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{maintenanceBannerText}</span>
        </div>
      )}

      <div className={`chat-search-bar${searchOpen ? ' show' : ''}`}>
        <Search size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          id="chat-search-input"
          type="text"
          placeholder={t('chats.searchInMessages')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) onPrevMatch();
              else onNextMatch();
            } else if (e.key === 'Escape') {
              onToggleSearch();
            }
          }}
        />
        <span className="chat-search-counter">{matchCount ? `${matchIndex + 1}/${matchCount}` : searchQuery ? '0/0' : ''}</span>
        <button className="ch-action-btn" title={t('chats.previous')} aria-label={t('chats.previous')} onClick={onPrevMatch}>
          <ChevronUp size={16} />
        </button>
        <button className="ch-action-btn" title={t('chats.next')} aria-label={t('chats.next')} onClick={onNextMatch}>
          <ChevronDown size={16} />
        </button>
        <button className="ch-action-btn" title={t('chats.close')} aria-label={t('chats.close')} onClick={onToggleSearch}>
          <X size={16} />
        </button>
      </div>
    </>
  );
}
