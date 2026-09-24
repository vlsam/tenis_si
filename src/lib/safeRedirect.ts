/**
 * Confirmed live (2026-09-24): a `next=https://evil.example.com` on /login
 * survived unchanged into `redirect(next)` and the browser actually
 * navigated there after a successful login - a classic open-redirect used
 * to make a phishing link look like it points at our own domain up until
 * the post-login bounce. `redirect(\`${origin}${next}\`)` isn't safe either -
 * a `next` of `@evil.com` turns that into `http://ourdomain@evil.com`, which
 * browsers parse as userinfo "ourdomain" at host "evil.com".
 *
 * Only a same-origin, root-relative path is safe: anything not starting
 * with exactly one `/` (blocks absolute URLs, `//evil.com` protocol-relative,
 * and the `@`/backslash tricks above) falls back to `fallback`.
 */
export function safeNextPath(value: string | null | undefined, fallback = '/courts'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}
