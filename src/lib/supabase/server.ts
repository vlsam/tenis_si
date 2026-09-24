import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

/**
 * Supabase client for Server Components / Server Actions / Route Handlers.
 * Runs AS the signed-in user (their JWT, from the session cookie) - every
 * query through this client is still subject to RLS. This is the client
 * almost everything in this app should use.
 *
 * Async because `cookies()` itself is async since Next.js 15 - deliberately
 * NOT using the `UnsafeUnwrappedCookies` escape hatch some codemods reach
 * for here (it's named "unsafe" for a reason, and removed outright in later
 * Next major versions), so every caller does `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render - the middleware
            // refreshes the session instead, this can be safely ignored.
          }
        }
      }
    }
  );
}
