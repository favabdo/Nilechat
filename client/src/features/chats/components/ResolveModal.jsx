import { useState } from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import useToastStore from '../../../store/toastStore';
import { conversationsApi } from '../services/chats.service';
import Modal from '../../../components/ui/Modal';

export default function ResolveModal({ conversation, categories, onClose, onResolved }) {
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
      showToast(`✅ تم حفظ الحل فعليًا: ${catName}`, 'success');
    } catch (err) {
      console.error('[API] confirmResolve error:', err);
      showToast(err.response?.data?.error || 'فشل حفظ الحل — حاول تاني', 'error');
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
        <div className="resolve-modal-title">Resolve Conversation</div>
      </div>
      <div className="resolve-modal-sub">اختار تصنيف المحادثة قبل ما تعملها resolve</div>

      <div className="resolve-cats-label">تصنيف المشكلة</div>
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

      <div className="resolve-notes-label">ملاحظة (اختياري)</div>
      <textarea
        className="resolve-notes"
        placeholder="اكتب ملخص للمشكلة اللي اتحلت..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="resolve-modal-actions">
        <button className="resolve-cancel-btn" onClick={onClose}>
          إلغاء
        </button>
        <button className="resolve-confirm-btn" disabled={!selectedCategory || saving} onClick={confirm}>
          <Check size={16} />
          {saving ? 'جارِ الحفظ...' : 'تأكيد الـ Resolve'}
        </button>
      </div>
    </Modal>
  );
}
