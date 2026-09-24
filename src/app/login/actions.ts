'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/safeRedirect';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(String(formData.get('next') ?? ''));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same generic message regardless of the actual cause, so this endpoint
    // can't be used to enumerate which e-mails have an account.
    redirect(`/login?error=${encodeURIComponent('Nesprávne prihlasovacie údaje.')}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
