import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Second, independent check that every /admin/* page is actually reached
 * only by an admin - middleware.ts does the same check to redirect a
 * non-admin before any admin page even renders, but a layout here means
 * that protection doesn't depend on middleware alone (a misconfigured
 * matcher, a renamed file, a bundler quirk) ever being the only thing
 * standing between a logged-in non-admin and this UI. The actual data/money
 * boundary is still RLS and the SECURITY DEFINER functions - this is only
 * about not rendering the admin screens at all for the wrong user.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

  if (!profile?.is_admin) {
    redirect('/courts');
  }

  return children;
}
