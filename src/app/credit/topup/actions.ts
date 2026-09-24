'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requestTopUp(formData: FormData) {
  const amount = Number(formData.get('amount'));
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('request_topup', { p_amount: amount });

  if (error || !data) {
    redirect(`/credit/topup?error=${encodeURIComponent(error?.message ?? 'Požiadavku sa nepodarilo vytvoriť.')}`);
  }

  redirect(`/credit/topup/${data.id}`);
}

export async function markTopUpPaid(formData: FormData) {
  const transactionId = Number(formData.get('transactionId'));
  const supabase = await createClient();

  await supabase.rpc('mark_topup_paid', { p_transaction_id: transactionId });

  redirect(`/credit/topup/${transactionId}`);
}
