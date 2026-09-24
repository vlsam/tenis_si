'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function confirmTopUp(formData: FormData) {
  const transactionId = Number(formData.get('transactionId'));
  const supabase = await createClient();

  // `confirm_topup` itself re-checks is_admin() and raises if not - this
  // Server Action isn't the security boundary, the Postgres function is.
  const { error } = await supabase.rpc('confirm_topup', { p_transaction_id: transactionId });

  if (error) {
    redirect(`/admin/credit/pending?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/credit/pending');
  redirect('/admin/credit/pending');
}
