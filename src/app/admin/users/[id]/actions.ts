'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function grantCashCredit(formData: FormData) {
  const userId = String(formData.get('userId'));
  const amount = Number(formData.get('amount'));
  const note = String(formData.get('note') ?? '');

  const supabase = await createClient();

  // `grant_cash_credit` itself re-checks is_admin() and validates
  // amount/note - this Server Action isn't the security boundary.
  const { error } = await supabase.rpc('grant_cash_credit', {
    p_user_id: userId,
    p_amount: amount,
    p_note: note
  });

  if (error) {
    redirect(`/admin/users/${userId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}`);
}
