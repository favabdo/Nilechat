import { useEffect, useState } from 'react';
import { Camera, Upload, Lock, Eye, EyeOff, Copy, X } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import { roleLabel } from '../../../utils/roles';
import { meApi } from '../services/profile.service';
import EditableFieldRow from '../components/EditableFieldRow';
import NotifPrefsTable from '../components/NotifPrefsTable';

function getPushButtonState() {
  if (typeof window === 'undefined' || !('Notification' in window)) return { text: 'Not supported', disabled: true };
  if (Notification.permission === 'granted') return { text: 'Enabled ✓', disabled: true };
  if (Notification.permission === 'denied') return { text: 'Blocked by browser', disabled: true };
  return { text: 'Enable', disabled: false };
}

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [tokenVisible, setTokenVisible] = useState(false);
  const [pushState, setPushState] = useState(getPushButtonState());
  const [notifPrefs, setNotifPrefs] = useState({});

  useEffect(() => {
    meApi
      .get()
      .then((data) => setAuth(token, { ...user, ...data }))
      .catch((err) => console.error('[API] refreshCurrentUser error:', err));
    meApi
      .getNotificationPrefs()
      .then((prefs) => setNotifPrefs(prefs || {}))
      .catch((err) => console.error('[API] getNotificationPrefs error:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchUser(patch) {
    setAuth(token, { ...user, ...patch });
  }

  async function saveField(field, value) {
    const trimmed = (value || '').trim();
    if (field === 'display_name' && trimmed.length < 2) {
      showToast('الاسم قصير جدًا', 'error');
      return false;
    }
    if (field === 'email' && !trimmed) {
      showToast('اكتب إيميل صحيح', 'error');
      return false;
    }
    try {
      const data = await meApi.update({ [field]: trimmed });
      patchUser({ [field]: data.user[field] });
      showToast('تم التحديث بنجاح', 'success');
      return true;
    } catch (err) {
      console.error('[API] submitProfileFieldChange error:', err);
      showToast(err.response?.data?.error || 'فشل التحديث', 'error');
      return false;
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('اختار صورة صحيحة', 'error');
    if (file.size > 5 * 1024 * 1024) return showToast('حجم الصورة أكبر من 5 ميجا', 'error');
    try {
      const data = await meApi.uploadAvatar(file);
      patchUser({ avatar_url: data.avatar_url });
      showToast('تم تحديث صورة البروفايل بنجاح', 'success');
    } catch (err) {
      console.error('[API] handleProfileAvatarSelected error:', err);
      showToast(err.response?.data?.error || 'فشل رفع الصورة', 'error');
    }
  }

  async function handleAvatarRemove() {
    if (!user.avatar_url) return showToast('مفيش صورة بروفايل أصلاً', 'info');
    try {
      await meApi.removeAvatar();
      patchUser({ avatar_url: null });
      showToast('تم حذف صورة البروفايل', 'success');
    } catch (err) {
      console.error('[API] removeProfileAvatar error:', err);
      showToast(err.response?.data?.error || 'فشل حذف الصورة', 'error');
    }
  }

  async function submitPasswordChange() {
    if (!pwCurrent || !pwNew || !pwConfirm) return showToast('املأ كل خانات كلمة السر', 'error');
    if (pwNew.length < 6) return showToast('كلمة السر الجديدة لازم تكون 6 حروف على الأقل', 'error');
    if (pwNew !== pwConfirm) return showToast('كلمة السر الجديدة والتأكيد مش متطابقين', 'error');

    try {
      await meApi.changePassword(pwCurrent, pwNew);
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      showToast('تم تحديث كلمة السر بنجاح', 'success');
    } catch (err) {
      console.error('[API] submitPasswordChange error:', err);
      showToast(err.response?.data?.error || 'فشل تحديث كلمة السر', 'error');
    }
  }

  async function toggleNotifPref(key, channel, checked) {
    const prevPrefs = notifPrefs;
    const nextPrefs = { ...prevPrefs, [key]: { ...(prevPrefs[key] || {}), [channel]: checked } };
    setNotifPrefs(nextPrefs);
    try {
      const saved = await meApi.updateNotifPrefs(nextPrefs);
      setNotifPrefs(saved);
    } catch (err) {
      console.error('[API] toggleNotifPref error:', err);
      showToast(err.response?.data?.error || 'فشل حفظ تفضيلات الإشعارات', 'error');
      setNotifPrefs(prevPrefs);
    }
  }

  async function requestPushPermission() {
    if (!('Notification' in window)) return showToast('المتصفح ده مش بيدعم الإشعارات', 'error');
    try {
      const perm = await Notification.requestPermission();
      setPushState(getPushButtonState());
      if (perm === 'granted') {
        showToast('تم تفعيل إشعارات المتصفح', 'success');
        new Notification('NileChat', { body: 'هتوصلك إشعارات هنا أول ما رسالة جديدة توصل 🎉' });
      } else {
        showToast('مسموحش بالإشعارات — ممكن تفعّلها من إعدادات المتصفح', 'error');
      }
    } catch (err) {
      console.error('[Push] requestPushPermission error:', err);
    }
  }

  async function regenerateAccessToken() {
    if (user?.access_token && !window.confirm('التوكن الحالي هيتلغي فورًا ومش هيشتغل تاني — متأكد؟')) return;
    try {
      const data = await meApi.regenerateToken();
      patchUser({ access_token: data.access_token });
      setTokenVisible(true);
      showToast('تم توليد توكن جديد', 'success');
    } catch (err) {
      console.error('[API] regenerateAccessToken error:', err);
      showToast(err.response?.data?.error || 'فشل توليد التوكن', 'error');
    }
  }

  function copyAccessToken() {
    if (!user?.access_token) return showToast('اعمل Regenerate الأول عشان تولّد توكن', 'error');
    navigator.clipboard
      .writeText(user.access_token)
      .then(() => showToast('تم نسخ التوكن', 'success'))
      .catch(() => showToast('فشل النسخ', 'error'));
  }

  if (!user) return null;
  const displayName = user.display_name || user.email;
  const tokenFieldValue =
    tokenVisible && user.access_token
      ? user.access_token
      : user.access_token
        ? '•'.repeat(28)
        : 'No token generated yet — click Regenerate';

  return (
    <div id="page-profile" className="page">
      <div
        className="page-content"
        style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px', overflowY: 'auto', width: '100%' }}
      >
        <div className="settings-top-row">
          <div>
            <h2>Profile Settings</h2>
            <div className="settings-top-desc">Your personal account details</div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Profile Picture</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 4 }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              title="Change profile picture"
              aria-label="Change profile picture"
              onClick={() => document.getElementById('profile-avatar-input').click()}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid var(--primary-light)',
                }}
              >
                <Avatar name={displayName} seed={`agent-${user.id}`} size={64} imageSrc={user.avatar_url || null} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--surface)',
                }}
              >
                <Camera size={12} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{displayName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  className="st-icon-btn"
                  style={{
                    width: 'auto',
                    padding: '4px 10px',
                    gap: 6,
                    display: 'inline-flex',
                    background: 'var(--bg)',
                    fontSize: 12,
                  }}
                  onClick={() => document.getElementById('profile-avatar-input').click()}
                >
                  <Upload size={13} /> Upload photo
                </button>
                {user.avatar_url && (
                  <button
                    className="st-icon-btn"
                    style={{
                      width: 'auto',
                      padding: '4px 10px',
                      gap: 6,
                      display: 'inline-flex',
                      background: 'var(--bg)',
                      fontSize: 12,
                    }}
                    title="Remove photo"
                    aria-label="Remove photo"
                    onClick={handleAvatarRemove}
                  >
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>JPG, PNG, GIF or WEBP. Max 5MB.</div>
            </div>
            <input
              type="file"
              id="profile-avatar-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Personal Information</h3>
          <EditableFieldRow
            label="Full Name"
            desc="Your legal / full name"
            value={user.full_name}
            placeholder="Add your full name"
            onSave={(v) => saveField('full_name', v)}
          />
          <EditableFieldRow
            label="Display Name"
            desc="Visible to customers instead of your email"
            value={displayName}
            onSave={(v) => saveField('display_name', v)}
          />
          <EditableFieldRow
            label="Email Address"
            desc="Used to sign in to your account"
            value={user.email}
            type="email"
            onSave={(v) => saveField('email', v)}
          />
          <div className="setting-row">
            <div>
              <div className="setting-label">Role</div>
              <div className="setting-desc">Your permission level</div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>{roleLabel(user.role)}</span>
          </div>
        </div>

        <div className="settings-section">
          <h3>Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              className="st-text-input"
              placeholder="Current password"
              autoComplete="current-password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
            <input
              type="password"
              className="st-text-input"
              placeholder="New password"
              autoComplete="new-password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
            />
            <input
              type="password"
              className="st-text-input"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
            />
            <button className="page-btn" style={{ alignSelf: 'flex-start' }} onClick={submitPasswordChange}>
              <Lock size={14} /> Update Password
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notification Preferences</h3>
          <div className="setting-row" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="setting-label">Enable Browser Push Notifications</div>
              <div className="setting-desc">Allow this browser to show desktop notifications</div>
            </div>
            <button
              className="page-btn"
              style={{ padding: '8px 14px' }}
              disabled={pushState.disabled}
              onClick={requestPushPermission}
            >
              {pushState.text}
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <NotifPrefsTable prefs={notifPrefs} onToggle={toggleNotifPref} />
          </div>
        </div>

        <div className="settings-section">
          <h3>Access Token</h3>
          <div className="setting-desc" style={{ marginBottom: 12 }}>
            This token can be used if you are building an API based integration
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="st-text-input"
              style={{ flex: 1, minWidth: 220, fontFamily: 'monospace' }}
              readOnly
              value={tokenFieldValue}
            />
            <button
              className="st-icon-btn"
              style={{ background: 'var(--bg)' }}
              title="Show/Hide"
              aria-label="Show/Hide"
              onClick={() =>
                user.access_token ? setTokenVisible((v) => !v) : showToast('اعمل Regenerate الأول عشان تولّد توكن', 'error')
              }
            >
              {tokenVisible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              className="st-icon-btn"
              style={{ background: 'var(--bg)' }}
              title="Copy"
              aria-label="Copy"
              onClick={copyAccessToken}
            >
              <Copy size={15} />
            </button>
            <button className="page-btn" style={{ background: 'var(--danger)' }} onClick={regenerateAccessToken}>
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
