'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const MIN_PASSWORD_LENGTH = 8;

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(`/reset-password?error=${encodeURIComponent('Heslo musí mať aspoň ' + MIN_PASSWORD_LENGTH + ' znakov.')}`);
  }

  const supabase = await createClient();

  // Only works because /auth/callback already exchanged the recovery code
  // for a real (short-lived, single purpose) session for this request.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent('Odkaz na obnovu hesla je neplatný alebo expirovaný.')}`);
  }

  redirect('/login?error=' + encodeURIComponent('Heslo bolo zmenené, môžete sa prihlásiť.'));
}
