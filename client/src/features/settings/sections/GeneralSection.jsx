import { useEffect, useState } from 'react';
import { companyApi } from '../services/settings.service';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import useTranslation from '../../../i18n/useTranslation';

function autoResolveLabel(days, t, lang) {
  if (!days) return t('settings.disabled');
  return lang === 'ar' ? `${days} يوم` : `${days} day${Number(days) === 1 ? '' : 's'}`;
}
function dayOptionLabel(d, lang) {
  return lang === 'ar' ? `${d} يوم` : `${d} day${d === 1 ? '' : 's'}`;
}

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function GeneralSection() {
  const { t, lang } = useTranslation();
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
      showToast(t('settings.accountNameMinLength'), 'error');
      return;
    }
    try {
      const data = await companyApi.updateSettings({
        name: trimmed,
        auto_resolve_days: autoResolveDays ? Number(autoResolveDays) : null,
      });
      setSettings(data);
      setEditing(false);
      showToast(t('settings.accountSettingsUpdated'), 'success');
    } catch (err) {
      console.error('[API] saveAccountSettings error:', err);
      showToast(err.response?.data?.error || t('settings.saveFailed'), 'error');
    }
  }

  if (!settings) {
    return (
      <div className="settings-content-section active" id="settings-sec-general">
        <div className="page-content">
          <div className="settings-top-row">
            <div>
              <h2>{t('settings.accountSettings')}</h2>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-content-section active" id="settings-sec-general">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>{t('settings.accountSettings')}</h2>
            <div className="settings-top-desc">{t('settings.accountSettingsDesc')}</div>
          </div>
          {canEdit && (
            <button className="page-btn" onClick={startOrSave}>
              {editing ? t('settings.saveChangesBtn') : t('settings.updateSettingsBtn')}
            </button>
          )}
        </div>
        <div className="settings-section">
          <h3>{t('settings.generalTitle')}</h3>
          <div className="setting-row">
            <div>
              <div className="setting-label">{t('settings.accountNameLabel')}</div>
              <div className="setting-desc">{t('settings.accountNameDesc')}</div>
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
              <div className="setting-label">{t('settings.siteLanguageLabel')}</div>
              <div className="setting-desc">{t('settings.siteLanguageDesc')}</div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'العربية (ar)' : 'English (en)'}</span>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">{t('settings.emailContinuityLabel')}</div>
              <div className="setting-desc">{t('settings.emailContinuityDesc')}</div>
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
              {t('settings.enabled')}
            </span>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">{t('settings.autoResolveLabel')}</div>
              <div className="setting-desc">{t('settings.autoResolveDesc')}</div>
            </div>
            {!editing ? (
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{autoResolveLabel(settings.auto_resolve_days, t, lang)}</span>
            ) : (
              <select
                className="iw-input"
                style={{ maxWidth: 180, width: 'auto' }}
                value={autoResolveDays}
                onChange={(e) => setAutoResolveDays(e.target.value)}
              >
                <option value="">{t('settings.disabled')}</option>
                {[1, 2, 3, 5, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {dayOptionLabel(d, lang)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">{t('settings.accountIdLabel')}</div>
              <div className="setting-desc">{t('settings.accountIdDesc')}</div>
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
