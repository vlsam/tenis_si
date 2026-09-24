import { timingSafeEqual } from 'crypto';

/**
 * Constant-time secret comparison for the two webhook endpoints that
 * authenticate purely via a shared secret in the request (cron's bearer
 * header, the SMS route's URL segment) - a plain `===` leaks how many
 * leading bytes matched through response-time differences. The mismatch is
 * only ever a handful of nanoseconds per byte, so this is a low-severity
 * hardening, not a fix for a demonstrated exploit.
 */
export function secretEquals(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws instead of returning false on a length mismatch -
  // a length check here is itself a (much smaller, harder to exploit over a
  // network, and largely unavoidable for variable-length secrets) timing
  // signal, but that tradeoff is standard practice for this comparison.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
