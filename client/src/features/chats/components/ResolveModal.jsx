import { useState } from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import useToastStore from '../../../store/toastStore';
import { conversationsApi } from '../services/chats.service';
import Modal from '../../../components/ui/Modal';
import useTranslation from '../../../i18n/useTranslation';

export default function ResolveModal({ conversation, categories, onClose, onResolved }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  async function confirm() {
    if (!selectedCategory) return;
    const cat = categories.find((x) => String(x.id) === String(selectedCategory));
    const catName = cat ? cat.name : selectedCategory;
    setSaving(true);
    try {
      await conversationsApi.resolve(conversation.id, catName, notes.trim());
      onResolved(catName);
      showToast(t('chats.resolveSuccessToast', { category: catName }), 'success');
    } catch (err) {
      console.error('[API] confirmResolve error:', err);
      showToast(err.response?.data?.error || t('chats.resolveFailedToast'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="resolve-modal-header">
        <div className="resolve-modal-icon">
          <CheckCircle2 size={22} />
        </div>
        <div className="resolve-modal-title">{t('chats.resolveModalTitle')}</div>
      </div>
      <div className="resolve-modal-sub">{t('chats.resolveModalSub')}</div>

      <div className="resolve-cats-label">{t('chats.resolveCategoryLabel')}</div>
      <div className="resolve-cats-grid">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`resolve-cat-card${String(selectedCategory) === String(cat.id) ? ' selected' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon && <span style={{ fontSize: 18 }}>{cat.icon}</span>}
            <div style={{ fontWeight: 700, fontSize: 13 }}>{cat.name}</div>
            {cat.desc && <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{cat.desc}</div>}
          </div>
        ))}
      </div>

      <div className="resolve-notes-label">{t('chats.resolveNotesLabel')}</div>
      <textarea
        className="resolve-notes"
        placeholder={t('chats.resolveNotesPlaceholder')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="resolve-confirm-btn" disabled={!selectedCategory || saving} onClick={confirm}>
          <Check size={16} />
          {saving ? t('common.saving') : t('chats.resolveConfirmBtn')}
        </button>
      </div>
    </Modal>
  );
}
