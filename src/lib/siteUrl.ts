/**
 * `NEXT_PUBLIC_SITE_URL` is embedded in outgoing links (password reset,
 * signup confirmation, the club's order confirm/reject e-mail). Failing loud
 * here if it's unset is deliberate: the alternative is a silently broken
 * "undefined/auth/callback?..." link mailed out to a real user, which is
 * both confusing and only ever gets noticed when someone complains it
 * doesn't work - see `createAdminClient()` for the same pattern.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be set - it is embedded in outgoing e-mail links.');
  }
  return url;
}
