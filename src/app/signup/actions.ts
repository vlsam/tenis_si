'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/siteUrl';

const MIN_PASSWORD_LENGTH = 8;

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const firstName = String(formData.get('firstName') ?? '');
  const lastName = String(formData.get('lastName') ?? '');

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(`/signup?error=${encodeURIComponent('Heslo musí mať aspoň ' + MIN_PASSWORD_LENGTH + ' znakov.')}`);
  }

  const supabase = await createClient();

  // Supabase Auth handles the password hash, the confirmation e-mail and the
  // one-time confirmation token itself - none of that is hand-rolled here.
  // The `_handle_new_auth_user` trigger (see migration) creates the matching
  // `profiles` row.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/signup/success');
}
