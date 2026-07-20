export function roleLabel(role) {
  return role === 0 ? 'Super Admin' : role === 1 ? 'Administrator' : 'Agent';
}

export function roleBadgeClass(role) {
  return role <= 1 ? 'role-admin' : 'role-agent';
}
