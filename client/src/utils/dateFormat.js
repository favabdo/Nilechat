// نفس الدوال بالظبط من dashboard.html (formatTime / formatDateTimeLabel / formatMessageTimestamp / daysAgoLabel)

export function formatTime(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// لو المحادثة النهارده بيرجع الوقت بس، لو مش النهارده بيرجع التاريخ والوقت مع بعض
export function formatDateTimeLabel(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return timeStr;
  const dateStr = d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${dateStr} • ${timeStr}`;
}

// التاريخ + الوقت مع بعض دايمًا (من غير اختصار Today/Yesterday)
export function formatMessageTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${dateStr} • ${timeStr}`;
}

export function daysAgoLabel(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

// نفس formatSchedDate() الأصلية — مستخدمة في Scheduled Tasks و Customer Details (زيارات وعقود صيانة)
export function formatSchedDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// فرق الأيام بين تاريخين، بصيغة "X يوم (~Y شهر)" — مستخدمة في إحصائيات عقد الصيانة
export function formatDurationDays(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  const days = Math.round((to - from) / (1000 * 60 * 60 * 24));
  if (isNaN(days)) return '-';
  const months = Math.round(days / 30.44);
  return `${days} يوم (~${months} شهر)`;
}
