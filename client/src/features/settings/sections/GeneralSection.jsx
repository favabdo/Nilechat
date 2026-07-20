import { useEffect, useState } from 'react';
import { companyApi } from '../services/settings.service';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';

function autoResolveLabel(days) {
  if (!days) return 'Disabled';
  return `${days} day${Number(days) === 1 ? '' : 's'}`;
}

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function GeneralSection() {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [autoResolveDays, setAutoResolveDays] = useState('');
  const canEdit = isOwnerOrAdmin(user);

  useEffect(() => {
    companyApi
      .getSettings()
      .then((data) => {
        setSettings(data);
        setName(data.name || '');
        setAutoResolveDays(data.auto_resolve_days ? String(data.auto_resolve_days) : '');
      })
      .catch((err) => console.error('[API] loadAccountSettings error:', err));
  }, []);

  function startOrSave() {
    if (!canEdit) return;
    if (!editing) {
      setEditing(true);
      return;
    }
    save();
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast('اسم الحساب لازم يكون حرفين على الأقل', 'error');
      return;
    }
    try {
      const data = await companyApi.updateSettings({
        name: trimmed,
        auto_resolve_days: autoResolveDays ? Number(autoResolveDays) : null,
      });
      setSettings(data);
      setEditing(false);
      showToast('تم تحديث إعدادات الحساب بنجاح', 'success');
    } catch (err) {
      console.error('[API] saveAccountSettings error:', err);
      showToast(err.response?.data?.error || 'فشل الحفظ', 'error');
    }
  }

  if (!settings) {
    return (
      <div className="settings-content-section active" id="settings-sec-general">
        <div className="page-content">
          <div className="settings-top-row">
            <div>
              <h2>Account Settings</h2>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>جارِ التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-content-section active" id="settings-sec-general">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>Account Settings</h2>
            <div className="settings-top-desc">General settings for your organization</div>
          </div>
          {canEdit && (
            <button className="page-btn" onClick={startOrSave}>
              {editing ? 'Save Changes' : 'Update Settings'}
            </button>
          )}
        </div>
        <div className="settings-section">
          <h3>General</h3>
          <div className="setting-row">
            <div>
              <div className="setting-label">Account Name</div>
              <div className="setting-desc">The name of your account</div>
            </div>
            {!editing ? (
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{settings.name}</span>
            ) : (
              <input
                type="text"
                className="iw-input"
                style={{ maxWidth: 260, width: 'auto' }}
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Site Language</div>
              <div className="setting-desc">Used for the dashboard and conversations</div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>English (en)</span>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Email Conversation Continuity</div>
              <div className="setting-desc">Conversation continuity with emails is enabled for your account.</div>
            </div>
            <span
              style={{
                fontSize: 13,
                color: 'var(--success)',
                fontWeight: 600,
                background: 'rgba(16,185,129,0.1)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              Enabled
            </span>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Auto Resolve After Inactivity</div>
              <div className="setting-desc">Number of days after a ticket should auto resolve if there is no activity</div>
            </div>
            {!editing ? (
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{autoResolveLabel(settings.auto_resolve_days)}</span>
            ) : (
              <select
                className="iw-input"
                style={{ maxWidth: 180, width: 'auto' }}
                value={autoResolveDays}
                onChange={(e) => setAutoResolveDays(e.target.value)}
              >
                <option value="">Disabled</option>
                {[1, 2, 3, 5, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Account ID</div>
              <div className="setting-desc">This ID is required if you are building an API based integration</div>
            </div>
            <span
              style={{
                fontSize: 13,
                color: 'var(--primary)',
                fontWeight: 600,
                background: 'rgba(108,92,231,0.08)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              #{settings.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
