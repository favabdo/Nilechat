export function roleLabel(role, lang = 'en') {
  if (lang === 'ar') {
    return role === 0 ? 'مالك أعلى' : role === 1 ? 'مسؤول' : 'موظف';
  }
  return role === 0 ? 'Super Admin' : role === 1 ? 'Administrator' : 'Agent';
}

export function roleBadgeClass(role) {
  return role <= 1 ? 'role-admin' : 'role-agent';
}
