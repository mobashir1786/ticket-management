export const CATEGORIES = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'GENERAL'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function label(value) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function userLabel(user) {
  const name = user?.name || 'Unknown user';
  return user?.role ? `${name} · ${label(user.role)}` : name;
}
