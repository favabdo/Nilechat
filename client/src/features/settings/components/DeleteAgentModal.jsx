import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { agentsSettingsApi } from '../services/settings.service';
import Modal from '../../../components/ui/Modal';

export default function DeleteAgentModal({ agent, onClose, onDeleted }) {
  const { t } = useTranslation('settings');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError('');
    if (!password) {
      setError(t('deleteAgentModal.passwordRequired'));
      return;
    }
    setSaving(true);
    try {
      await agentsSettingsApi.remove(agent.id, password);
      onDeleted(agent.id);
    } catch (err) {
      console.error('[API] submitDeleteAgent error:', err);
      setError(err.response?.data?.error || t('deleteAgentModal.deleteFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}>
          <Trash2 size={22} />
        </div>
        <div className="resolve-modal-title">{t('deleteAgentModal.title')}</div>
      </div>
      <div className="resolve-modal-sub">
        {t('deleteAgentModal.subtitle', { email: agent.email })}
      </div>

      <div className="resolve-cats-label">{t('deleteAgentModal.passwordLabel')}</div>
      <input
        type="password"
        className="iw-input"
        placeholder="••••••••"
        style={{ marginBottom: 6 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          {t('deleteAgentModal.cancel')}
        </button>
        <button className="resolve-confirm-btn" style={{ background: 'var(--danger)' }} disabled={saving} onClick={submit}>
          <Trash2 size={16} /> {saving ? t('deleteAgentModal.deleting') : t('deleteAgentModal.confirmDelete')}
        </button>
      </div>
      {error && (
        <div className="login-error" style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
