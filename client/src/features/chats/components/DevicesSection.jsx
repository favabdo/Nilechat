import { useEffect, useState } from 'react';
import { Monitor, Hash, Lock, Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import { devicesApi } from '../../contacts/services/contacts.service';
import useToastStore from '../../../store/toastStore';
import useTranslation from '../../../i18n/useTranslation';

function DeviceEditForm({ device, onCancel, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState(device.name);
  const [anydesk, setAnydesk] = useState(device.anydesk || '');
  const [pw, setPw] = useState(device.password || '');
  return (
    <div className="device-card">
      <input className="device-edit-input" placeholder={t('chats.deviceNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
      <input className="device-edit-input" placeholder={t('chats.anydeskNumberPlaceholder')} value={anydesk} onChange={(e) => setAnydesk(e.target.value)} />
      <input className="device-edit-input" placeholder={t('chats.passwordPlaceholder')} value={pw} onChange={(e) => setPw(e.target.value)} />
      <div className="device-card-actions">
        <button className="info-item-del" style={{ color: 'var(--success)' }} title={t('chats.save')} onClick={() => onSave({ name: name.trim(), anydesk: anydesk.trim(), pw: pw.trim() })}>
          <Check size={14} />
        </button>
        <button className="info-item-del" title={t('common.cancel')} onClick={onCancel}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function DevicesSection({ contactId }) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAnydesk, setNewAnydesk] = useState('');
  const [newPw, setNewPw] = useState('');

  useEffect(() => {
    if (!contactId) {
      setDevices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    devicesApi
      .list(contactId)
      .then(setDevices)
      .catch((err) => console.error('[API] renderDevices error:', err))
      .finally(() => setLoading(false));
  }, [contactId]);

  async function saveEdit(deviceId, { name, anydesk, pw }) {
    if (!name || !anydesk || !pw) return showToast(t('chats.fillAllDeviceFields'), 'error');
    try {
      const data = await devicesApi.update(contactId, deviceId, { name, anydesk, pw });
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? data.device : d)));
      setEditingId(null);
      showToast(t('chats.deviceUpdated'), 'success');
    } catch (err) {
      console.error('[API] saveEditDevice error:', err);
      showToast(err.response?.data?.error || t('chats.deviceUpdateFailed'), 'error');
    }
  }

  async function removeDevice(deviceId) {
    try {
      await devicesApi.remove(contactId, deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      showToast(t('chats.deviceRemoved'), 'info');
    } catch (err) {
      console.error('[API] removeDevice error:', err);
      showToast(err.response?.data?.error || t('chats.deviceRemoveFailed'), 'error');
    }
  }

  async function addDevice() {
    const name = newName.trim();
    const anydesk = newAnydesk.trim();
    const pw = newPw.trim();
    if (!name || !anydesk || !pw) return showToast(t('chats.fillAllDeviceFields'), 'error');
    try {
      const data = await devicesApi.add(contactId, { name, anydesk, pw });
      setDevices((prev) => [...prev, data.device]);
      setAddOpen(false);
      setNewName('');
      setNewAnydesk('');
      setNewPw('');
      showToast(t('chats.deviceAdded'), 'success');
    } catch (err) {
      console.error('[API] addDevice error:', err);
      showToast(err.response?.data?.error || t('chats.deviceAddFailed'), 'error');
    }
  }

  if (!contactId) {
    return <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 12 }}>{t('chats.linkContactToAddDevices')}</div>;
  }

  return (
    <div>
      <div id="device-list">
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 12 }}>{t('common.loading')}</div>
        ) : devices.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 12 }}>{t('chats.noDevices')}</div>
        ) : (
          devices.map((d) =>
            editingId === d.id ? (
              <DeviceEditForm key={d.id} device={d} onCancel={() => setEditingId(null)} onSave={(patch) => saveEdit(d.id, patch)} />
            ) : (
              <div className="device-card" key={d.id}>
                <div className="device-name">
                  <Monitor size={16} />
                  {d.name}
                </div>
                <div className="device-detail">
                  <Hash size={14} />
                  {t('chats.anydeskLabel')} <strong style={{ color: 'var(--text)' }}>{d.anydesk || '-'}</strong>
                </div>
                <div className="device-detail">
                  <Lock size={14} />
                  {t('chats.passwordLabel')} <span className="device-pw">{d.password || '-'}</span>
                </div>
                <div className="device-card-actions">
                  <button className="info-item-del" title={t('common.edit')} onClick={() => setEditingId(d.id)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="info-item-del" title={t('common.delete')} onClick={() => removeDevice(d.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {!addOpen ? (
        <button id="add-device-btn" className="add-btn" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> {t('chats.addDevice')}
        </button>
      ) : (
        <div id="add-device-form" className="add-form show">
          <input className="device-edit-input" placeholder={t('chats.deviceNamePlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <input className="device-edit-input" placeholder={t('chats.anydeskNumberPlaceholder')} value={newAnydesk} onChange={(e) => setNewAnydesk(e.target.value)} />
          <input className="device-edit-input" placeholder={t('chats.passwordPlaceholder')} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="tpl-save-btn" onClick={addDevice}>
              <Check size={12} /> {t('chats.save')}
            </button>
            <button className="tpl-cancel-btn" onClick={() => setAddOpen(false)}>{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
