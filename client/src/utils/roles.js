import i18n from '../i18n';

export function roleLabel(role) {
  return role === 0
    ? i18n.t('roles.superAdmin', { ns: 'common' })
    : role === 1
      ? i18n.t('roles.administrator', { ns: 'common' })
      : i18n.t('roles.agent', { ns: 'common' });
}

export function roleBadgeClass(role) {
  return role <= 1 ? 'role-admin' : 'role-agent';
}
