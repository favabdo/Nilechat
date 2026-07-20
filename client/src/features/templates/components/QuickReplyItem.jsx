import { useState } from 'react';
import { GripVertical, MessageSquare, Edit2, Trash2, Check } from 'lucide-react';

export default function QuickReplyItem({ r, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(r.label);
  const [text, setText] = useState(r.text);

  function startEdit() {
    setLabel(r.label);
    setText(r.text);
    setEditing(true);
  }

  async function save() {
    if (!label.trim()) return;
    if (!text.trim()) return;
    await onSave(r.id, label.trim(), text.trim());
    setEditing(false);
  }

  return (
    <div id={`qr-item-${r.id}`} data-drag-id={r.id} className="qr-item">
      <div className="qr-item-header">
        <div title="اسحب لترتيب الردود" aria-label="اسحب لترتيب الردود" className="qr-drag-handle" data-drag-handle>
          <GripVertical size={15} />
        </div>
        <div className="qr-icon-box">
          <MessageSquare size={15} color="var(--primary)" />
        </div>
        <div className="qr-label-badge">{r.label}</div>
        <div className="qr-actions">
          <button onClick={startEdit} title="تعديل" aria-label="تعديل" className="qr-icon-action">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(r.id)} title="حذف" aria-label="حذف" className="qr-icon-action danger">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!editing ? (
        <div>
          <div className="qr-item-text">{r.text}</div>
        </div>
      ) : (
        <div className="qr-edit-box" style={{ display: 'block' }}>
          <label className="tpl-field-label">اسم الزرار (Label)</label>
          <input className="tpl-input" value={label} onChange={(e) => setLabel(e.target.value)} />
          <label className="tpl-field-label">نص الرد</label>
          <textarea className="tpl-textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="tpl-save-btn" onClick={save}>
              <Check size={12} /> حفظ
            </button>
            <button className="tpl-cancel-btn" onClick={() => setEditing(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
