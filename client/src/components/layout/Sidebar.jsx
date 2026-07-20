import { NavLink, useNavigate } from 'react-router-dom';
import { MessageCircle, Bot, User, LayoutGrid, ChartBar, CalendarClock, Settings, LogOut, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationsStore from '../../features/notifications/store/notificationsStore';
import Avatar from '../ui/Avatar';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard/chats', icon: MessageCircle, title: 'Chats', badgeKey: 'chats' },
  { to: '/dashboard/ai', icon: Bot, title: 'AI Assistant' },
  { to: '/dashboard/contacts', icon: User, title: 'Contacts' },
  { to: '/dashboard/templates', icon: LayoutGrid, title: 'Templates' },
  { to: '/dashboard/analytics', icon: ChartBar, title: 'Analytics' },
  { to: '/dashboard/scheduled-tasks', icon: CalendarClock, title: 'Scheduled Tasks', badgeKey: 'sched' },
  { to: '/dashboard/settings', icon: Settings, title: 'Settings' },
];

export default function Sidebar({ openChatsCount = 0, dueTasksCount = 0 }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, openPanel } = useNotificationsStore();

  const badgeCounts = { chats: openChatsCount, sched: dueTasksCount };

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside id="sidebar">
      <img src="/assets/logo-icon.png" alt="NileChat" className="sidebar-logo" />
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, title, badgeKey }) => {
          const count = badgeKey ? badgeCounts[badgeKey] : 0;
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
        <button className="sidebar-btn" title="تسجيل الخروج" aria-label="تسجيل الخروج" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
        <button
          className="sidebar-btn"
          id="notifications-btn"
          title="Notifications"
          aria-label="Notifications"
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
          title={user?.display_name || user?.email || 'My Profile'}
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
