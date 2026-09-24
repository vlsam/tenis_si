'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function cancelOrder(formData: FormData) {
  const orderId = Number(formData.get('orderId'));
  const supabase = await createClient();

  // `cancel_order` itself re-checks is_admin() and refunds credit if the
  // order was already paid - this Server Action isn't the security boundary.
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });

  if (error) {
    redirect(`/admin/orders?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/orders');
  redirect('/admin/orders');
}
