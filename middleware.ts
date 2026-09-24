import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

/**
 * Was `proxy.ts` (Next 16's newer name for this file) - reverted after live
 * testing found it was silently never invoked at all under `next dev`
 * --turbopack in this environment (every page under these prefixes was
 * actually reachable unauthenticated; requests weren't even hitting the
 * redirect below). `middleware.ts` is the older, unambiguously-supported
 * convention and DID work once renamed back - but given a whole file
 * convention silently no-op'd once already, this can't be the only thing
 * gating a page. Every page below now redirects unauthenticated/non-admin
 * requests itself (see profile/page.tsx, admin/layout.tsx, credit/topup/
 * page.tsx, orders/[id]/page.tsx, etc.) - this middleware is defense in
 * depth on top of that, not the boundary.
 */
const AUTH_REQUIRED_PREFIXES = ['/profile', '/orders', '/credit', '/admin'];
const ADMIN_REQUIRED_PREFIX = '/admin';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // Required by @supabase/ssr - refreshes the session cookie if needed.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = AUTH_REQUIRED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (needsAuth && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith(ADMIN_REQUIRED_PREFIX) && user) {
    // Re-checked here (not trusted from a JWT claim) so a revoked admin
    // right takes effect immediately, not just after the session refreshes.
    // The real enforcement is still RLS/the SECURITY DEFINER functions -
    // this is just so a non-admin gets redirected instead of a 403 page.
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/courts', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and images, so the
     * session cookie stays fresh on every navigation.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
