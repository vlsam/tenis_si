import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

/**
 * SERVICE-ROLE client - bypasses RLS entirely. `import 'server-only'` makes
 * any accidental import from a Client Component a build-time error, and the
 * service key itself is read from a non-`NEXT_PUBLIC_` env var so Next.js
 * never inlines it into browser bundles.
 *
 * Only use this for the handful of things that genuinely can't go through a
 * signed-in user's RLS-scoped client: the SMS-gateway webhook, the
 * unauthenticated e-mail confirm/reject link (both only protected by their
 * own secret token, not a Supabase session), and the scheduled
 * expire-stale-orders job. Everything else in this app should use
 * `lib/supabase/server.ts` instead.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
