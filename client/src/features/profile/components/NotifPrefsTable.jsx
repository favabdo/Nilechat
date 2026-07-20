const NOTIF_PREF_LABELS = {
  conversation_created: 'A new conversation is created',
  conversation_assigned: 'A conversation is assigned to you',
  conversation_mention: 'You are mentioned in a conversation',
  assigned_conversation_message: 'A new message is created in an assigned conversation',
  participating_conversation_message: 'A new message is created in a participating conversation',
};

export default function NotifPrefsTable({ prefs, onToggle }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: 'left' }}>
          <th style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Notification type</th>
          <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', width: 70 }}>
            Email
          </th>
          <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', width: 70 }}>
            Push
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(NOTIF_PREF_LABELS).map((key) => {
          const pref = prefs[key] || { email: false, push: false };
          return (
            <tr key={key} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 8px' }}>{NOTIF_PREF_LABELS[key]}</td>
              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  className="notif-check"
                  checked={!!pref.email}
                  onChange={(e) => onToggle(key, 'email', e.target.checked)}
                />
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  className="notif-check"
                  checked={!!pref.push}
                  onChange={(e) => onToggle(key, 'push', e.target.checked)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
