import { Bell, BellOff, MessageCirclePlus, UserCheck, AtSign, Inbox, MessagesSquare, LogIn, Activity, CheckCheck } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import useNotificationsStore from '../store/notificationsStore';
import useToastStore from '../../../store/toastStore';

const NOTIFICATION_TYPE_ICONS = {
  conversation_created: MessageCirclePlus,
  conversation_assigned: UserCheck,
  conversation_mention: AtSign,
  assigned_conversation_message: Inbox,
  participating_conversation_message: MessagesSquare,
  login: LogIn,
  activity: Activity,
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `من ${days} يوم`;
}

export default function NotificationsPanel({ onClose }) {
  const { notifications, toggleRead, markAllRead } = useNotificationsStore();
  const showToast = useToastStore((s) => s.showToast);

  async function handleToggle(n) {
    try {
      await toggleRead(n.id, n.status);
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل تحديث الإشعار', 'error');
    }
  }

  async function handleMarkAll() {
    try {
      await markAllRead();
      showToast('تم تعليم كل الإشعارات كمقروءة', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل تعليم الكل كمقروء', 'error');
    }
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="notifications-modal-title"
      className="resolve-modal notifications-modal"
      style={{ padding: 0, width: 400, maxHeight: 'min(600px, calc(100vh - 48px))', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div id="notifications-modal-title" style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={17} /> Notifications
        </div>
        {notifications.some((n) => n.status === 1) && (
          <button className="st-icon-btn" title="Mark all as read" aria-label="Mark all as read" onClick={handleMarkAll}>
            <CheckCheck size={15} />
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 460 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BellOff size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div>لسه مفيش أي إشعارات</div>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = n.status === 1;
            const Icon = NOTIFICATION_TYPE_ICONS[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`notification-item${isUnread ? ' unread' : ''}`}
                onClick={() => handleToggle(n)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: isUnread ? 'var(--primary-light)' : undefined,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(108,92,231,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                  <Icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: isUnread ? 700 : 600, fontSize: 13.5, color: 'var(--text)' }}>{n.title || ''}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{n.message || ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{timeAgo(n.created_at)}</div>
                </div>
                {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
