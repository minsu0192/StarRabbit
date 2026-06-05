export const ADMIN_EMAILS = new Set(['minsu0192@gmail.com']);

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.toLowerCase()));
}
