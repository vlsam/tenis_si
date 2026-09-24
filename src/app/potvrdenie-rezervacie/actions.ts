'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Executes the club's approve/reject decision from a POST (a real click on
 * the confirmation page's button), never a bare GET - see page.tsx's header
 * comment for why. Still unauthenticated in the Supabase-session sense: the
 * order's own one-time `token` (carried in a hidden field, originally from
 * the e-mail link) is what club_decide_order() checks.
 */
export async function decideOrder(formData: FormData) {
  const id = Number(formData.get('id'));
  const token = String(formData.get('token') ?? '');
  const action = String(formData.get('action') ?? '');

  if (!id || !token || (action !== 'confirm' && action !== 'reject')) {
    redirect(`/potvrdenie-rezervacie?error=${encodeURIComponent('Neplatná požiadavka.')}`);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('club_decide_order', {
    p_order_id: id,
    p_approve: action === 'confirm',
    p_token: token
  });

  if (error || !data) {
    redirect(
      `/potvrdenie-rezervacie?id=${id}&token=${token}&action=${action}&error=${encodeURIComponent(
        'Odkaz je neplatný alebo rezervácia už bola spracovaná.'
      )}`
    );
  }

  redirect(`/potvrdenie-rezervacie?done=1&id=${id}&status=${data.status}`);
}
