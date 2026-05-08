/**
 * When true, new email/password accounts are marked verified at registration so
 * credentials login works without opening a link (intended for local/dev).
 */
export function isMockEmailVerification(): boolean {
  return process.env.MOCK_EMAIL_VERIFICATION?.trim().toLowerCase() === "true";
}
