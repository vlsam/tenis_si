'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/siteUrl';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`
  });

  // Always the same outcome/redirect regardless of whether the e-mail
  // exists, so this can't be used to enumerate registered accounts.
  redirect('/forgot-password/sent');
}
