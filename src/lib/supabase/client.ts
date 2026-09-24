import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

/**
 * Supabase client for Client Components. Also runs AS the signed-in user
 * and is still subject to RLS - this is not a privilege escalation, it's
 * the same anon key that's already public in the page source either way.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
