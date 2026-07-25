import { NavLink, useNavigate } from 'react-router-dom';
import { MessageCircle, Bot, User, LayoutGrid, ChartBar, CalendarClock, Settings, LogOut, Bell, Languages } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationsStore from '../../features/notifications/store/notificationsStore';
import useTranslation from '../../i18n/useTranslation';
import Avatar from '../ui/Avatar';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard/chats', icon: MessageCircle, titleKey: 'sidebar.chats', badgeKey: 'chats' },
  { to: '/dashboard/ai', icon: Bot, titleKey: 'sidebar.aiAssistant' },
  { to: '/dashboard/contacts', icon: User, titleKey: 'sidebar.contacts' },
  { to: '/dashboard/templates', icon: LayoutGrid, titleKey: 'sidebar.templates' },
  { to: '/dashboard/analytics', icon: ChartBar, titleKey: 'sidebar.analytics' },
  { to: '/dashboard/scheduled-tasks', icon: CalendarClock, titleKey: 'sidebar.scheduledTasks', badgeKey: 'sched' },
  { to: '/dashboard/settings', icon: Settings, titleKey: 'sidebar.settings' },
];

export default function Sidebar({ openChatsCount = 0, dueTasksCount = 0 }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, openPanel } = useNotificationsStore();
  const { t, lang, toggleLang } = useTranslation();

  const badgeCounts = { chats: openChatsCount, sched: dueTasksCount };

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside id="sidebar">
      <img src="/assets/logo-icon.png" alt="NileChat" className="sidebar-logo" />
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, titleKey, badgeKey }) => {
          const count = badgeKey ? badgeCounts[badgeKey] : 0;
          const title = t(titleKey);
          return (
            <NavLink
              key={to}
              to={to}
              title={title}
              aria-label={title}
              className={({ isActive }) => `sidebar-btn${isActive ? ' active' : ''}`}
            >
              <Icon size={22} />
              {badgeKey && (
                <span className="badge" style={{ display: count > 0 ? 'flex' : 'none' }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <button
          className="sidebar-btn"
          title={lang === 'ar' ? t('language.toggleToEnglish') : t('language.toggleToArabic')}
          aria-label={lang === 'ar' ? t('language.toggleToEnglish') : t('language.toggleToArabic')}
          onClick={toggleLang}
          style={{ position: 'relative' }}
        >
          <Languages size={20} />
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              insetInlineEnd: -2,
              fontSize: 9,
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 6,
              padding: '0 3px',
              lineHeight: '13px',
            }}
          >
            {t('language.short')}
          </span>
        </button>
        <button className="sidebar-btn" title={t('sidebar.logout')} aria-label={t('sidebar.logout')} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
        <button
          className="sidebar-btn"
          id="notifications-btn"
          title={t('sidebar.notifications')}
          aria-label={t('sidebar.notifications')}
          onClick={openPanel}
        >
          <Bell size={20} />
          <span className="badge" style={{ display: unreadCount > 0 ? 'flex' : 'none' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </button>
        <div
          className="sidebar-avatar"
          id="my-avatar"
          title={user?.display_name || user?.email || t('sidebar.myProfile')}
          onClick={() => navigate('/dashboard/profile')}
        >
          <Avatar
            name={user?.display_name || user?.email}
            seed={`agent-${user?.id || ''}`}
            size={36}
            imageSrc={user?.avatar_url || null}
          />
        </div>
      </div>
    </aside>
  );
}
