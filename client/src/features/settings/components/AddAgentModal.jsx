import { useState } from 'react';
import { UserPlus, Send } from 'lucide-react';
import { agentsSettingsApi } from '../services/settings.service';
import useToastStore from '../../../store/toastStore';
import Modal from '../../../components/ui/Modal';
import useTranslation from '../../../i18n/useTranslation';

export default function AddAgentModal({ onClose, onAdded }) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('2');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return showToast(t('settings.agentEmailRequired'), 'error');

    setSaving(true);
    try {
      const data = await agentsSettingsApi.create({ email: trimmedEmail, role: Number(role) });
      if (name.trim() && data.user?.id) {
        try {
          await agentsSettingsApi.update(data.user.id, { display_name: name.trim() });
        } catch (nameErr) {
          console.error('[API] set new agent display_name error:', nameErr);
        }
      }
      if (data.email_sent) {
        showToast(t('settings.inviteEmailSentSuccess'), 'success');
      } else {
        showToast(t('settings.inviteEmailFailedButAdded'), 'error');
      }
      onAdded(data);
    } catch (err) {
      console.error('[API] submitAddAgent error:', err);
      showToast(err.response?.data?.error || t('settings.addAgentFailed'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>
          <UserPlus size={22} />
        </div>
        <div className="resolve-modal-title">{t('settings.addAgentTitle')}</div>
      </div>
      <div className="resolve-modal-sub">{t('settings.addAgentSub')}</div>

      <div className="resolve-cats-label">{t('settings.nameOptional')}</div>
      <input
        type="text"
        className="iw-input"
        placeholder={t('settings.displayNamePlaceholder')}
        style={{ marginBottom: 14 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="resolve-cats-label">{t('settings.email')}</div>
      <input
        type="email"
        className="iw-input"
        placeholder="agent@example.com"
        style={{ marginBottom: 14 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="resolve-cats-label">{t('settings.role')}</div>
      <select className="iw-input" style={{ marginBottom: 6 }} value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="2">{t('settings.roleAgent')}</option>
        <option value="1">{t('settings.roleAdmin')}</option>
        <option value="0">{t('settings.roleOwner')}</option>
      </select>

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="resolve-confirm-btn" disabled={saving} onClick={submit}>
          <Send size={16} /> {saving ? t('settings.sendingEllipsis') : t('settings.sendInvite')}
        </button>
      </div>
    </Modal>
  );
}
