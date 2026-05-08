/**
 * Opt-in auth diagnostics. Set AUTH_DEBUG=1 in .env.local (never enable in public logs).
 * Passwords and hashes are never logged.
 */
function authDebugEnabled(): boolean {
  const v = process.env.AUTH_DEBUG?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function authDebug(
  stage: string,
  detail?: Record<string, unknown>,
): void {
  if (!authDebugEnabled()) return;
  if (!detail) {
    console.log(`[auth][debug] ${stage}`);
    return;
  }
  const safe: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(detail)) {
    if (/password|hash|secret|token/i.test(key)) {
      safe[key] = "[redacted]";
    } else {
      safe[key] = val;
    }
  }
  console.log(`[auth][debug] ${stage}`, safe);
}
