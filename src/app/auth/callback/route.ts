import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/safeRedirect';

/**
 * Handles both the signup e-mail confirmation link and the password-recovery
 * link - Supabase Auth issues both as a `code` to exchange for a session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `${origin}${next}` alone isn't enough - a `next` of "@evil.com" turns
  // that into "http://ourdomain@evil.com", parsed as userinfo, not a path.
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Odkaz je neplatný alebo expirovaný.')}`);
}
